import type { IDateProvider } from "../../../../shared/application/interfaces/i-date-provider";
import { AppError } from "../../../../shared/kernel/errors/app-error";
import { err, ok } from "../../../../shared/kernel/types/result";
import type { Result } from "../../../../shared/kernel/types/result";
import {
  toPostDto,
  type PostDto,
  type UpdatePostInput,
} from "../dtos/blog-dtos";
import type { IPostRepository } from "../ports/i-post-repository";

/** Patch semantics live on `Post.update` (domain). */
export class UpdatePost {
  constructor(
    private readonly repo: IPostRepository,
    private readonly clock: IDateProvider,
  ) {}

  async execute(input: UpdatePostInput): Promise<Result<PostDto, AppError>> {
    const existing = await this.repo.findByIdForUser(
      input.postId,
      input.userId,
    );

    if (existing === null) {
      return err(AppError.notFound("Post"));
    }

    const merged = existing.update(
      {
        title: input.title,
        content: input.content,
        category: input.category,
        tags: input.tags,
        thumbnailUrl: input.thumbnailUrl,
      },
      this.clock.now(),
    );

    if (merged.isErr()) {
      return err(merged.error);
    }

    await this.repo.save(merged.value);

    return ok(toPostDto(merged.value));
  }
}
