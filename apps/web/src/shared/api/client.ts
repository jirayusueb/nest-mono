import { API_ORIGIN } from "../config";

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message);
  }
}

/** Cookies ride along; JSON both ways when a body is given. */
export async function apiFetch<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const jsonHeaders: Record<string, string> = {};

  if (init.body) {
    jsonHeaders["Content-Type"] = "application/json";
  }

  const res = await fetch(`${API_ORIGIN}${path}`, {
    credentials: "include",
    ...init,
    headers: {
      ...jsonHeaders,
      ...init.headers,
    },
  });

  if (!res.ok) {
    // SAFETY: problem+json body from our own AppError filter; members default
    // below when absent.
    const body = (await res.json().catch(() => ({}))) as {
      code?: string;
      message?: string;
    };

    throw new ApiError(
      res.status,
      body.code ?? "Unknown",
      body.message ?? res.statusText,
    );
  }

  // SAFETY: T is the declared route contract; failures bail out via ApiError
  // above.
  return res.status === 204 ? (undefined as T) : ((await res.json()) as T);
}
