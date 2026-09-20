import type { SignOutInput } from "../dtos/auth-dtos";
import type { ISessionRepository } from "../ports/i-session-repository";
import type { ISessionTokenService } from "../ports/i-session-token-service";

export class SignOutUseCase {
  constructor(
    private readonly sessions: ISessionRepository,
    private readonly tokens: ISessionTokenService,
  ) {}

  async execute(input: SignOutInput): Promise<void> {
    await this.sessions.deleteByTokenHash(await this.tokens.hash(input.token));
  }
}
