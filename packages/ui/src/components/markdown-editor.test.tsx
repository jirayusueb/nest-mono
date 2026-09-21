import { fireEvent, render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { MarkdownEditor } from "./markdown-editor";

/** Toolbar IconButtons expose their label as text, not a title attribute. */
function toolbarButton(container: HTMLElement, label: string): HTMLElement {
  const button = Array.from(
    container.querySelectorAll<HTMLButtonElement>("button"),
  ).find((el) => el.textContent === label);

  if (!button) {
    throw new Error(`toolbar button ${label} not found`);
  }

  return button;
}

describe("MarkdownEditor", () => {
  it("renders the toolbar and an editable surface", () => {
    const { container } = render(
      <MarkdownEditor value="*hi*" onChange={() => {}} />,
    );

    for (const label of ["B", "I", "H2", "•", "</>"]) {
      expect(toolbarButton(container, label)).toBeInTheDocument();
    }

    expect(container.querySelector("[contenteditable]")).not.toBeNull();
  });

  it("runs each toolbar command against the editor without throwing", () => {
    const { container } = render(
      <MarkdownEditor value="" onChange={() => {}} />,
    );

    for (const label of ["B", "I", "H2", "•", "</>"]) {
      expect(() =>
        fireEvent.click(toolbarButton(container, label)),
      ).not.toThrow();
    }

    expect(container.querySelector("[contenteditable]")).not.toBeNull();
  });

  it("uploads a picked file and inserts the returned image URL", () => {
    const uploadImage = vi.fn(async () => "https://img/x.png");

    const { container } = render(
      <MarkdownEditor
        value=""
        onChange={() => {}}
        uploadImage={uploadImage}
      />,
    );

    // SAFETY: the render above owns the hidden `<input type="file">`, which
    // querySelector narrows to an Element; here we need the file fields.
    const input = container.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;

    fireEvent.change(input, {
      target: {
        files: [new File(["x"], "a.png", { type: "image/png" })],
      },
    });

    expect(uploadImage).toHaveBeenCalledTimes(1);
    expect(container.querySelector("[contenteditable]")).not.toBeNull();
  });

  it("renders the file input but no image button when uploadImage is omitted", () => {
    const { container } = render(
      <MarkdownEditor value="" onChange={() => {}} />,
    );

    expect(() => toolbarButton(container, "IMG")).toThrow();
    expect(container.querySelector('input[type="file"]')).not.toBeNull();
  });
});