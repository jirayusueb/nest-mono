import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { MarkdownView } from "./markdown-view";

describe("MarkdownView", () => {
  it("renders markdown content into the editor", () => {
    const { container } = render(<MarkdownView value="# Hello" />);

    const editable = container.querySelector("[contenteditable]");
    expect(editable).not.toBeNull();
    expect(editable?.textContent).toContain("Hello");
  });
});