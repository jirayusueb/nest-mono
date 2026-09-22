import {
  Injectable,
  type CanActivate,
  type ExecutionContext,
} from "@nestjs/common";

import { AppError } from "~/shared/kernel/errors/app-error";

import type { AuthenticatedRequest } from "./session.guard";

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();

    if (request.identity === undefined) {
      throw new Error("AdminGuard used on a route without SessionGuard");
    }

    if (request.identity.role !== "admin") {
      throw AppError.forbidden();
    }

    return true;
  }
}
