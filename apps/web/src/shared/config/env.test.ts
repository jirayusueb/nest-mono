import { describe, expect, it } from "vitest";

import { API_ORIGIN } from "./env";

describe("API_ORIGIN", () => {
  it("defaults to the local API origin", () => {
    expect(API_ORIGIN).toBe("http://localhost:3000");
  });
});