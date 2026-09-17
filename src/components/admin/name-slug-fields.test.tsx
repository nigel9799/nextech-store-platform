import { fireEvent, render, screen } from "@testing-library/react";
import { NameSlugFields } from "./name-slug-fields";

describe("NameSlugFields", () => {
  it("generates a normalized slug from the name", () => {
    render(<NameSlugFields itemLabel="Product" />);
    fireEvent.change(screen.getByLabelText(/Product name/i), {
      target: { value: "Nextech Café Gaming Mouse" },
    });
    expect(screen.getByLabelText(/Page slug/i)).toHaveValue(
      "nextech-cafe-gaming-mouse",
    );
  });

  it("preserves a manually edited slug when the name changes", () => {
    render(<NameSlugFields itemLabel="Category" />);
    fireEvent.change(screen.getByLabelText(/Category name/i), {
      target: { value: "Gaming Accessories" },
    });
    fireEvent.change(screen.getByLabelText(/Page slug/i), {
      target: { value: "gear" },
    });
    fireEvent.change(screen.getByLabelText(/Category name/i), {
      target: { value: "PC Accessories" },
    });
    expect(screen.getByLabelText(/Page slug/i)).toHaveValue("gear");
  });
});
