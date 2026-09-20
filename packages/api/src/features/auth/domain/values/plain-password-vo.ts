import { DomainError } from "../../../../shared/kernel/errors/domain-error";
import { err, ok } from "../../../../shared/kernel/types/result";
import type { Result } from "../../../../shared/kernel/types/result";
import { PasswordRules } from "../rules/password-rules";
import type { AppError } from "../../../../shared/kernel/errors/app-error";

export class PlainPasswordVO {
  private constructor(public readonly value: string) {}

  static create(raw: string): Result<PlainPasswordVO, AppError> {
    const check = PasswordRules.validate(raw);

    if (!check.valid) {
      return err(new DomainError(check.errors.join(", ")));
    }

    return ok(new PlainPasswordVO(raw));
  }
}
