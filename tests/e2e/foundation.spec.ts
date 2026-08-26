import { expect, test } from "@playwright/test";

test("renders the responsive Nextech storefront", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("#hero-title")).toBeVisible();
  await expect(
    page.getByText("Free Malta delivery on orders over €100"),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: "Admin login" })).toHaveAttribute(
    "href",
    "/admin",
  );
});
