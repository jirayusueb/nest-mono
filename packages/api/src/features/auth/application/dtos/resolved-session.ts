import type { SessionUser } from "../../../../shared/kernel/types/session-user";

export interface ResolvedSession {
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
