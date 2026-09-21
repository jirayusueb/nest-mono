import type { ListCategoriesOutput } from "~/features/blog/application/dtos/blog-dtos";
import type { IPostRepository } from "~/features/blog/application/ports/i-post-repository";

export class ListCategoriesUseCase {
  constructor(private readonly repo: IPostRepository) {}

  async execute(): Promise<ListCategoriesOutput> {
    const categories = await this.repo.listCategories();

    return {
      categories: categories.map((category) => ({
        name: category.name,
        slug: category.slugValue,
      })),
    };
  }
}
