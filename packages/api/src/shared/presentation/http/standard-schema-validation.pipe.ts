import { StandardSchemaValidationPipe as NestStandardSchemaValidationPipe } from "@nestjs/common";

import { AppError } from "~/shared/kernel/errors/app-error";

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
