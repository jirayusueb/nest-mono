import type { IDateProvider } from "../../../../shared/application/interfaces/i-date-provider";
import { make } from "../../../../shared/kernel/types/brand";
import type { UserId } from "../../../../shared/kernel/types/ids";
import type {
  GetSessionInput,
  ResolvedSessionOutput,
} from "../dtos/auth-dtos";
import { roleForEmail } from "../../domain/rules/role-rules";
import type { IIdentityRepository } from "../ports/i-identity-repository";
import type { ISessionRepository } from "../ports/i-session-repository";
import type { ISessionTokenService } from "../ports/i-session-token-service";

export class GetSessionUseCase {
  constructor(
    private readonly sessions: ISessionRepository,
    private readonly tokens: ISessionTokenService,
    private readonly identities: IIdentityRepository,
    private readonly dateProvider: IDateProvider,
    private readonly adminEmails: ReadonlySet<string>,
  ) {}

  async execute(input: GetSessionInput): Promise<ResolvedSessionOutput | null> {
    const session = await this.sessions.findByTokenHash(
      await this.tokens.hash(input.token),
    );

    if (session === null || session.isExpired(this.dateProvider.now())) {
      return null;
    }

    const identity = await this.identities.findById(session.userId);

    if (identity === null) {
      return null;
    }

    return {
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
        role: roleForEmail(identity.email, this.adminEmails),
      },
    };
  }
}
