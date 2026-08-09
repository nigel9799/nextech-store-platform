import { expect, test } from "@playwright/test";

test("renders the responsive production foundation", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: /production foundation ready/i }),
  ).toBeVisible();
  await expect(page.getByText("Local development only")).toBeVisible();
});
