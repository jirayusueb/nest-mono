import type { SignOutInput } from "~/features/auth/application/dtos/auth-dtos";
import type { ISessionRepository } from "~/features/auth/application/ports/i-session-repository";
import type { ISessionTokenService } from "~/features/auth/application/ports/i-session-token-service";

export class SignOutUseCase {
  constructor(
    private readonly sessions: ISessionRepository,
    private readonly tokens: ISessionTokenService,
  ) {}

  async execute(input: SignOutInput): Promise<void> {
    await this.sessions.deleteByTokenHash(await this.tokens.hash(input.token));
  }
}
