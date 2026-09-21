import type { MediaRecord } from "~/features/media/application/dtos/media-dtos";
import { media } from "~/shared/infrastructure/db/schema/media";
import type { UserId } from "~/shared/kernel/types/ids";

export type MediaRow = typeof media.$inferSelect;

export class MediaMapper {
  static toRecord(row: MediaRow): MediaRecord {
    // SAFETY: rows come from our own schema; branded ids restore without
    // revalidation.
    return {
      id: row.id,
      userId: row.userId as UserId,
      key: row.key,
      contentType: row.contentType,
      bytes: row.bytes,
      confirmed: row.confirmed,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}
