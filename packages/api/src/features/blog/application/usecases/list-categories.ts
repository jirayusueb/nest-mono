import { ok } from "../../../../shared/kernel/types/result";
import type { Result } from "../../../../shared/kernel/types/result";
import type { IPostRepository } from "../ports/i-post-repository";

export class ListCategories {
  constructor(private readonly repo: IPostRepository) {}

  async execute(): Promise<
    Result<{ categories: { name: string; slug: string }[] }, never>
  > {
    const categories = await this.repo.listCategories();

    return ok({
      categories: categories.map((category) => ({
        name: category.name,
        slug: category.slugValue,
      })),
    });
  }
}
