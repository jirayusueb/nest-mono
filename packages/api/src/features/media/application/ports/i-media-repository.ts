import type { MediaRecord } from "~/features/media/application/dtos/media-dtos";
import type { UserId } from "~/shared/kernel/types/ids";

export abstract class IMediaRepository {
  abstract save(record: MediaRecord): Promise<void>;
  abstract findByKey(key: string): Promise<MediaRecord | null>;
  abstract listConfirmedByUser(userId: UserId): Promise<MediaRecord[]>;
  abstract confirm(key: string, bytes: number, contentType: string): Promise<void>;
  abstract deleteByKey(key: string): Promise<void>;
}
