import { Inject, Injectable } from "@nestjs/common";
import { desc, eq } from "drizzle-orm";
import { media } from "../../../../db/schema/media";
import type { UserId } from "../../../../shared/kernel/types/ids";
import type { Database } from "../../../../shared/infrastructure/database/database";
import { DATABASE } from "../../../../shared/tokens";
import type { MediaRecord } from "../../application/dtos/media-dtos";
import type { IMediaRepository } from "../../application/ports/i-media-repository";
import { MediaMapper } from "../mappers/media-mapper";

@Injectable()
export class DrizzleMediaRepository implements IMediaRepository {
  constructor(@Inject(DATABASE) private readonly db: Database) {}

  async save(record: MediaRecord): Promise<void> {
    await this.db
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
    const rows = await this.db
      .select()
      .from(media)
      .where(eq(media.key, key))
      .limit(1);

    return rows[0] ? MediaMapper.toRecord(rows[0]) : null;
  }

  async listByUser(userId: UserId): Promise<MediaRecord[]> {
    const rows = await this.db
      .select()
      .from(media)
      .where(eq(media.userId, userId))
      .orderBy(desc(media.createdAt));

    return rows.map((row) => MediaMapper.toRecord(row));
  }

  async confirm(
    key: string,
    bytes: number,
    contentType: string,
  ): Promise<void> {
    await this.db
      .update(media)
      .set({ bytes, contentType, confirmed: true })
      .where(eq(media.key, key));
  }

  async deleteByKey(key: string): Promise<void> {
    await this.db.delete(media).where(eq(media.key, key));
  }
}
