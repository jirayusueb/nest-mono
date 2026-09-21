export const SESSION_COOKIE = "better-auth.session_token";

export const SESSION_COOKIE_SECURE = "SESSION_COOKIE_SECURE";

export interface SessionCookieOptions {
  httpOnly: boolean;
  sameSite: "lax";
  path: string;
  secure: boolean;
  expires: Date;
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
