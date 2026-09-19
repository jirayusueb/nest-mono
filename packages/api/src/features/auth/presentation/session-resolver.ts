import { Inject, Injectable } from "@nestjs/common";
import type { ISessionResolver } from "../../../shared/application/interfaces/i-session-resolver";
import type { SessionUser } from "../../../shared/kernel/types/session-user";
import { GetSession } from "../application/usecases/get-session";

@Injectable()
export class SessionResolver implements ISessionResolver {
  constructor(@Inject(GetSession) private readonly getSession: GetSession) {}

  async resolve(token: string | null): Promise<SessionUser | null> {
    if (!token) {
      return null;
    }

    const result = await this.getSession.execute({ token });

    return result.unwrapOr(null)?.user ?? null;
  }
}
