import { AppError } from "../../../../shared/kernel/errors/app-error";
import { err, ok } from "../../../../shared/kernel/types/result";
import type { Result } from "../../../../shared/kernel/types/result";

export const MIN_PASSWORD_LENGTH = 8;

export const MAX_PASSWORD_LENGTH = 128;

/**
 * A password as submitted, before hashing. Exists so the length policy has one
 * home and never leaks into a controller or an adapter.
 */
export class PlainPassword {
  private constructor(public readonly value: string) {}

  static create(raw: string): Result<PlainPassword, AppError> {
    if (raw.length < MIN_PASSWORD_LENGTH || raw.length > MAX_PASSWORD_LENGTH) {
      return err(
        AppError.validation(
          `Password must be between ${MIN_PASSWORD_LENGTH} and ${MAX_PASSWORD_LENGTH} characters`,
        ),
      );
    }

    return ok(new PlainPassword(raw));
  }
}
