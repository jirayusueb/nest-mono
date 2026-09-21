import type { DeleteMediaInput } from "~/features/media/application/dtos/media-dtos";
import type { IBucketStore } from "~/features/media/application/ports/i-bucket-store";
import type { IMediaRepository } from "~/features/media/application/ports/i-media-repository";
import { AppError } from "~/shared/kernel/errors/app-error";
import { err, ok } from "~/shared/kernel/types/result";
import type { Result } from "~/shared/kernel/types/result";

export class DeleteMediaUseCase {
  constructor(
    private readonly repo: IMediaRepository,
    private readonly store: IBucketStore,
  ) {}

  async execute(input: DeleteMediaInput): Promise<Result<void, AppError>> {
    const record = await this.repo.findByKey(input.key);

    if (record === null || record.userId !== input.userId) {
      return err(AppError.notFound("Media"));
    }

    await this.repo.deleteByKey(input.key);
    await this.store.delete(input.key);

    return ok(undefined);
  }
}
