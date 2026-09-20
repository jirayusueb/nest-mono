export const ADMIN_EMAILS = "ADMIN_EMAILS";

// ponytail: env allowlist, no user.role column; add the column if email churn
// or DB-source-of-truth bites.
export function parseAdminEmails(raw: string | undefined): ReadonlySet<string> {
  return new Set(
    (raw ?? "")
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter((email) => email !== ""),
  );
}
