import type { SessionEntity } from "../../domain/entities/session-entity";

export const SESSION_REPOSITORY = "SESSION_REPOSITORY";

export interface ISessionRepository {
  save(entity: SessionEntity): Promise<void>;
  findByTokenHash(tokenHash: string): Promise<SessionEntity | null>;
  deleteByTokenHash(tokenHash: string): Promise<void>;
}
