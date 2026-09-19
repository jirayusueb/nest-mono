import { AppError } from "../../../../shared/kernel/errors/app-error";
import { err, ok } from "../../../../shared/kernel/types/result";
import type { Result } from "../../../../shared/kernel/types/result";

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/u;

const MAX_SLUG_LENGTH = 200;

export class Slug {
  private constructor(public readonly value: string) {}

  static create(raw: string): Result<Slug, AppError> {
    const trimmed = raw.trim();

    if (
      trimmed.length === 0 ||
      trimmed.length > MAX_SLUG_LENGTH ||
      !SLUG_PATTERN.test(trimmed)
    ) {
      return err(AppError.validation("Invalid slug"));
    }

    return ok(new Slug(trimmed));
  }

  static fromTitle(title: string): Result<Slug, AppError> {
    const derived = title
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    if (derived.length === 0) {
      return err(
        AppError.validation("Cannot derive a slug from an empty name"),
      );
    }

    return Slug.create(derived);
  }

  static restore(raw: string): Slug {
    return new Slug(raw);
  }
}
