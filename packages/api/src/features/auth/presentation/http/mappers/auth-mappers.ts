import type {
  ClientMeta,
  ResolvedSessionOutput,
  SignInInput,
  SignUpInput,
} from "../../../application/dtos/auth-dtos";
import type { SessionUser } from "../../../../../shared/kernel/types/session-user";
import type {
  GetSessionResponse,
  SessionUserResponse,
} from "../dtos/auth-response";
import type { SignInRequest, SignUpRequest } from "../dtos/auth-schemas";

export class AuthMappers {
  static toSessionUserResponse(user: SessionUser): SessionUserResponse {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      emailVerified: user.emailVerified,
      image: user.image,
      role: user.role,
    };
  }

  static toGetSessionResponse(dto: ResolvedSessionOutput): GetSessionResponse {
    return {
      session: {
        id: dto.session.id,
        userId: dto.session.userId,
        expiresAt: dto.session.expiresAt.toISOString(),
        ipAddress: dto.session.ipAddress,
        userAgent: dto.session.userAgent,
        createdAt: dto.session.createdAt.toISOString(),
        updatedAt: dto.session.updatedAt.toISOString(),
      },
      user: AuthMappers.toSessionUserResponse(dto.user),
    };
  }

  static toSignUpInput(body: SignUpRequest, meta: ClientMeta): SignUpInput {
    return { ...body, ...meta };
  }

  static toSignInInput(body: SignInRequest, meta: ClientMeta): SignInInput {
    return { ...body, ...meta };
  }
}
