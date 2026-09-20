import { describe, expect, test } from "vitest";
import type { Env } from "../../../../shared/infrastructure/config/env";
import { RustFsBucketStore } from "./rust-fs-bucket-store";

const env = {
  NODE_ENV: "test",
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

describe("RustFsBucketStore", () => {
  test("presignPut returns a signed PUT URL for the object key", async () => {
    const store = new RustFsBucketStore(env);

    const url = new URL(
      await store.presignPut("dir/my file.png", "image/png", 300),
    );

    expect(url.origin).toBe("http://localhost:9000");
    expect(url.pathname).toBe("/media/dir/my%20file.png");
    expect(url.searchParams.get("X-Amz-Algorithm")).toBe(
      "AWS4-HMAC-SHA256",
    );
    expect(url.searchParams.get("X-Amz-Expires")).toBe("300");
    expect(url.searchParams.get("X-Amz-SignedHeaders")).toBe("host");
    expect(url.searchParams.get("X-Amz-Credential")).toContain(
      "/us-east-1/s3/aws4_request",
    );
    expect(url.searchParams.get("X-Amz-Signature")).toMatch(
      /^[0-9a-f]{64}$/,
    );
  });

  test("publicUrl joins endpoint, bucket, and key", () => {
    const store = new RustFsBucketStore(env);
    expect(store.publicUrl("a/b.png")).toBe(
      "http://localhost:9000/media/a/b.png",
    );
  });
});
