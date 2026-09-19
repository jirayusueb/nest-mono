import { AppError } from "../../../../shared/kernel/errors/app-error";
import { ok } from "../../../../shared/kernel/types/result";
import type { Result } from "../../../../shared/kernel/types/result";
import type { ISessionRepository } from "../ports/i-session-repository";
import type { ISessionTokenService } from "../ports/i-session-token-service";

export class SignOut {
  constructor(
    private readonly sessions: ISessionRepository,
    private readonly tokens: ISessionTokenService,
  ) {}

  async execute(input: {
    token: string;
  }): Promise<Result<{ success: boolean }, AppError>> {
    await this.sessions.deleteByTokenHash(await this.tokens.hash(input.token));

    return ok({ success: true });
  }
}
