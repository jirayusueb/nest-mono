import type { SessionUser } from "../../../../shared/kernel/types/session-user";

export interface ClientMeta {
  ipAddress: string | null;
  userAgent: string | null;
}

export interface SignUpInput {
  email: string;
  password: string;
  name: string;
  ipAddress: string | null;
  userAgent: string | null;
}

export interface SignInInput {
  email: string;
  password: string;
  ipAddress: string | null;
  userAgent: string | null;
}

export interface SignOutInput {
  token: string;
}

export interface GetSessionInput {
  token: string;
}

export interface IssuedSessionOutput {
  user: SessionUser;
  token: string;
  expiresAt: Date;
}

export interface ResolvedSessionOutput {
  session: {
    id: string;
    userId: string;
    expiresAt: Date;
    ipAddress: string | null;
    userAgent: string | null;
    createdAt: Date;
    updatedAt: Date;
  };
  user: SessionUser;
}
