export interface ErrorDetails {
  issues?: Array<{
    path?: ReadonlyArray<string | number | symbol | { key: PropertyKey }>;
    message: string;
  }>;
}

export class AppError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly details?: ErrorDetails,
  ) {
    super(message);
    this.name = "AppError";
  }

  static validation(message: string, details?: ErrorDetails): AppError {
    return new AppError("ValidationFailed", message, details);
  }

  static notFound(resource: string): AppError {
    return new AppError("NotFound", `${resource} not found`);
  }

  static unauthorized(message = "Unauthorized"): AppError {
    return new AppError("Unauthorized", message);
  }

  static conflict(message: string): AppError {
    return new AppError("Conflict", message);
  }

  static forbidden(message = "Forbidden"): AppError {
    return new AppError("Forbidden", message);
  }
}
