import type { IDateProvider } from "../../../../shared/application/interfaces/i-date-provider";
import { make } from "../../../../shared/kernel/types/brand";
import type { UserId } from "../../../../shared/kernel/types/ids";
import { ok } from "../../../../shared/kernel/types/result";
import type { Result } from "../../../../shared/kernel/types/result";
import type { ResolvedSession } from "../dtos/resolved-session";
import type { IIdentityRepository } from "../ports/i-identity-repository";
import type { ISessionRepository } from "../ports/i-session-repository";
import type { ISessionTokenService } from "../ports/i-session-token-service";

/**
 * Expired, unknown, or user-less sessions all resolve to `null`, never an
 * error.
 */
export class GetSession {
  constructor(
    private readonly sessions: ISessionRepository,
    private readonly tokens: ISessionTokenService,
    private readonly identities: IIdentityRepository,
    private readonly dateProvider: IDateProvider,
  ) {}

  async execute(input: {
    token: string;
  }): Promise<Result<ResolvedSession | null, never>> {
    const session = await this.sessions.findByTokenHash(
      await this.tokens.hash(input.token),
    );

    if (session === null || session.isExpired(this.dateProvider.now())) {
      return ok(null);
    }

    const identity = await this.identities.findById(session.userId);

    if (identity === null) {
      return ok(null);
    }

    return ok({
      session: {
        id: session.id,
        userId: session.userId,
        expiresAt: session.expiresAt,
        ipAddress: session.ipAddress,
        userAgent: session.userAgent,
        createdAt: session.createdAt,
        updatedAt: session.updatedAt,
      },
      user: {
        email: identity.email,
        id: make<UserId>(identity.id),
        emailVerified: identity.emailVerified,
        image: identity.image,
        name: identity.name,
      },
    });
  }
}
