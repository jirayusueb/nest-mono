import { AppError } from "../../../../shared/kernel/errors/app-error";
import { err, ok } from "../../../../shared/kernel/types/result";
import type { Result } from "../../../../shared/kernel/types/result";
import { toPostDto, type PostDto } from "../dtos/blog-dtos";
import type { IPostRepository } from "../ports/i-post-repository";

export class GetPostBySlug {
  constructor(private readonly repo: IPostRepository) {}

  async execute(input: { slug: string }): Promise<Result<PostDto, AppError>> {
    const post = await this.repo.findBySlug(input.slug);

    if (post === null) {
      return err(AppError.notFound("Post"));
    }

    return ok(toPostDto(post));
  }
}
