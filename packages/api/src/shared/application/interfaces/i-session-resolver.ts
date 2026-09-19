import type { SessionUser } from "../../kernel/types/session-user";

export interface ISessionResolver {
  resolve(token: string | null): Promise<SessionUser | null>;
}
