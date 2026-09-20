import { Inject, Injectable } from "@nestjs/common";
import { eq } from "drizzle-orm";
import { session } from "../../../../db/schema/auth";
import { DATABASE, type Database } from "../../../../shared/infrastructure/database/database";
import { activeDb } from "../../../../shared/infrastructure/database/tx-storage";
import type { ISessionRepository } from "../../application/ports/i-session-repository";
import { SessionEntity } from "../../domain/entities/session-entity";
import { SessionMapper } from "../mappers/session-mapper";

@Injectable()
export class DrizzleSessionRepository implements ISessionRepository {
  constructor(@Inject(DATABASE) private readonly db: Database) {}

  private get dbOrTx(): Database {
    return activeDb(this.db);
  }

  async save(entity: SessionEntity): Promise<void> {
    await this.dbOrTx
      .insert(session)
      .values(SessionMapper.toPersistence(entity));
  }

  async findByTokenHash(tokenHash: string): Promise<SessionEntity | null> {
    const rows = await this.dbOrTx
      .select()
      .from(session)
      .where(eq(session.token, tokenHash))
      .limit(1);

    return rows[0] ? SessionMapper.toDomain(rows[0]) : null;
  }

  async deleteByTokenHash(tokenHash: string): Promise<void> {
    await this.dbOrTx.delete(session).where(eq(session.token, tokenHash));
  }
}
