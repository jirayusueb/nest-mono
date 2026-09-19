import type { IDateProvider } from "../../../../shared/application/interfaces/i-date-provider";
import type { IIdGenerator } from "../../../../shared/application/interfaces/i-id-generator";
import { make } from "../../../../shared/kernel/types/brand";
import type { SessionId, UserId } from "../../../../shared/kernel/types/ids";
import type { AuthIdentity } from "../ports/i-identity-repository";
import type { ISessionRepository } from "../ports/i-session-repository";
import type { ISessionTokenService } from "../ports/i-session-token-service";
import { Session } from "../../domain/entities/session";
import type { IssuedSessionDto } from "../dtos/issued-session-dto";

export interface ClientMeta {
  ipAddress: string | null;
  userAgent: string | null;
}

/** The one path from "identity confirmed" to "session cookie". */
export class SessionIssuer {
  constructor(
    private readonly sessions: ISessionRepository,
    private readonly tokens: ISessionTokenService,
    private readonly idGenerator: IIdGenerator,
    private readonly dateProvider: IDateProvider,
  ) {}

  async issue(
    identity: AuthIdentity,
    meta: ClientMeta,
    now: Date,
  ): Promise<IssuedSessionDto> {
    const { token, tokenHash } = await this.tokens.issue();
    const expiresAt = this.dateProvider.addSeconds(Session.TTL_SECONDS, now);

    await this.sessions.save(
      Session.issue({
        expiresAt,
        id: make<SessionId>(this.idGenerator.generate()),
        ipAddress: meta.ipAddress,
        now,
        tokenHash,
        userAgent: meta.userAgent,
        userId: make<UserId>(identity.id),
      }),
    );

    return {
      expiresAt,
      token,
      user: {
        email: identity.email,
        id: make<UserId>(identity.id),
        emailVerified: identity.emailVerified,
        image: identity.image,
        name: identity.name,
      },
    };
  }
}
