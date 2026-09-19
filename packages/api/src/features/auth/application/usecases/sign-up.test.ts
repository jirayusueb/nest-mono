import { describe, expect, it } from "bun:test";
import {
  MockDateProvider,
  MockIdGenerator,
} from "../../../../shared/application/testing/mocks";
import { SessionIssuer } from "../services/session-issuer";
import {
  FixedSessionTokenService,
  MockIdentityRepository,
  MockSessionRepository,
  PrefixPasswordHasher,
} from "../testing/mocks";
import { SignUp } from "./sign-up";

const NOW = new Date("2026-01-01T00:00:00.000Z");

function setup() {
  const identities = new MockIdentityRepository();
  const sessions = new MockSessionRepository();
  const clock = new MockDateProvider(NOW);
  const ids = new MockIdGenerator();

  const useCase = new SignUp(
    identities,
    new PrefixPasswordHasher(),
    new SessionIssuer(sessions, new FixedSessionTokenService(), ids, clock),
    ids,
    clock,
  );

  return { identities, sessions, useCase };
}

const VALID = {
  email: "Ada@Example.com",
  ipAddress: null,
  name: "Ada",
  password: "supersecret",
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
    expect(identities.identities).toHaveLength(1);
    expect(identities.identities[0]?.passwordHash).toBe("prefix:supersecret");
    // digest only, never the cookie value
    expect(sessions.sessions[0]?.tokenHash).toBe("hashed:raw-token");
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
    expect(result.isErr() && result.error.code).toBe("ValidationFailed");
  });

  it("rejects a blank name", async () => {
    const { useCase } = setup();

    const result = await useCase.execute({ ...VALID, name: "   " });

    expect(result.isErr()).toBe(true);
    expect(result.isErr() && result.error.code).toBe("ValidationFailed");
  });
});
