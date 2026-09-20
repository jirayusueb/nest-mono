import { AppError } from "../../../../shared/kernel/errors/app-error";
import { err, ok } from "../../../../shared/kernel/types/result";
import type { Result } from "../../../../shared/kernel/types/result";
import {
  MAX_UPLOAD_BYTES,
  isAllowedImageType,
} from "../../domain/rules/media-rules";
import type {
  ConfirmMediaInput,
  ConfirmMediaOutput,
} from "../dtos/media-dtos";
import type { IBucketStore } from "../ports/i-bucket-store";
import type { IMediaRepository } from "../ports/i-media-repository";

export class ConfirmMediaUseCase {
  constructor(
    private readonly repo: IMediaRepository,
    private readonly store: IBucketStore,
  ) {}

  async execute(
    input: ConfirmMediaInput,
  ): Promise<Result<ConfirmMediaOutput, AppError>> {
    const record = await this.repo.findByKey(input.key);

    if (record === null || record.userId !== input.userId) {
      return err(AppError.notFound("Upload"));
    }

    const head = await this.store.head(input.key);

    if (head === null) {
      return err(AppError.notFound("Upload"));
    }

    if (!isAllowedImageType(head.contentType) || head.bytes > MAX_UPLOAD_BYTES) {
      return err(
        AppError.validation(
          "Upload must be an allowed image type of at most 10 MB",
        ),
      );
    }

    await this.repo.confirm(input.key, head.bytes, head.contentType);

    return ok({ url: this.store.publicUrl(input.key) });
  }
}
