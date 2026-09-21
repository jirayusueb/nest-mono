import { afterEach, describe, expect, it, vi } from "vitest";

import { postApi } from "./post-api";

function stubJson(body = "{}", status = 200) {
  vi.stubGlobal("fetch", vi.fn(async () => new Response(body, { status })));
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("postApi", () => {
  it("lists posts with paging params", async () => {
    stubJson();
    await postApi.list({ page: 2, limit: 20 });
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("/v1/posts?page=2&limit=20"),
      expect.any(Object),
    );
  });

  it("defaults list paging to page 1 limit 100", async () => {
    stubJson();
    await postApi.list();
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("page=1&limit=100"),
      expect.any(Object),
    );
  });

  it("gets a post by slug", async () => {
    stubJson();
    await postApi.get("my-post");
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("/v1/posts/my-post"),
      expect.any(Object),
    );
  });

  it("fetches categories", async () => {
    stubJson();
    await postApi.categories();
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("/v1/posts/categories"),
      expect.any(Object),
    );
  });

  it("creates a post via POST with a JSON body", async () => {
    stubJson();
    await postApi.create({ title: "t", content: "c", tags: [] });
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("/v1/posts"),
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ title: "t", content: "c", tags: [] }),
      }),
    );
  });

  it("updates a post via PATCH", async () => {
    stubJson();
    await postApi.update("p1", { title: "new" });
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("/v1/posts/p1"),
      expect.objectContaining({ method: "PATCH" }),
    );
  });

  it("removes a post via DELETE", async () => {
    stubJson(null, 204);
    await postApi.remove("p1");
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("/v1/posts/p1"),
      expect.objectContaining({ method: "DELETE" }),
    );
  });
});