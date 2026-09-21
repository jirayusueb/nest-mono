import { describe, expect, it } from "vitest";

import { theme } from "./theme";

describe("theme", () => {
  it("provides light and dark color schemes", () => {
    expect(theme.colorSchemes?.light).toBeDefined();
    expect(theme.colorSchemes?.dark).toBeDefined();
  });
});