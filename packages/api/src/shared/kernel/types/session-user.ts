import type { UserId } from "./ids";

/**
 * The identity every authenticated route sees. Wire shape mirrors better-auth's
 * user.
 */
export interface SessionUser {
  id: UserId;
  email: string;
  name: string;
  emailVerified: boolean;
  image: string | null;
}
