import { describe, expect, it } from "vitest";
import type { SessionId, UserId } from "../../../../shared/kernel/types/ids";
import { make } from "../../../../shared/kernel/types/brand";
import { SessionEntity } from "./session-entity";
import { fakeTokenHash } from "../testing/fake-token-hash";

const NOW = new Date("2026-01-01T00:00:00.000Z");

function create(input: { tokenHash: string; expiresAt: Date; now?: Date }) {
  return SessionEntity.create(
    make<SessionId>("s1"),
    make<UserId>("u1"),
    input.tokenHash,
    input.expiresAt,
    input.now ?? NOW,
  );
}

describe("session entity create", () => {
  it("rejects a token hash that is not a SHA-256 digest", () => {
    const result = create({
      tokenHash: "hashed:raw-token",
      expiresAt: new Date("2026-01-08T00:00:00.000Z"),
    });

    expect(result.isErr()).toBe(true);
    expect(result.isErr() && result.error.code).toBe("DomainError");
  });

  it("rejects an expiry that is not in the future", () => {
    const result = create({
      tokenHash: fakeTokenHash("tok"),
      expiresAt: NOW,
    });

    expect(result.isErr()).toBe(true);
    expect(result.isErr() && result.error.code).toBe("DomainError");
  });

  it("accepts a valid digest and stamps the creation instant", () => {
    const result = create({
      tokenHash: fakeTokenHash("tok"),
      expiresAt: new Date("2026-01-08T00:00:00.000Z"),
    });

    expect(result.isOk()).toBe(true);
    expect(result.unwrap().createdAt).toBe(NOW);
  });
});
