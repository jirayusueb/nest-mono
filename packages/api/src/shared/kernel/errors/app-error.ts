const HTTP_BY_CODE = {
  Conflict: { status: 409, title: "Conflict" },
  Forbidden: { status: 403, title: "Forbidden" },
  NotFound: { status: 404, title: "Not Found" },
  Unauthorized: { status: 401, title: "Unauthorized" },
  ValidationFailed: { status: 400, title: "Bad Request" },
  DomainError: { status: 422, title: "Unprocessable Entity" },
} as const;

const UNMAPPED = { status: 500, title: "Internal Server Error" } as const;

export interface ErrorDetails {
  issues?: Array<{
    path?: ReadonlyArray<string | number | symbol | { key: PropertyKey }>;
    message: string;
  }>;
}

interface ProblemDetails {
  type: string;
  code: string;
  detail: string;
  status: number;
  title: string;
  details?: ErrorDetails;
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

  get status(): number {
    // SAFETY: codes missing from the map fall through to UNMAPPED at runtime.
    return (HTTP_BY_CODE[this.code as keyof typeof HTTP_BY_CODE] ?? UNMAPPED)
      .status;
  }

  toResponse(): Response {
    // SAFETY: codes missing from the map fall through to UNMAPPED at runtime.
    const { status, title } =
      HTTP_BY_CODE[this.code as keyof typeof HTTP_BY_CODE] ?? UNMAPPED;

    const body: ProblemDetails = {
      type: "about:blank",
      code: this.code,
      detail: this.message,
      status,
      title,
    };

    if (this.details) body.details = this.details;

    return Response.json(body, {
      headers: { "content-type": "application/problem+json" },
      status,
    });
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
