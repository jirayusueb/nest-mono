import type { SessionId, UserId } from "../../../../shared/kernel/types/ids";
import type { Email } from "../../../../shared/kernel/values/email";
import { Session, type SessionProps } from "../../domain/entities/session";
import type {
  AuthIdentity,
  IIdentityRepository,
  NewIdentity,
} from "../ports/i-identity-repository";
import type { IPasswordHasher } from "../ports/i-password-hasher";
import type { ISessionRepository } from "../ports/i-session-repository";
import type { ISessionTokenService } from "../ports/i-session-token-service";

export class MockIdentityRepository implements IIdentityRepository {
  identities: AuthIdentity[] = [];

  async findByEmail(email: Email): Promise<AuthIdentity | null> {
    return this.identities.find((i) => i.email === email.value) ?? null;
  }

  async findById(id: UserId): Promise<AuthIdentity | null> {
    return this.identities.find((i) => i.id === id) ?? null;
  }

  async emailExists(email: Email): Promise<boolean> {
    return this.identities.some((i) => i.email === email.value);
  }

  async createWithCredential(input: NewIdentity): Promise<AuthIdentity> {
    const identity: AuthIdentity = {
      id: input.userId,
      name: input.name,
      email: input.email,
      image: null,
      emailVerified: false,
      passwordHash: input.passwordHash,
    };

    this.identities.push(identity);

    return identity;
  }
}

export class MockSessionRepository implements ISessionRepository {
  sessions: Session[] = [];

  async save(entity: Session): Promise<void> {
    this.sessions.push(entity);
  }

  async findByTokenHash(tokenHash: string): Promise<Session | null> {
    return this.sessions.find((s) => s.tokenHash === tokenHash) ?? null;
  }

  async deleteByTokenHash(tokenHash: string): Promise<void> {
    this.sessions = this.sessions.filter((s) => s.tokenHash !== tokenHash);
  }
}

export class PrefixPasswordHasher implements IPasswordHasher {
  async hash(plain: string): Promise<string> {
    return `prefix:${plain}`;
  }

  async verify(plain: string, stored: string): Promise<boolean> {
    return stored === `prefix:${plain}`;
  }
}

export class FixedSessionTokenService implements ISessionTokenService {
  async issue(): Promise<{ token: string; tokenHash: string }> {
    return { token: "raw-token", tokenHash: "hashed:raw-token" };
  }

  async hash(raw: string): Promise<string> {
    return `hashed:${raw}`;
  }
}

/** Handy factory for wiring a stored session in one line. */
export function storedSession(overrides: Partial<SessionProps> = {}): Session {
  // SAFETY: fixture literals stand in for schema-issued ids.
  return Session.restore({
    id: "s1" as SessionId,
    userId: "u1" as UserId,
    tokenHash: "hashed:tok",
    expiresAt: new Date("2026-01-02T00:00:00.000Z"),
    ipAddress: null,
    userAgent: null,
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    ...overrides,
  });
}
