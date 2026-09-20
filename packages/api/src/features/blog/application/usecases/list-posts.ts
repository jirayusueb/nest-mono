import {
  type PaginatedRequest,
  type PaginatedResponse,
} from "../../../../shared/application/dtos/pagination";
import { toPostOutput, type PostOutput } from "../dtos/blog-dtos";
import type { IPostRepository } from "../ports/i-post-repository";

export class ListPostsUseCase {
  constructor(private readonly repo: IPostRepository) {}

  async execute(
    request: PaginatedRequest,
  ): Promise<PaginatedResponse<PostOutput>> {
    const page = await this.repo.list(request);
    return { ...page, items: page.items.map(toPostOutput) };
  }
}
