import { afterEach, describe, expect, it, vi } from "vitest";

import { apiFetch } from "./client";

function stubFetch(body: string | null, status = 200, statusText = "") {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => new Response(body, { status, statusText })),
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("apiFetch", () => {
  it("GETs the origin-joined path with credentials", async () => {
    stubFetch(JSON.stringify({ ok: true }));

    const data = await apiFetch<{ ok: boolean }>("/v1/posts");

    expect(data).toEqual({ ok: true });
    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:3000/v1/posts",
      expect.objectContaining({ credentials: "include" }),
    );
  });

  it("sends a JSON content-type when a body is present", async () => {
    stubFetch("{}");

    await apiFetch("/v1/posts", { method: "POST", body: "{}" });

    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:3000/v1/posts",
      expect.objectContaining({
        headers: expect.objectContaining({
          "Content-Type": "application/json",
        }),
      }),
    );
  });

  it("returns undefined for a 204 response", async () => {
    stubFetch(null, 204);

    await expect(
      apiFetch<void>("/v1/a", { method: "DELETE" }),
    ).resolves.toBeUndefined();
  });

  it("throws an ApiError carrying the problem+json code and message", async () => {
    stubFetch(JSON.stringify({ code: "NotFound", message: "nope" }), 404);

    await expect(apiFetch("/v1/x")).rejects.toMatchObject({
      status: 404,
      code: "NotFound",
      message: "nope",
    });
  });

  it("falls back to statusText when the error body is not JSON", async () => {
    stubFetch("not json", 500, "Crashed");

    await expect(apiFetch("/v1/x")).rejects.toMatchObject({
      code: "Unknown",
      message: "Crashed",
    });
  });
});