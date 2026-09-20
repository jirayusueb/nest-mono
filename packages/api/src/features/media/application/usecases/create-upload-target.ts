import type { IDateProvider } from "../../../../shared/application/interfaces/i-date-provider";
import type { IIdGenerator } from "../../../../shared/application/interfaces/i-id-generator";
import { AppError } from "../../../../shared/kernel/errors/app-error";
import { err, ok } from "../../../../shared/kernel/types/result";
import type { Result } from "../../../../shared/kernel/types/result";
import {
  EXTENSION_BY_TYPE,
  MAX_UPLOAD_BYTES,
  isAllowedImageType,
} from "../../domain/rules/media-rules";
import type {
  CreateUploadTargetInput,
  MediaRecord,
  UploadTargetOutput,
} from "../dtos/media-dtos";
import type { IBucketStore } from "../ports/i-bucket-store";
import type { IMediaRepository } from "../ports/i-media-repository";

const PRESIGN_TTL_SECONDS = 300;

export class CreateUploadTargetUseCase {
  constructor(
    private readonly repo: IMediaRepository,
    private readonly store: IBucketStore,
    private readonly ids: IIdGenerator,
    private readonly clock: IDateProvider,
  ) {}

  async execute(
    input: CreateUploadTargetInput,
  ): Promise<Result<UploadTargetOutput, AppError>> {
    if (
      !isAllowedImageType(input.contentType) ||
      input.bytes > MAX_UPLOAD_BYTES
    ) {
      return err(
        AppError.validation(
          "Upload must be an allowed image type of at most 10 MB",
        ),
      );
    }

    const now = this.clock.now();

    const key = `${input.userId}/${this.ids.generate()}.${
      EXTENSION_BY_TYPE[input.contentType]
    }`;

    const record: MediaRecord = {
      id: this.ids.generate(),
      userId: input.userId,
      key,
      contentType: input.contentType,
      bytes: input.bytes,
      confirmed: false,
      createdAt: now,
      updatedAt: now,
    };

    await this.repo.save(record);

    return ok({
      key,
      uploadUrl: await this.store.presignPut(
        key,
        input.contentType,
        PRESIGN_TTL_SECONDS,
      ),
      url: this.store.publicUrl(key),
    });
  }
}
