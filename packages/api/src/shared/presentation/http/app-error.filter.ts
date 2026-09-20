import {
  Catch,
  HttpException,
  Inject,
  Injectable,
  type ArgumentsHost,
  type ExceptionFilter,
} from "@nestjs/common";
import type { FastifyReply } from "fastify";
import { LOGGER, type ILogger } from "../../application/interfaces/i-logger";
import { AppError } from "../../kernel/errors/app-error";

const CODE_BY_STATUS: Record<number, string> = {
  400: "ValidationFailed",
  401: "Unauthorized",
  404: "NotFound",
  409: "Conflict",
};

@Catch()
@Injectable()
export class AppErrorFilter implements ExceptionFilter<unknown> {
  constructor(@Inject(LOGGER) private readonly logger: ILogger) {}

  async catch(error: unknown, host: ArgumentsHost): Promise<void> {
    const appError = this.toAppError(error);
    if (appError.code === "Internal") {
      this.logger.error(
        "Unhandled error",
        error instanceof Error ? error : new Error(String(error)),
      );
    }
    const response = host.switchToHttp().getResponse<FastifyReply>();
    const problem = appError.toResponse();
    response.status(problem.status);
    for (const [key, value] of problem.headers) {
      response.header(key, value);
    }
    response.send(await problem.text());
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
