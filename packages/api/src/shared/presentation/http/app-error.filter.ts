import {
  Catch,
  type ArgumentsHost,
  type ExceptionFilter,
} from "@nestjs/common";
import type { FastifyReply } from "fastify";
import { AppError } from "../../kernel/errors/app-error";

@Catch(AppError)
export class AppErrorFilter implements ExceptionFilter<AppError> {
  async catch(error: AppError, host: ArgumentsHost): Promise<void> {
    const response = host.switchToHttp().getResponse<FastifyReply>();
    const problem = error.toResponse();
    response.status(problem.status);

    for (const [key, value] of problem.headers) {
      response.header(key, value);
    }

    response.send(await problem.text());
  }
}
