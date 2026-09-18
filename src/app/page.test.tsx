import { render, screen } from "@testing-library/react";
import { StorefrontShell } from "@/components/storefront/storefront-shell";
import {
  defaultStorefrontCategories,
  defaultStorefrontConfig,
  developmentSeedProducts,
} from "@/lib/storefront/defaults";

/* eslint-disable @next/next/no-img-element */
vi.mock("next/image", () => ({
  default: (props: Record<string, unknown>) => {
    const { priority, ...rest } = props;
    void priority;
    return <img alt="" {...rest} />;
  },
}));
/* eslint-enable @next/next/no-img-element */

describe("storefront page", () => {
  it("renders the catalogue and launch enquiry guidance", () => {
    render(
      <StorefrontShell
        config={defaultStorefrontConfig}
        categories={defaultStorefrontCategories}
        products={developmentSeedProducts}
      />,
    );
    expect(document.querySelector("#hero-title")).toBeVisible();
    expect(screen.getAllByText("Prebuilt PCs").length).toBeGreaterThan(0);
    expect(screen.getByText(/emailed to Nextech/i)).toBeVisible();
    expect(
      screen.getByRole("button", { name: /WhatsApp instead/i }),
    ).toBeVisible();
  });
});
