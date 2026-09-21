import { createMock, type DeepMocked } from "@golevelup/ts-vitest";

import type {
  AuthIdentity,
  IIdentityRepository,
} from "~/features/auth/application/ports/i-identity-repository";
import type { IPasswordHasher } from "~/features/auth/application/ports/i-password-hasher";
import type { ISessionRepository } from "~/features/auth/application/ports/i-session-repository";
import type { ISessionTokenService } from "~/features/auth/application/ports/i-session-token-service";
import { SessionEntity } from "~/features/auth/domain/entities/session-entity";
import { fakeTokenHash } from "~/features/auth/domain/testing/fake-token-hash";
import type { SessionId, UserId } from "~/shared/kernel/types/ids";

export interface MockIdentityRepo {
  repo: DeepMocked<IIdentityRepository>;
  identities: AuthIdentity[];
}

export function mockIdentityRepository(
  seed: AuthIdentity[] = [],
): MockIdentityRepo {
  const identities = [...seed];

  const repo = createMock<IIdentityRepository>({
    findByEmail: async (email) =>
      identities.find((i) => i.email === email.value) ?? null,
    findById: async (id) => identities.find((i) => i.id === id) ?? null,
    emailExists: async (email) =>
      identities.some((i) => i.email === email.value),
    createWithCredential: async (input) => {
      const identity: AuthIdentity = {
        id: input.userId,
        name: input.name,
        email: input.email,
        image: null,
        emailVerified: false,
        passwordHash: input.passwordHash,
      };

      identities.push(identity);

      return identity;
    },
  });

  return { repo, identities };
}

export interface MockSessionRepo {
  repo: DeepMocked<ISessionRepository>;
  sessions: SessionEntity[];
}

export function mockSessionRepository(
  seed: SessionEntity[] = [],
): MockSessionRepo {
  const sessions = [...seed];

  const repo = createMock<ISessionRepository>({
    save: async (entity) => {
      sessions.push(entity);
    },
    findByTokenHash: async (tokenHash) =>
      sessions.find((s) => s.tokenHash === tokenHash) ?? null,
    deleteByTokenHash: async (tokenHash) => {
      const index = sessions.findIndex((s) => s.tokenHash === tokenHash);

      if (index !== -1) {
        sessions.splice(index, 1);
      }
    },
  });

  return { repo, sessions };
}

export function mockPasswordHasher(): DeepMocked<IPasswordHasher> {
  return createMock<IPasswordHasher>({
    hash: async (plain) => `prefix:${plain}`,
    verify: async (plain, stored) => stored === `prefix:${plain}`,
  });
}

export function mockSessionTokenService(): DeepMocked<ISessionTokenService> {
  return createMock<ISessionTokenService>({
    issue: async () => ({
      token: "raw-token",
      tokenHash: fakeTokenHash("raw-token"),
    }),
    hash: async (raw) => fakeTokenHash(raw),
  });
}

interface StoredSessionOverrides {
  id?: SessionId;
  userId?: UserId;
  tokenHash?: string;
  expiresAt?: Date;
  ipAddress?: string | null;
  userAgent?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export function storedSession(
  overrides: StoredSessionOverrides = {},
): SessionEntity {
  // SAFETY: fixture literals stand in for schema-issued ids.
  const p = {
    id: "s1" as SessionId,
    userId: "u1" as UserId,
    tokenHash: fakeTokenHash("tok"),
    expiresAt: new Date("2026-01-02T00:00:00.000Z"),
    ipAddress: null,
    userAgent: null,
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    ...overrides,
  };

  return SessionEntity.restore(
    p.id,
    p.userId,
    p.tokenHash,
    p.expiresAt,
    p.ipAddress,
    p.userAgent,
    p.createdAt,
    p.updatedAt,
  );
}
