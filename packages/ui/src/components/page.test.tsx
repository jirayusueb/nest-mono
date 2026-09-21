import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Page } from "./page";

describe("Page", () => {
  it("renders header, title, and body content", () => {
    const { getByRole, getByText } = render(
      <Page>
        <Page.Header>
          <Page.Title>My Posts</Page.Title>
        </Page.Header>
        <p>body</p>
      </Page>,
    );

    expect(getByRole("heading", { name: "My Posts" })).toBeInTheDocument();
    expect(getByText("body")).toBeInTheDocument();
  });
});