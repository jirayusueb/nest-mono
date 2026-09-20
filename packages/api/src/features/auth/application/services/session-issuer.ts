import type { IDateProvider } from "../../../../shared/application/interfaces/i-date-provider";
import type { IIdGenerator } from "../../../../shared/application/interfaces/i-id-generator";
import { make } from "../../../../shared/kernel/types/brand";
import { err, ok } from "../../../../shared/kernel/types/result";
import type { Result } from "../../../../shared/kernel/types/result";
import type { AppError } from "../../../../shared/kernel/errors/app-error";
import type { SessionId, UserId } from "../../../../shared/kernel/types/ids";
import type { AuthIdentity } from "../ports/i-identity-repository";
import type { ISessionRepository } from "../ports/i-session-repository";
import type { ISessionTokenService } from "../ports/i-session-token-service";
import { SessionEntity } from "../../domain/entities/session-entity";
import type {
  ClientMeta,
  IssuedSessionOutput,
} from "../dtos/auth-dtos";
import { roleForEmail } from "../../domain/rules/role-rules";

export class SessionIssuer {
  constructor(
    private readonly sessions: ISessionRepository,
    private readonly tokens: ISessionTokenService,
    private readonly idGenerator: IIdGenerator,
    private readonly dateProvider: IDateProvider,
    private readonly adminEmails: ReadonlySet<string>,
  ) {}

  async issue(
    identity: AuthIdentity,
    meta: ClientMeta,
    now: Date,
  ): Promise<Result<IssuedSessionOutput, AppError>> {
    const { token, tokenHash } = await this.tokens.issue();

    const expiresAt = this.dateProvider.addSeconds(
      SessionEntity.TTL_SECONDS,
      now,
    );

    const session = SessionEntity.create(
      make<SessionId>(this.idGenerator.generate()),
      make<UserId>(identity.id),
      tokenHash,
      expiresAt,
      now,
      meta.ipAddress,
      meta.userAgent,
    );

    if (session.isErr()) {
      return err(session.error);
    }

    await this.sessions.save(session.value);

    return ok({
      expiresAt,
      token,
      user: {
        email: identity.email,
        id: make<UserId>(identity.id),
        emailVerified: identity.emailVerified,
        image: identity.image,
        name: identity.name,
        role: roleForEmail(identity.email, this.adminEmails),
      },
    });
  }
}
