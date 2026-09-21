import type { MediaRecord } from "~/features/media/application/dtos/media-dtos";
import type { UserId } from "~/shared/kernel/types/ids";

export const MEDIA_REPOSITORY = "MEDIA_REPOSITORY";

export interface IMediaRepository {
  save(record: MediaRecord): Promise<void>;
  findByKey(key: string): Promise<MediaRecord | null>;
  listConfirmedByUser(userId: UserId): Promise<MediaRecord[]>;
  confirm(key: string, bytes: number, contentType: string): Promise<void>;
  deleteByKey(key: string): Promise<void>;
}
