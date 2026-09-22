import { afterEach, describe, expect, it, vi } from "vitest";

import { ConfigService } from "~/shared/infrastructure/config/config-service";
import type { Env } from "~/shared/infrastructure/config/env";

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

const config = new ConfigService(env);

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("rust fs bucket store", () => {
  it("presignPut returns a signed PUT URL for the object key", async () => {
    const store = new RustFsBucketStore(config);

    const url = new URL(
      await store.presignPut("dir/my file.png", "image/png", 300),
    );

    expect(url.origin).toBe("http://localhost:9000");
    expect(url.pathname).toBe("/media/dir/my%20file.png");
    expect(url.searchParams.get("X-Amz-Algorithm")).toBe("AWS4-HMAC-SHA256");
    expect(url.searchParams.get("X-Amz-Expires")).toBe("300");
    expect(url.searchParams.get("X-Amz-SignedHeaders")).toBe("host");
    expect(url.searchParams.get("X-Amz-Credential")).toContain(
      "/us-east-1/s3/aws4_request",
    );
    expect(url.searchParams.get("X-Amz-Signature")).toMatch(/^[0-9a-f]{64}$/);
  });

  it("publicUrl joins endpoint, bucket, and key", () => {
    const store = new RustFsBucketStore(config);
    expect(store.publicUrl("a/b.png")).toBe(
      "http://localhost:9000/media/a/b.png",
    );
  });

  it("head returns null for a missing object", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(null, { status: 404 })),
    );

    const store = new RustFsBucketStore(config);
    expect(await store.head("missing.png")).toBeNull();
  });

  it("delete ignores a 404 and throws on other failures", async () => {
    const store = new RustFsBucketStore(config);

    vi.stubGlobal("fetch", vi.fn(async () => new Response(null, { status: 404 })));
    await expect(store.delete("missing.png")).resolves.toBeUndefined();

    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(null, { status: 403 })),
    );
    await expect(store.delete("broken.png")).rejects.toThrow(
      "S3 delete failed: 403",
    );
  });
});
