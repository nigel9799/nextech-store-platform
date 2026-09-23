import { render, screen } from "@testing-library/react";
import { ShowcaseHome } from "@/components/storefront/showcase-shell";
import {
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
  it("renders the completed-build showcase and primary calls to action", () => {
    render(
      <ShowcaseHome
        config={defaultStorefrontConfig}
        products={developmentSeedProducts}
      />,
    );
    expect(
      screen.getByRole("heading", { name: /PC builds that/i }),
    ).toBeVisible();
    expect(screen.getByRole("heading", { name: "PREBUILDS." })).toBeVisible();
    expect(
      screen.getAllByRole("link", { name: /Contact us/i }).length,
    ).toBeGreaterThan(0);
    expect(screen.getByRole("link", { name: "Messenger" })).toHaveAttribute(
      "href",
      "https://m.me/nextechmt",
    );
  });
});
