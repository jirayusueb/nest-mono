import type { Role } from "~/shared/kernel/types/session-user";

export function roleForEmail(
  email: string,
  adminEmails: ReadonlySet<string>,
): Role {
  return adminEmails.has(email.toLowerCase()) ? "admin" : "user";
}
