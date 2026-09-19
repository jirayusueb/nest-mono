import { ok } from "../../../../shared/kernel/types/result";
import type { Result } from "../../../../shared/kernel/types/result";
import type { IBucketStore } from "../ports/i-bucket-store";
import type { IMediaRepository } from "../ports/i-media-repository";

export class DeleteMedia {
  constructor(
    private readonly repo: IMediaRepository,
    private readonly store: IBucketStore,
  ) {}

  async execute(input: { key: string }): Promise<Result<void, never>> {
    await this.repo.deleteByKey(input.key);
    await this.store.delete(input.key);

    return ok(undefined);
  }
}
