import { media } from "../../../../db/schema/media";
import type { UserId } from "../../../../shared/kernel/types/ids";
import type { MediaRecord } from "../../application/dtos/media-dtos";

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
