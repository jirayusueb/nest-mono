import { AppError } from "../../../../shared/kernel/errors/app-error";
import { err, ok } from "../../../../shared/kernel/types/result";
import type { Result } from "../../../../shared/kernel/types/result";
import { Slug } from "./slug";

export const MAX_TAG_NAME_LENGTH = 50;

/** Same shape as `Category`: a name plus its derived slug identity. */
export class Tag {
  private constructor(
    public readonly name: string,
    private readonly slug: Slug,
  ) {}

  static create(name: string): Result<Tag, AppError> {
    const trimmed = name.trim();

    if (trimmed.length === 0 || trimmed.length > MAX_TAG_NAME_LENGTH) {
      return err(AppError.validation("Tag name must be 1-50 characters"));
    }

    const slug = Slug.fromTitle(trimmed);

    if (slug.isErr()) {
      return err(slug.error);
    }

    return ok(new Tag(trimmed, slug.value));
  }

  static restore(name: string, slug: string): Tag {
    return new Tag(name.trim(), Slug.restore(slug));
  }

  get slugValue(): string {
    return this.slug.value;
  }
}
