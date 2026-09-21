import { describe, expect, it } from "vitest";

import { SessionIssuer } from "~/features/auth/application/services/session-issuer";
import {
  mockIdentityRepository,
  mockPasswordHasher,
  mockSessionRepository,
  mockSessionTokenService,
} from "~/features/auth/application/testing/mocks";
import {
  mockDateProvider,
  mockIdGenerator,
  mockUnitOfWork,
} from "~/shared/application/testing/mocks";

import { SignUpUseCase } from "./sign-up";

const NOW = new Date("2026-01-01T00:00:00.000Z");

function setup() {
  const { repo: identityRepo, identities } = mockIdentityRepository();
  const { repo: sessionRepo, sessions } = mockSessionRepository();
  const clock = mockDateProvider(NOW);
  const ids = mockIdGenerator();

  const useCase = new SignUpUseCase(
    identityRepo,
    mockPasswordHasher(),
    new SessionIssuer(
      sessionRepo,
      mockSessionTokenService(),
      ids,
      clock,
      new Set<string>(),
    ),
    ids,
    clock,
    mockUnitOfWork(),
  );

  return { identities, sessions, useCase };
}

const VALID = {
  email: "Ada@Example.com",
  ipAddress: null,
  name: "Ada",
  password: "Supersecret1",
  userAgent: null,
};

describe("sign up", () => {
  it("registers the identity and issues a session", async () => {
    const { identities, sessions, useCase } = setup();

    const result = await useCase.execute(VALID);

    expect(result.isOk()).toBe(true);
    const issued = result.unwrap();
    expect(issued.user.email).toBe("ada@example.com");
    expect(issued.user.emailVerified).toBe(false);
    expect(issued.token).toBe("raw-token");
    expect(issued.expiresAt.toISOString()).toBe("2026-01-08T00:00:00.000Z");
    expect(identities).toHaveLength(1);
    expect(identities[0]?.passwordHash).toBe("prefix:Supersecret1");
    expect(sessions[0]?.tokenHash).not.toBe(issued.token);
    expect(sessions[0]?.tokenHash).toMatch(/^[0-9a-f]{64}$/u);
  });

  it("rejects an email that is already registered", async () => {
    const { useCase } = setup();
    await useCase.execute(VALID);

    const result = await useCase.execute({
      ...VALID,
      email: "ada@example.com",
    });

    expect(result.isErr()).toBe(true);
    expect(result.isErr() && result.error.code).toBe("Conflict");
  });

  it("rejects a short password", async () => {
    const { useCase } = setup();

    const result = await useCase.execute({ ...VALID, password: "short" });

    expect(result.isErr()).toBe(true);
    expect(result.isErr() && result.error.code).toBe("DomainError");
  });

  it("rejects a password missing an uppercase letter or number", async () => {
    const { useCase } = setup();

    const result = await useCase.execute({ ...VALID, password: "supersecret" });

    expect(result.isErr()).toBe(true);
    expect(result.isErr() && result.error.code).toBe("DomainError");
  });

  it("rejects a blank name", async () => {
    const { useCase } = setup();

    const result = await useCase.execute({ ...VALID, name: "   " });

    expect(result.isErr()).toBe(true);
    expect(result.isErr() && result.error.code).toBe("ValidationFailed");
  });
});
