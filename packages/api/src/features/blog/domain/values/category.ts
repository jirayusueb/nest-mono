import { AppError } from "../../../../shared/kernel/errors/app-error";
import { err, ok } from "../../../../shared/kernel/types/result";
import type { Result } from "../../../../shared/kernel/types/result";
import { Slug } from "./slug";

export const MAX_CATEGORY_NAME_LENGTH = 50;

/**
 * No id: the slug IS the wire identity — uuids stay persistence-internal. Same
 * shape as `Tag`.
 */
export class Category {
  private constructor(
    public readonly name: string,
    private readonly slug: Slug,
  ) {}

  static create(name: string): Result<Category, AppError> {
    const trimmed = name.trim();

    if (trimmed.length === 0 || trimmed.length > MAX_CATEGORY_NAME_LENGTH) {
      return err(AppError.validation("Category name must be 1-50 characters"));
    }

    const slug = Slug.fromTitle(trimmed);

    if (slug.isErr()) {
      return err(slug.error);
    }

    return ok(new Category(trimmed, slug.value));
  }

  static restore(name: string, slug: string): Category {
    return new Category(name.trim(), Slug.restore(slug));
  }

  get slugValue(): string {
    return this.slug.value;
  }
}
