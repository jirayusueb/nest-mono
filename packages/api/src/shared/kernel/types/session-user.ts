import type { UserId } from "./ids";

export type Role = "admin" | "user";

export interface SessionUser {
  id: UserId;
  email: string;
  name: string;
  emailVerified: boolean;
  image: string | null;
  role: Role;
}
