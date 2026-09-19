import { AppError } from "../errors/app-error";
import { err, ok } from "../types/result";
import type { Result } from "../types/result";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/u;

const MAX_EMAIL_LENGTH = 254;

/**
 * Lives in the shared kernel, not in a feature: both `auth` (credentials) and
 * `user` (identity reads) restore it from the same `user.email` column.
 */
export class Email {
  private constructor(public readonly value: string) {}

  static create(raw: string): Result<Email, AppError> {
    const normalized = raw.trim().toLowerCase();

    if (
      normalized.length === 0 ||
      normalized.length > MAX_EMAIL_LENGTH ||
      !EMAIL_PATTERN.test(normalized)
    ) {
      return err(AppError.validation("Invalid email address"));
    }

    return ok(new Email(normalized));
  }

  static restore(raw: string): Email {
    return new Email(raw);
  }
}
