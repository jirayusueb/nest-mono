import { AppError } from "../../../../shared/kernel/errors/app-error";
import { err, ok } from "../../../../shared/kernel/types/result";
import type { Result } from "../../../../shared/kernel/types/result";
import type { IBucketStore } from "../ports/i-bucket-store";
import type { IMediaRepository } from "../ports/i-media-repository";

/**
 * Verifies the browser's direct PUT landed, then flips the row to confirmed.
 */
export class ConfirmMedia {
  constructor(
    private readonly repo: IMediaRepository,
    private readonly store: IBucketStore,
  ) {}

  async execute(input: {
    key: string;
  }): Promise<Result<{ url: string }, AppError>> {
    const head = await this.store.head(input.key);

    if (head === null) {
      return err(AppError.notFound("Upload"));
    }

    await this.repo.confirm(input.key, head.bytes, head.contentType);

    return ok({ url: this.store.publicUrl(input.key) });
  }
}
