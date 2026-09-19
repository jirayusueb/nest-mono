import type { Session } from "../../domain/entities/session";

export interface ISessionRepository {
  save(entity: Session): Promise<void>;
  findByTokenHash(tokenHash: string): Promise<Session | null>;
  deleteByTokenHash(tokenHash: string): Promise<void>;
}
