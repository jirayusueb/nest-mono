import { AppError } from "~/shared/kernel/errors/app-error";
import { DomainError } from "~/shared/kernel/errors/domain-error";
import { err, ok } from "~/shared/kernel/types/result";
import type { Result } from "~/shared/kernel/types/result";

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/u;

export const MAX_SLUG_LENGTH = 200;

export class SlugVO {
  private constructor(public readonly value: string) {}

  static create(raw: string): Result<SlugVO, AppError> {
    const trimmed = raw.trim();

    if (
      trimmed.length === 0 ||
      trimmed.length > MAX_SLUG_LENGTH ||
      !SLUG_PATTERN.test(trimmed)
    ) {
      return err(new DomainError("Invalid slug"));
    }

    return ok(new SlugVO(trimmed));
  }

  static fromTitle(title: string): Result<SlugVO, AppError> {
    const derived = title
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    if (derived.length === 0) {
      return err(new DomainError("Cannot derive a slug from an empty name"));
    }

    return SlugVO.create(derived);
  }

  static restore(raw: string): SlugVO {
    return new SlugVO(raw);
  }
}
