import type { SessionUser } from "../../../../shared/kernel/types/session-user";

export interface IssuedSessionDto {
  user: SessionUser;
  token: string;
  expiresAt: Date;
}
