import type { SessionEntity } from "~/features/auth/domain/entities/session-entity";

export abstract class ISessionRepository {
  abstract save(entity: SessionEntity): Promise<void>;
  abstract findByTokenHash(tokenHash: string): Promise<SessionEntity | null>;
  abstract deleteByTokenHash(tokenHash: string): Promise<void>;
}
