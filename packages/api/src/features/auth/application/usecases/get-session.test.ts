import { describe, expect, it } from "vitest";
import { mockDateProvider } from "../../../../shared/application/testing/mocks";
import { GetSessionUseCase } from "./get-session";
import {
  mockIdentityRepository,
  mockSessionRepository,
  mockSessionTokenService,
  storedSession,
} from "../testing/mocks";

const NOW = new Date("2026-01-01T12:00:00.000Z");

function setup(adminEmails: ReadonlySet<string> = new Set()) {
  const { repo: identities } = mockIdentityRepository([
    {
      id: "u1",
      name: "Ada",
      email: "ada@example.com",
      image: null,
      emailVerified: false,
      passwordHash: "prefix:supersecret",
    },
  ]);
  const { repo: sessionRepo, sessions } = mockSessionRepository();

  const useCase = new GetSessionUseCase(
    sessionRepo,
    mockSessionTokenService(),
    identities,
    mockDateProvider(NOW),
    adminEmails,
  );

  return { sessions, useCase };
}

describe("get session", () => {
  it("resolves a valid token to session plus user", async () => {
    const { sessions, useCase } = setup();
    sessions.push(
      storedSession({ expiresAt: new Date("2026-01-01T13:00:00.000Z") }),
    );

    const resolved = await useCase.execute({ token: "tok" });

    expect(resolved?.session.id).toBe("s1");
    expect(resolved?.user.role).toBe("user");
  });

  it("resolves an expired session to null", async () => {
    const { sessions, useCase } = setup();
    sessions.push(
      storedSession({ expiresAt: new Date("2026-01-01T11:00:00.000Z") }),
    );

    expect(await useCase.execute({ token: "tok" })).toBeNull();
  });

  it("resolves an unknown token to null", async () => {
    const { useCase } = setup();

    expect(await useCase.execute({ token: "nope" })).toBeNull();
  });

  it("resolves a user in the admin allowlist to the admin role", async () => {
    const { sessions, useCase } = setup(new Set(["ada@example.com"]));
    sessions.push(
      storedSession({ expiresAt: new Date("2026-01-01T13:00:00.000Z") }),
    );

    const resolved = await useCase.execute({ token: "tok" });

    expect(resolved?.user.role).toBe("admin");
  });
});
