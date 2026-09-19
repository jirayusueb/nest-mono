import { Inject, Injectable } from "@nestjs/common";
import { eq } from "drizzle-orm";
import { session } from "../../../../db/schema/auth";
import type { Database } from "../../../../shared/infrastructure/database/database";
import { DATABASE } from "../../../../shared/tokens";
import type { ISessionRepository } from "../../application/ports/i-session-repository";
import { Session } from "../../domain/entities/session";
import { SessionMapper } from "../mappers/session-mapper";

@Injectable()
export class DrizzleSessionRepository implements ISessionRepository {
  constructor(@Inject(DATABASE) private readonly db: Database) {}

  /** Insert only: a session is minted once and then deleted, never updated. */
  async save(entity: Session): Promise<void> {
    await this.db.insert(session).values(SessionMapper.toPersistence(entity));
  }

  async findByTokenHash(tokenHash: string): Promise<Session | null> {
    const rows = await this.db
      .select()
      .from(session)
      .where(eq(session.token, tokenHash))
      .limit(1);

    return rows[0] ? SessionMapper.toDomain(rows[0]) : null;
  }

  async deleteByTokenHash(tokenHash: string): Promise<void> {
    await this.db.delete(session).where(eq(session.token, tokenHash));
  }
}
