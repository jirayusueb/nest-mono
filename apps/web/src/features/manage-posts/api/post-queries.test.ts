import { describe, expect, it, vi } from "vitest";

import type { Post } from "~/shared/api";

import { postApi } from "./post-api";
import { POST_QUERIES } from "./post-queries";

const PAGE = {
  items: [],
  total: 0,
  page: 1,
  limit: 100,
  hasNext: false,
  hasPrev: false,
};

const POST: Post = {
  id: "p1",
  slug: "s",
  title: "T",
  content: "C",
  category: null,
  tags: [],
  thumbnailUrl: null,
  createdAt: "2026-01-01",
  updatedAt: "2026-01-01",
};

describe("POST_QUERIES", () => {
  it("lists posts via postApi.list", async () => {
    const list = vi.spyOn(postApi, "list").mockResolvedValue(PAGE);

    await POST_QUERIES.list().queryFn();

    expect(list).toHaveBeenCalled();
  });

  it("fetches a post detail by slug", async () => {
    const get = vi.spyOn(postApi, "get").mockResolvedValue(POST);

    await POST_QUERIES.detail("my-slug").queryFn();

    expect(get).toHaveBeenCalledWith("my-slug");
  });

  it("maps categories to names for the category query", async () => {
    vi.spyOn(postApi, "categories").mockResolvedValue({
      categories: [{ name: "Dev", slug: "dev" }],
    });

    const options = POST_QUERIES.categoryNames();
    const names = await options.queryFn();

    expect(options.queryKey).toEqual(["post-categories"]);
    expect(names).toEqual(["Dev"]);
  });
});