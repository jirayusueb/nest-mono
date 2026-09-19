import type { SessionUser } from "../../../../../shared/kernel/types/session-user";
import type { ResolvedSession } from "../../../application/dtos/resolved-session";

/**
 * Wire user shape (mirrors better-auth). Deliberately date-free — nothing
 * consumes user timestamps yet; add when something does.
 */
export interface UserResponse {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  image: string | null;
}

export interface GetSessionResponse {
  session: {
    id: string;
    userId: string;
    expiresAt: string;
    ipAddress: string | null;
    userAgent: string | null;
    createdAt: string;
    updatedAt: string;
  };
  user: UserResponse;
}

export function toUserResponse(user: SessionUser): UserResponse {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    emailVerified: user.emailVerified,
    image: user.image,
  };
}

export function toGetSessionResponse(dto: ResolvedSession): GetSessionResponse {
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
    user: toUserResponse(dto.user),
  };
}
