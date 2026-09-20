import type { ListMediaInput, ListMediaOutput } from "../dtos/media-dtos";
import type { IBucketStore } from "../ports/i-bucket-store";
import type { IMediaRepository } from "../ports/i-media-repository";

export class ListMediaUseCase {
  constructor(
    private readonly repo: IMediaRepository,
    private readonly store: IBucketStore,
  ) {}

  async execute(input: ListMediaInput): Promise<ListMediaOutput> {
    const records = await this.repo.listConfirmedByUser(input.userId);

    return {
      media: records.map((record) => ({
        key: record.key,
        url: this.store.publicUrl(record.key),
        contentType: record.contentType,
        bytes: record.bytes,
        createdAt: record.createdAt,
      })),
    };
  }
}
