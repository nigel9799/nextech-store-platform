import { render, screen } from "@testing-library/react";
import FoundationPage from "./page";

describe("foundation page", () => {
  it("identifies the approved milestone without claiming later features", () => {
    render(<FoundationPage />);
    expect(
      screen.getByRole("heading", {
        name: /production\s*foundation ready/i,
      }),
    ).toBeVisible();
    expect(screen.getByText("01 / Foundation")).toBeVisible();
    expect(screen.queryByText(/checkout/i)).not.toBeInTheDocument();
  });
});
