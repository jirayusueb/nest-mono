import {
  Inject,
  Injectable,
  type CanActivate,
  type ExecutionContext,
} from "@nestjs/common";
import type { FastifyRequest } from "fastify";

import {
  SESSION_RESOLVER,
  type ISessionResolver,
} from "~/shared/application/interfaces/i-session-resolver";
import { AppError } from "~/shared/kernel/errors/app-error";
import type { SessionUser } from "~/shared/kernel/types/session-user";

import { SESSION_COOKIE } from "./cookie";
import { CookieService } from "./cookie-service";

export type AuthenticatedRequest = FastifyRequest & {
  identity?: SessionUser;
};

@Injectable()
export class SessionGuard implements CanActivate {
  constructor(
    @Inject(SESSION_RESOLVER) private readonly sessions: ISessionResolver,
    @Inject(CookieService) private readonly cookies: CookieService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();

    const identity = await this.sessions.resolve(
      this.cookies.read(request, SESSION_COOKIE),
    );

    if (identity === null) {
      throw AppError.unauthorized();
    }

    request.identity = identity;

    return true;
  }
}
