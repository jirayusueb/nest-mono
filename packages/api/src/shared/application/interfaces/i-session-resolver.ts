import type { SessionUser } from "../../kernel/types/session-user";

export const SESSION_RESOLVER = "SESSION_RESOLVER";

export interface ISessionResolver {
  resolve(token: string | null): Promise<SessionUser | null>;
}
