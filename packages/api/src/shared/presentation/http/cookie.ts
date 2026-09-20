export const SESSION_COOKIE = "better-auth.session_token";

export const SESSION_COOKIE_SECURE = "SESSION_COOKIE_SECURE";

export interface SessionCookieOptions {
  httpOnly: boolean;
  sameSite: "lax";
  path: string;
  secure: boolean;
  expires: Date;
}

export function readSessionToken(headers: Headers): string | null {
  const cookieHeader = headers.get("cookie");

  if (!cookieHeader) {
    return null;
  }

  for (const part of cookieHeader.split(";")) {
    const [name, ...rest] = part.trim().split("=");

    if (name === SESSION_COOKIE) {
      return decodeURIComponent(rest.join("="));
    }
  }

  return null;
}

export function sessionCookieOptions(
  expiresAt: Date,
  secure: boolean,
): SessionCookieOptions {
  return {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure,
    expires: expiresAt,
  };
}

export function clearSessionCookieOptions(
  secure: boolean,
): SessionCookieOptions & {
  maxAge: number;
} {
  return { ...sessionCookieOptions(new Date(0), secure), maxAge: 0 };
}
