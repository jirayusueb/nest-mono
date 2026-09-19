/** Cookie name mirrors better-auth's default session cookie. */
export const SESSION_COOKIE = "better-auth.session_token";

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

export function sessionCookieOptions(expiresAt: Date): SessionCookieOptions {
  return {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
    expires: expiresAt,
  };
}

export function clearSessionCookieOptions(): SessionCookieOptions & {
  maxAge: number;
} {
  return { ...sessionCookieOptions(new Date(0)), maxAge: 0 };
}
