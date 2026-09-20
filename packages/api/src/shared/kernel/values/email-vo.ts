import { AppError } from "../errors/app-error";
import { DomainError } from "../errors/domain-error";
import { err, ok } from "../types/result";
import type { Result } from "../types/result";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/u;

const MAX_EMAIL_LENGTH = 254;

export class EmailVO {
  private constructor(public readonly value: string) {}

  static create(raw: string): Result<EmailVO, AppError> {
    const normalized = raw.trim().toLowerCase();

    if (
      normalized.length === 0 ||
      normalized.length > MAX_EMAIL_LENGTH ||
      !EMAIL_PATTERN.test(normalized)
    ) {
      return err(new DomainError("Invalid email address"));
    }

    return ok(new EmailVO(normalized));
  }

  static restore(raw: string): EmailVO {
    return new EmailVO(raw);
  }
}
