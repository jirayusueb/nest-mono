import { ok } from "../../../../shared/kernel/types/result";
import type { Result } from "../../../../shared/kernel/types/result";
import { toPostDto, type PostDto } from "../dtos/blog-dtos";
import type { IPostRepository } from "../ports/i-post-repository";

export class ListPosts {
  constructor(private readonly repo: IPostRepository) {}

  async execute(): Promise<Result<{ posts: PostDto[] }, never>> {
    const posts = await this.repo.list();

    return ok({ posts: posts.map(toPostDto) });
  }
}
