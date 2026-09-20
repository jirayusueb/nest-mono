import { describe, expect, it } from "vitest";
import {
  mockDateProvider,
  mockIdGenerator,
} from "../../../../shared/application/testing/mocks";
import type { AuthIdentity } from "../ports/i-identity-repository";
import { SessionIssuer } from "../services/session-issuer";
import {
  mockIdentityRepository,
  mockPasswordHasher,
  mockSessionRepository,
  mockSessionTokenService,
} from "../testing/mocks";
import { SignInUseCase } from "./sign-in";

const NOW = new Date("2026-01-01T00:00:00.000Z");

const ADA: AuthIdentity = {
  id: "u1",
  name: "Ada",
  email: "ada@example.com",
  image: null,
  emailVerified: false,
  passwordHash: "prefix:supersecret",
};

function setup(seed: AuthIdentity[] = [ADA]) {
  const { repo: identities } = mockIdentityRepository(seed);
  const clock = mockDateProvider(NOW);

  const useCase = new SignInUseCase(
    identities,
    mockPasswordHasher(),
    new SessionIssuer(
      mockSessionRepository().repo,
      mockSessionTokenService(),
      mockIdGenerator(),
      clock,
      new Set<string>(),
    ),
    clock,
  );

  return { useCase };
}

const VALID = {
  email: "ada@example.com",
  password: "supersecret",
  ipAddress: "127.0.0.1",
  userAgent: "bun-test",
};

describe("sign in", () => {
  it("issues a session for valid credentials", async () => {
    const { useCase } = setup();

    const result = await useCase.execute(VALID);

    expect(result.isOk()).toBe(true);
    expect(result.unwrap().user.email).toBe("ada@example.com");
    expect(result.unwrap().token).toBe("raw-token");
  });

  it("rejects an unknown email with the generic message", async () => {
    const { useCase } = setup();

    const result = await useCase.execute({
      ...VALID,
      email: "nobody@example.com",
    });

    expect(result.isErr()).toBe(true);
    expect(result.isErr() && result.error.message).toBe(
      "Invalid email or password",
    );
  });

  it("rejects a wrong password with the generic message", async () => {
    const { useCase } = setup();

    const result = await useCase.execute({ ...VALID, password: "wrongpass" });

    expect(result.isErr()).toBe(true);
    expect(result.isErr() && result.error.code).toBe("Unauthorized");
  });
});
