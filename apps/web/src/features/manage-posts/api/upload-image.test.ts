import { afterEach, describe, expect, it, vi } from "vitest";

import { uploadImage } from "./upload-image";

const TARGET = {
  key: "k1",
  uploadUrl: "https://bucket/k1",
  url: "https://cdn/k1",
};

function stubUpload(putStatus = 200) {
  const calls: Array<{ url: string; init: RequestInit }> = [];

  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string, init: RequestInit = {}) => {
      calls.push({ url, init });

      if (url === "https://bucket/k1") {
        return new Response(null, { status: putStatus });
      }

      if (init.method === "POST" && url.includes("/media/target")) {
        return new Response(JSON.stringify(TARGET), { status: 200 });
      }

      return new Response(JSON.stringify({ url: "https://cdn/k1" }), {
        status: 200,
      });
    }),
  );

  return calls;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("uploadImage", () => {
  it("requests a target, PUTs the file, confirms, and returns the CDN url", async () => {
    const calls = stubUpload();
    const file = new File(["x"], "a.png", { type: "image/png" });

    const url = await uploadImage(file);

    expect(url).toBe("https://cdn/k1");
    const targetCall = calls.find((c) => c.url.includes("/media/target"));
    expect(targetCall?.init.body).toBe(
      JSON.stringify({ contentType: "image/png", bytes: 1 }),
    );
    const putCall = calls.find((c) => c.url === "https://bucket/k1");
    expect(putCall?.init.method).toBe("PUT");
    expect(putCall?.init.body).toBe(file);
  });

  it("throws when the object upload fails", async () => {
    stubUpload(500);

    await expect(
      uploadImage(new File(["x"], "a.png", { type: "image/png" })),
    ).rejects.toThrow("Upload failed: 500");
  });
});