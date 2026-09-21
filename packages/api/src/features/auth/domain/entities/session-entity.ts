import type { AppError } from "~/shared/kernel/errors/app-error";
import { DomainError } from "~/shared/kernel/errors/domain-error";
import type { SessionId, UserId } from "~/shared/kernel/types/ids";
import { err, ok } from "~/shared/kernel/types/result";
import type { Result } from "~/shared/kernel/types/result";

const TOKEN_HASH_PATTERN = /^[0-9a-f]{64}$/u;

export class SessionEntity {
  static readonly TTL_SECONDS = 604_800;

  private constructor(
    public readonly id: SessionId,
    public readonly userId: UserId,
    public readonly tokenHash: string,
    public readonly expiresAt: Date,
    public readonly ipAddress: string | null,
    public readonly userAgent: string | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}

  static create(
    id: SessionId,
    userId: UserId,
    tokenHash: string,
    expiresAt: Date,
    now: Date,
    ipAddress: string | null = null,
    userAgent: string | null = null,
  ): Result<SessionEntity, AppError> {
    const invalid = SessionEntity.validate(tokenHash, expiresAt, now);

    if (invalid.isErr()) {
      return err(invalid.error);
    }

    return ok(
      new SessionEntity(
        id,
        userId,
        tokenHash,
        expiresAt,
        ipAddress,
        userAgent,
        now,
        now,
      ),
    );
  }

  private static validate(
    tokenHash: string,
    expiresAt: Date,
    now: Date,
  ): Result<void, AppError> {
    if (!TOKEN_HASH_PATTERN.test(tokenHash)) {
      return err(
        new DomainError("Session token hash must be a SHA-256 digest"),
      );
    }

    if (expiresAt.getTime() <= now.getTime()) {
      return err(new DomainError("Session expiry must be in the future"));
    }

    return ok();
  }

  static restore(
    id: SessionId,
    userId: UserId,
    tokenHash: string,
    expiresAt: Date,
    ipAddress: string | null,
    userAgent: string | null,
    createdAt: Date,
    updatedAt: Date,
  ): SessionEntity {
    return new SessionEntity(
      id,
      userId,
      tokenHash,
      expiresAt,
      ipAddress,
      userAgent,
      createdAt,
      updatedAt,
    );
  }

  isExpired(now: Date): boolean {
    return this.expiresAt.getTime() <= now.getTime();
  }
}
