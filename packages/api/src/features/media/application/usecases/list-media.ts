import type {
  ListMediaInput,
  ListMediaOutput,
} from "~/features/media/application/dtos/media-dtos";
import type { IBucketStore } from "~/features/media/application/ports/i-bucket-store";
import type { IMediaRepository } from "~/features/media/application/ports/i-media-repository";

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
