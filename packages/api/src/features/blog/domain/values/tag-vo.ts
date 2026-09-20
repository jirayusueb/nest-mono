import { AppError } from "../../../../shared/kernel/errors/app-error";
import { DomainError } from "../../../../shared/kernel/errors/domain-error";
import { err, ok } from "../../../../shared/kernel/types/result";
import type { Result } from "../../../../shared/kernel/types/result";
import { SlugVO } from "./slug-vo";

export const MAX_TAG_NAME_LENGTH = 50;

export class TagVO {
  private constructor(
    public readonly name: string,
    private readonly slug: SlugVO,
  ) {}

  static create(name: string): Result<TagVO, AppError> {
    const trimmed = name.trim();

    if (trimmed.length === 0 || trimmed.length > MAX_TAG_NAME_LENGTH) {
      return err(new DomainError("Tag name must be 1-50 characters"));
    }

    const slug = SlugVO.fromTitle(trimmed);

    if (slug.isErr()) {
      return err(slug.error);
    }

    return ok(new TagVO(trimmed, slug.value));
  }

  static restore(name: string, slug: string): TagVO {
    return new TagVO(name.trim(), SlugVO.restore(slug));
  }

  get slugValue(): string {
    return this.slug.value;
  }
}
