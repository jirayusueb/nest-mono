import type { IDateProvider } from "../../../../shared/application/interfaces/i-date-provider";
import { AppError } from "../../../../shared/kernel/errors/app-error";
import type { IUnitOfWork } from "../../../../shared/application/interfaces/i-unit-of-work";
import { err, ok } from "../../../../shared/kernel/types/result";
import type { Result } from "../../../../shared/kernel/types/result";
import {
  toPostOutput,
  type PostOutput,
  type UpdatePostInput,
} from "../dtos/blog-dtos";
import type { IPostRepository } from "../ports/i-post-repository";

export class UpdatePostUseCase {
  constructor(
    private readonly repo: IPostRepository,
    private readonly clock: IDateProvider,
    private readonly uow: IUnitOfWork,
  ) {}

  async execute(input: UpdatePostInput): Promise<Result<PostOutput, AppError>> {
    return this.uow.runInTransaction(async () => {
      const existing = await this.repo.findByIdForUser(
        input.postId,
        input.userId,
      );

      if (existing === null) {
        return err(AppError.notFound("Post"));
      }

      const merged = existing.update({
        title: input.title,
        content: input.content,
        category: input.category,
        tags: input.tags,
        thumbnailUrl: input.thumbnailUrl,
      }, this.clock.now());

      if (merged.isErr()) {
        return err(merged.error);
      }

      await this.repo.save(merged.value);

      return ok(toPostOutput(merged.value));
    });
  }
}
