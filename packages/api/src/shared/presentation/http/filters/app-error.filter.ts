import {
  Catch,
  HttpException,
  Inject,
  Injectable,
  type ArgumentsHost,
  type ExceptionFilter,
} from "@nestjs/common";
import type { FastifyReply } from "fastify";

import { ILogger } from "~/shared/application/interfaces/i-logger";
import { AppError, type ErrorDetails } from "~/shared/kernel/errors/app-error";

const CODE_BY_STATUS: Record<number, string> = {
  400: "ValidationFailed",
  401: "Unauthorized",
  404: "NotFound",
  409: "Conflict",
};

const PROBLEM_BY_CODE: Record<string, { status: number; title: string }> = {
  Conflict: { status: 409, title: "Conflict" },
  Forbidden: { status: 403, title: "Forbidden" },
  NotFound: { status: 404, title: "Not Found" },
  Unauthorized: { status: 401, title: "Unauthorized" },
  ValidationFailed: { status: 400, title: "Bad Request" },
  DomainError: { status: 422, title: "Unprocessable Entity" },
};

const INTERNAL_PROBLEM = { status: 500, title: "Internal Server Error" };

@Catch()
@Injectable()
export class AppErrorFilter implements ExceptionFilter<unknown> {
  constructor(@Inject(ILogger) private readonly logger: ILogger) {}

  async catch(error: unknown, host: ArgumentsHost): Promise<void> {
    const appError = this.toAppError(error);

    if (appError.code === "Internal") {
      this.logger.error(
        "Unhandled error",
        error instanceof Error ? error : new Error(String(error)),
      );
    }

    const response = host.switchToHttp().getResponse<FastifyReply>();

    // SAFETY: codes missing from the map fall through to INTERNAL_PROBLEM at
    // runtime.
    const { status, title } =
      PROBLEM_BY_CODE[appError.code] ?? INTERNAL_PROBLEM;

    const body: {
      type: string;
      code: string;
      detail: string;
      status: number;
      title: string;
      details?: ErrorDetails;
    } = {
      type: "about:blank",
      code: appError.code,
      detail: appError.message,
      status,
      title,
    };

    if (appError.details) body.details = appError.details;

    response.status(status);
    response.header("content-type", "application/problem+json");
    response.send(body);
  }

  private toAppError(error: unknown): AppError {
    if (error instanceof AppError) {
      return error;
    }

    const code = CODE_BY_STATUS[this.statusCodeOf(error)] ?? "Internal";

    const detail =
      code === "Internal" ? "Internal server error" : this.safeDetail(error);

    return new AppError(code, detail);
  }

  private statusCodeOf(error: unknown): number {
    if (error instanceof HttpException) {
      return error.getStatus();
    }

    if (
      error !== null &&
      typeof error === "object" &&
      "statusCode" in error &&
      typeof error.statusCode === "number" &&
      Number.isFinite(error.statusCode)
    ) {
      return error.statusCode;
    }

    return 500;
  }

  private safeDetail(error: unknown): string {
    if (
      error !== null &&
      typeof error === "object" &&
      "message" in error &&
      typeof error.message === "string" &&
      error.message.length > 0
    ) {
      return error.message;
    }

    return "Internal server error";
  }
}
