import { describe, expect, it } from "bun:test";
import {
  MockDateProvider,
  MockIdGenerator,
} from "../../../../shared/application/testing/mocks";
import type { AuthIdentity } from "../ports/i-identity-repository";
import { SessionIssuer } from "../services/session-issuer";
import {
  FixedSessionTokenService,
  MockIdentityRepository,
  MockSessionRepository,
  PrefixPasswordHasher,
} from "../testing/mocks";
import { SignIn } from "./sign-in";

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
  const identities = new MockIdentityRepository();
  identities.identities.push(...seed);
  const clock = new MockDateProvider(NOW);

  const useCase = new SignIn(
    identities,
    new PrefixPasswordHasher(),
    new SessionIssuer(
      new MockSessionRepository(),
      new FixedSessionTokenService(),
      new MockIdGenerator(),
      clock,
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
