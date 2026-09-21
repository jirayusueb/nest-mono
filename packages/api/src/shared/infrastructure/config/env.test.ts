import { afterEach, describe, expect, it, vi } from "vitest";

import { loadEnv } from "./env";

const base = {
  DATABASE_URL: "postgres://test",
  S3_ENDPOINT: "http://localhost:9000",
  S3_BUCKET: "media",
  S3_ACCESS_KEY_ID: "nest-mono",
  S3_SECRET_ACCESS_KEY: "nest-mono-secret",
};

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("loadEnv", () => {
  it("applies defaults for optional fields", () => {
    vi.stubEnv("DATABASE_URL", base.DATABASE_URL);
    vi.stubEnv("S3_ENDPOINT", base.S3_ENDPOINT);
    vi.stubEnv("S3_BUCKET", base.S3_BUCKET);
    vi.stubEnv("S3_ACCESS_KEY_ID", base.S3_ACCESS_KEY_ID);
    vi.stubEnv("S3_SECRET_ACCESS_KEY", base.S3_SECRET_ACCESS_KEY);

    const env = loadEnv();

    expect(env.PORT).toBe(3000);
    expect(env.S3_REGION).toBe("us-east-1");
    expect(env.ADMIN_EMAILS).toBe("");
  });

  it("exits when a required variable is missing", () => {
    vi.stubEnv("DATABASE_URL", base.DATABASE_URL);
    vi.stubEnv("S3_BUCKET", base.S3_BUCKET);

    const exit = vi.spyOn(process, "exit").mockImplementation(() => {
      throw new Error("process.exit");
    });

    expect(() => loadEnv()).toThrow("process.exit");
    expect(exit).toHaveBeenCalledWith(1);
  });
});