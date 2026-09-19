import { StandardSchemaValidationPipe as NestStandardSchemaValidationPipe } from "@nestjs/common";
import { AppError } from "../../kernel/errors/app-error";

/**
 * The global validation pipe: runs the Standard Schema a route param declares
 * via `@Body({ schema })` / `@Query({ schema })` / `@Param(name, { schema })`
 * (Nest 12 attaches the schema to the param metadata), and reports failures as
 * `AppError.validation` so `AppErrorFilter` serves the same problem+json shape
 * as every other failure.
 */
export class StandardSchemaValidationPipe extends NestStandardSchemaValidationPipe {
  constructor() {
    super({
      exceptionFactory: (issues) =>
        AppError.validation("Validation failed", {
          issues: issues.map((issue) => ({
            path: issue.path,
            message: issue.message,
          })),
        }),
    });
  }
}
