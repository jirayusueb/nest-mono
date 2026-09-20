import {
  Inject,
  Injectable,
  type CanActivate,
  type ExecutionContext,
} from "@nestjs/common";
import type { FastifyRequest } from "fastify";
import { SESSION_RESOLVER, type ISessionResolver } from "../../application/interfaces/i-session-resolver";
import { AppError } from "../../kernel/errors/app-error";
import type { SessionUser } from "../../kernel/types/session-user";
import { readSessionToken } from "./cookie";

export type AuthenticatedRequest = FastifyRequest & {
  identity?: SessionUser;
};

@Injectable()
export class SessionGuard implements CanActivate {
  constructor(
    @Inject(SESSION_RESOLVER) private readonly sessions: ISessionResolver,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();

    // SAFETY: header values are string|string[]|undefined, but only the scalar
    // cookie header is read.
    const identity = await this.sessions.resolve(
      readSessionToken(new Headers(request.headers as Record<string, string>)),
    );

    if (identity === null) {
      throw AppError.unauthorized();
    }

    request.identity = identity;

    return true;
  }
}
