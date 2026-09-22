import type { SessionUser } from "~/shared/kernel/types/session-user";

export abstract class ISessionResolver {
  abstract resolve(token: string | null): Promise<SessionUser | null>;
}
