import type { Env } from "./env";

export class ConfigService {
  constructor(readonly env: Env) {}

  get isProduction(): boolean {
    return this.env.NODE_ENV === "production";
  }

  get adminEmails(): ReadonlySet<string> {
    return new Set(
      this.env.ADMIN_EMAILS.split(",")
        .map((email) => email.trim().toLowerCase())
        .filter((email) => email !== ""),
    );
  }
}
