/**
 * The HTTP face of each code. An unmapped code is a gap, not a client fault.
 */
const HTTP_BY_CODE = {
  Conflict: { status: 409, title: "Conflict" },
  NotFound: { status: 404, title: "Not Found" },
  Unauthorized: { status: 401, title: "Unauthorized" },
  ValidationFailed: { status: 400, title: "Bad Request" },
} as const;

const UNMAPPED = { status: 500, title: "Internal Server Error" } as const;

/**
 * Structured details carried in the problem document's `details` member. Owned
 * by the validation pipe today; extend with named members as producers appear —
 * never an open dictionary.
 */
export interface ErrorDetails {
  issues?: Array<{
    path?: ReadonlyArray<string | number | symbol | { key: PropertyKey }>;
    message: string;
  }>;
}

/** The JSON body `toResponse` serves. */
interface ProblemBody {
  type: string;
  code: string;
  detail: string;
  status: number;
  title: string;
  details?: ErrorDetails;
}

/**
 * Domain/application failure. Extends Error so it can be thrown across any
 * boundary (and carry a stack), and describes its own HTTP response so no
 * separate error-mapping hook is needed at any edge.
 */
export class AppError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly details?: ErrorDetails,
  ) {
    super(message);
    this.name = "AppError";
  }

  /** Read by the app's logging hook to tell client faults from real 500s. */
  get status(): number {
    // SAFETY: codes missing from the map fall through to UNMAPPED at runtime.
    return (HTTP_BY_CODE[this.code as keyof typeof HTTP_BY_CODE] ?? UNMAPPED)
      .status;
  }

  /** RFC 9457 problem document, served as the error wire format. */
  toResponse(): Response {
    // SAFETY: codes missing from the map fall through to UNMAPPED at runtime.
    const { status, title } =
      HTTP_BY_CODE[this.code as keyof typeof HTTP_BY_CODE] ?? UNMAPPED;

    const body: ProblemBody = {
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
}
