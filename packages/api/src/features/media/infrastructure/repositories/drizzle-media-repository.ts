import { Inject, Injectable } from "@nestjs/common";
import { and, desc, eq } from "drizzle-orm";
import { media } from "../../../../db/schema/media";
import type { UserId } from "../../../../shared/kernel/types/ids";
import { DATABASE, type Database } from "../../../../shared/infrastructure/database/database";
import { activeDb } from "../../../../shared/infrastructure/database/tx-storage";
import type { MediaRecord } from "../../application/dtos/media-dtos";
import type { IMediaRepository } from "../../application/ports/i-media-repository";
import { MediaMapper } from "../mappers/media-mapper";

@Injectable()
export class DrizzleMediaRepository implements IMediaRepository {
  constructor(@Inject(DATABASE) private readonly db: Database) {}

  private get dbOrTx(): Database {
    return activeDb(this.db);
  }

  async save(record: MediaRecord): Promise<void> {
    await this.dbOrTx
      .insert(media)
      .values(record)
      .onConflictDoUpdate({
        target: media.key,
        set: {
          bytes: record.bytes,
          confirmed: record.confirmed,
          updatedAt: record.updatedAt,
        },
      });
  }

  async findByKey(key: string): Promise<MediaRecord | null> {
    const rows = await this.dbOrTx
      .select()
      .from(media)
      .where(eq(media.key, key))
      .limit(1);

    return rows[0] ? MediaMapper.toRecord(rows[0]) : null;
  }

  async listConfirmedByUser(userId: UserId): Promise<MediaRecord[]> {
    const rows = await this.dbOrTx
      .select()
      .from(media)
      .where(and(eq(media.userId, userId), eq(media.confirmed, true)))
      .orderBy(desc(media.createdAt));

    return rows.map((row) => MediaMapper.toRecord(row));
  }

  async confirm(
    key: string,
    bytes: number,
    contentType: string,
  ): Promise<void> {
    await this.dbOrTx
      .update(media)
      .set({ bytes, contentType, confirmed: true })
      .where(eq(media.key, key));
  }

  async deleteByKey(key: string): Promise<void> {
    await this.dbOrTx.delete(media).where(eq(media.key, key));
  }
}
