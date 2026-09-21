import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { UiProvider } from "./ui-provider";

describe("UiProvider", () => {
  it("renders children inside the theme provider", () => {
    const { getByText } = render(
      <UiProvider>
        <span>hello</span>
      </UiProvider>,
    );

    expect(getByText("hello")).toBeInTheDocument();
  });
});