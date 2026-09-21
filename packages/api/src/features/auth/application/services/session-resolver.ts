import type { GetSessionUseCase } from "~/features/auth/application/usecases/get-session";
import type { ISessionResolver } from "~/shared/application/interfaces/i-session-resolver";
import type { SessionUser } from "~/shared/kernel/types/session-user";

export class SessionResolver implements ISessionResolver {
  constructor(private readonly getSession: GetSessionUseCase) {}

  async resolve(token: string | null): Promise<SessionUser | null> {
    if (!token) {
      return null;
    }

    return (await this.getSession.execute({ token }))?.user ?? null;
  }
}
