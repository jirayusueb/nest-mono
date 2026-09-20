import { AppError } from "../../../../shared/kernel/errors/app-error";
import { err, ok } from "../../../../shared/kernel/types/result";
import type { Result } from "../../../../shared/kernel/types/result";
import type { DeleteMediaInput } from "../dtos/media-dtos";
import type { IBucketStore } from "../ports/i-bucket-store";
import type { IMediaRepository } from "../ports/i-media-repository";

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
