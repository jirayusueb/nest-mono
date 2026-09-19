import { createParamDecorator, type ExecutionContext } from "@nestjs/common";
import type { SessionUser } from "../../kernel/types/session-user";
import type { AuthenticatedRequest } from "./session.guard";

export const CurrentUser = createParamDecorator<void>(
  (_data: void, context: ExecutionContext): SessionUser => {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();

    if (request.identity === undefined) {
      throw new Error("CurrentUser used on a route without SessionGuard");
    }

    return request.identity;
  },
);
