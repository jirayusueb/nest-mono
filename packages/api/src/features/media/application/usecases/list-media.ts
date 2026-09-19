import type { UserId } from "../../../../shared/kernel/types/ids";
import { ok } from "../../../../shared/kernel/types/result";
import type { Result } from "../../../../shared/kernel/types/result";
import type { MediaDto } from "../dtos/media-dtos";
import type { IBucketStore } from "../ports/i-bucket-store";
import type { IMediaRepository } from "../ports/i-media-repository";

export class ListMedia {
  constructor(
    private readonly repo: IMediaRepository,
    private readonly store: IBucketStore,
  ) {}

  async execute(input: {
    userId: UserId;
  }): Promise<Result<{ media: MediaDto[] }, never>> {
    const records = await this.repo.listByUser(input.userId);

    return ok({
      media: records
        .filter((record) => record.confirmed)
        .map((record) => ({
          key: record.key,
          url: this.store.publicUrl(record.key),
          contentType: record.contentType,
          bytes: record.bytes,
          createdAt: record.createdAt,
        })),
    });
  }
}
