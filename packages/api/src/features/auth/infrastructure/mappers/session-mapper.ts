import type { session } from "../../../../db/schema/auth";
import type { SessionId, UserId } from "../../../../shared/kernel/types/ids";
import { SessionEntity } from "../../domain/entities/session-entity";

type SessionRow = typeof session.$inferSelect;

type SessionInsert = typeof session.$inferInsert;

export class SessionMapper {
  static toDomain(row: SessionRow): SessionEntity {
    // SAFETY: rows come from our own schema; branded ids restore without
    // revalidation.
    return SessionEntity.restore(
      row.id as SessionId,
      row.userId as UserId,
      row.token,
      row.expiresAt,
      row.ipAddress,
      row.userAgent,
      row.createdAt,
      row.updatedAt,
    );
  }

  static toPersistence(entity: SessionEntity): SessionInsert {
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
