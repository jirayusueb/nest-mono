import {
  Inject,
  Injectable,
  type CanActivate,
  type ExecutionContext,
} from "@nestjs/common";
import type { FastifyRequest } from "fastify";

import { ISessionResolver } from "~/shared/application/interfaces/i-session-resolver";
import { AppError } from "~/shared/kernel/errors/app-error";
import type { SessionUser } from "~/shared/kernel/types/session-user";
import { SESSION_COOKIE } from "~/shared/presentation/http/cookie";

export type AuthenticatedRequest = FastifyRequest & {
  identity?: SessionUser;
};

@Injectable()
export class SessionGuard implements CanActivate {
  constructor(
    @Inject(ISessionResolver) private readonly sessions: ISessionResolver,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();

    const identity = await this.sessions.resolve(
      request.cookies[SESSION_COOKIE] ?? null,
    );

    if (identity === null) {
      throw AppError.unauthorized();
    }

    request.identity = identity;

    return true;
  }
}
