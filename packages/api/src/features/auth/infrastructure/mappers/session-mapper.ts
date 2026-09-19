import type { session } from "../../../../db/schema/auth";
import type { SessionId, UserId } from "../../../../shared/kernel/types/ids";
import { Session } from "../../domain/entities/session";

type SessionRow = typeof session.$inferSelect;

type SessionInsert = typeof session.$inferInsert;

export class SessionMapper {
  /**
   * STRICT RULE: always restore(), never issue() — persistence rows are a
   * trusted source. `token` holds the digest, never the cookie value.
   */
  static toDomain(row: SessionRow): Session {
    // SAFETY: rows come from our own schema; branded ids restore without
    // revalidation.
    return Session.restore({
      createdAt: row.createdAt,
      expiresAt: row.expiresAt,
      id: row.id as SessionId,
      ipAddress: row.ipAddress,
      tokenHash: row.token,
      updatedAt: row.updatedAt,
      userAgent: row.userAgent,
      userId: row.userId as UserId,
    });
  }

  /** `updatedAt` is notNull with no DB default, so it must be written here. */
  static toPersistence(entity: Session): SessionInsert {
    return {
      createdAt: entity.createdAt,
      expiresAt: entity.expiresAt,
      id: entity.id,
      ipAddress: entity.ipAddress,
      token: entity.tokenHash,
      updatedAt: entity.updatedAt,
      userAgent: entity.userAgent,
      userId: entity.userId,
    };
  }
}
