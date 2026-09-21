import { describe, expect, it } from "vitest";

import { offsetOf, toPaginatedResponse } from "./pagination";

describe("pagination", () => {
  it("skips no rows on the first page", () => {
    expect(offsetOf({ page: 1, limit: 20 })).toBe(0);
    expect(offsetOf({ page: 3, limit: 20 })).toBe(40);
  });

  it("has a next page but no previous one on the first page", () => {
    const page = toPaginatedResponse(["a", "b"], 5, { page: 1, limit: 2 });

    expect(page).toEqual({
      items: ["a", "b"],
      total: 5,
      page: 1,
      limit: 2,
      hasNext: true,
      hasPrev: false,
    });
  });

  it("has both neighbours in the middle", () => {
    const page = toPaginatedResponse(["c", "d"], 5, { page: 2, limit: 2 });

    expect(page.hasNext).toBe(true);
    expect(page.hasPrev).toBe(true);
  });

  it("has no next page when the last page is exactly full", () => {
    const page = toPaginatedResponse(["c", "d"], 4, { page: 2, limit: 2 });

    expect(page.hasNext).toBe(false);
    expect(page.hasPrev).toBe(true);
  });

  it("has no neighbours when there is nothing to page", () => {
    const page = toPaginatedResponse([], 0, { page: 1, limit: 20 });

    expect(page.hasNext).toBe(false);
    expect(page.hasPrev).toBe(false);
  });
});
