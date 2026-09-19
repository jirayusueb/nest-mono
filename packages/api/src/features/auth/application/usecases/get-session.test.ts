import { describe, expect, it } from "bun:test";
import { MockDateProvider } from "../../../../shared/application/testing/mocks";
import { GetSession } from "./get-session";
import {
  FixedSessionTokenService,
  MockIdentityRepository,
  MockSessionRepository,
  storedSession,
} from "../testing/mocks";

const NOW = new Date("2026-01-01T12:00:00.000Z");

function setup() {
  const identities = new MockIdentityRepository();
  identities.identities.push({
    id: "u1",
    name: "Ada",
    email: "ada@example.com",
    image: null,
    emailVerified: false,
    passwordHash: "prefix:supersecret",
  });
  const sessions = new MockSessionRepository();

  const useCase = new GetSession(
    sessions,
    new FixedSessionTokenService(),
    identities,
    new MockDateProvider(NOW),
  );

  return { sessions, useCase };
}

describe("get session", () => {
  it("resolves a valid token to session plus user", async () => {
    const { sessions, useCase } = setup();
    sessions.sessions.push(
      storedSession({ expiresAt: new Date("2026-01-01T13:00:00.000Z") }),
    );

    const result = await useCase.execute({ token: "tok" });

    expect(result.isOk()).toBe(true);
    const resolved = result.unwrap();
    expect(resolved?.session.id).toBe("s1");
    expect(resolved?.user.email).toBe("ada@example.com");
  });

  it("resolves an expired session to null", async () => {
    const { sessions, useCase } = setup();
    sessions.sessions.push(
      storedSession({ expiresAt: new Date("2026-01-01T11:00:00.000Z") }),
    );

    const result = await useCase.execute({ token: "tok" });

    expect(result.unwrap()).toBeNull();
  });

  it("resolves an unknown token to null", async () => {
    const { useCase } = setup();

    const result = await useCase.execute({ token: "nope" });

    expect(result.unwrap()).toBeNull();
  });
});
