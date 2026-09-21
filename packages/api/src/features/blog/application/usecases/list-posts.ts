import {
  toPostOutput,
  type PostOutput,
} from "~/features/blog/application/dtos/blog-dtos";
import type { IPostRepository } from "~/features/blog/application/ports/i-post-repository";
import {
  type PaginatedRequest,
  type PaginatedResponse,
} from "~/shared/application/dtos/pagination";

export class ListPostsUseCase {
  constructor(private readonly repo: IPostRepository) {}

  async execute(
    request: PaginatedRequest,
  ): Promise<PaginatedResponse<PostOutput>> {
    const page = await this.repo.list(request);

    return { ...page, items: page.items.map(toPostOutput) };
  }
}
