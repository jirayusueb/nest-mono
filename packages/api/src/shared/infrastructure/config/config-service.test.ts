import { describe, expect, it } from "vitest";

import type { Env } from "./env";
import { ConfigService } from "./config-service";

const env = {
  NODE_ENV: "development",
  PORT: 3000,
  WEB_ORIGIN: "http://localhost:5173",
  DATABASE_URL: "postgres://test",
  S3_ENDPOINT: "http://localhost:9000",
  S3_BUCKET: "media",
  S3_REGION: "us-east-1",
  S3_ACCESS_KEY_ID: "nest-mono",
  S3_SECRET_ACCESS_KEY: "nest-mono-secret",
  ADMIN_EMAILS: "",
} satisfies Env;

const withAdmins = (raw: string) =>
  new ConfigService({ ...env, ADMIN_EMAILS: raw });

describe("config service", () => {
  it("parses admin emails: trims, lowercases, drops empties", () => {
    expect(withAdmins(" A@Example.com , b@X.io ,").adminEmails).toEqual(
      new Set(["a@example.com", "b@x.io"]),
    );
    expect(withAdmins("").adminEmails).toEqual(new Set());
  });

  it("isProduction reflects NODE_ENV", () => {
    expect(new ConfigService(env).isProduction).toBe(false);
    expect(
      new ConfigService({ ...env, NODE_ENV: "production" }).isProduction,
    ).toBe(true);
  });
});
