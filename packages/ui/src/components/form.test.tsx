import { fireEvent, render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { Form } from "./form";

describe("Form", () => {
  it("renders fields and a submit button, and submits on submit", () => {
    const onSubmit = vi.fn((event) => event.preventDefault());

    const { getByLabelText, getByRole } = render(
      <Form onSubmit={onSubmit}>
        <Form.Field label="Email" name="email" />
        <Form.Submit>Save</Form.Submit>
      </Form>,
    );

    fireEvent.submit(getByRole("button", { name: "Save" }));

    expect(getByLabelText("Email")).toBeInTheDocument();
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });
});