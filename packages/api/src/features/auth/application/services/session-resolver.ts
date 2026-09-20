import type { ISessionResolver } from "../../../../shared/application/interfaces/i-session-resolver";
import type { SessionUser } from "../../../../shared/kernel/types/session-user";
import type { GetSessionUseCase } from "../usecases/get-session";

export class SessionResolver implements ISessionResolver {
  constructor(private readonly getSession: GetSessionUseCase) {}

  async resolve(token: string | null): Promise<SessionUser | null> {
    if (!token) {
      return null;
    }

    return (await this.getSession.execute({ token }))?.user ?? null;
  }
}
