import { AppError } from "../../../../shared/kernel/errors/app-error";
import { err, ok } from "../../../../shared/kernel/types/result";
import type { Result } from "../../../../shared/kernel/types/result";
import {
  toPostOutput,
  type GetPostBySlugInput,
  type PostOutput,
} from "../dtos/blog-dtos";
import type { IPostRepository } from "../ports/i-post-repository";

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
