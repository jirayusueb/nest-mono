import { AppError } from "../../../../shared/kernel/errors/app-error";
import { err, ok } from "../../../../shared/kernel/types/result";
import type { Result } from "../../../../shared/kernel/types/result";

export const MIN_POST_TITLE_LENGTH = 1;

export const MAX_POST_TITLE_LENGTH = 200;

export class PostTitle {
  private constructor(public readonly value: string) {}

  static create(raw: string): Result<PostTitle, AppError> {
    const trimmed = raw.trim();

    if (
      trimmed.length < MIN_POST_TITLE_LENGTH ||
      trimmed.length > MAX_POST_TITLE_LENGTH
    ) {
      return err(
        AppError.validation(
          `Title must be between ${MIN_POST_TITLE_LENGTH} and ${MAX_POST_TITLE_LENGTH} characters`,
        ),
      );
    }

    return ok(new PostTitle(trimmed));
  }

  static restore(raw: string): PostTitle {
    return new PostTitle(raw);
  }
}
