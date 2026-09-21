import {
  toPostOutput,
  type GetPostBySlugInput,
  type PostOutput,
} from "~/features/blog/application/dtos/blog-dtos";
import type { IPostRepository } from "~/features/blog/application/ports/i-post-repository";
import { AppError } from "~/shared/kernel/errors/app-error";
import { err, ok } from "~/shared/kernel/types/result";
import type { Result } from "~/shared/kernel/types/result";

export class GetPostBySlugUseCase {
  constructor(private readonly repo: IPostRepository) {}

  async execute(
    input: GetPostBySlugInput,
  ): Promise<Result<PostOutput, AppError>> {
    const post = await this.repo.findBySlug(input.slug);

    if (post === null) {
      return err(AppError.notFound("Post"));
    }

    return ok(toPostOutput(post));
  }
}
