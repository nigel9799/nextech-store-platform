import { expect, test } from "@playwright/test";

test("renders the responsive Nextech storefront", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: /PC builds that/i }),
  ).toBeVisible();
  await expect(page.getByRole("heading", { name: "PREBUILDS." })).toBeVisible();
  await expect(page.getByRole("link", { name: "Messenger" })).toHaveAttribute(
    "href",
    "https://m.me/nextechmt",
  );
  await page.getByRole("link", { name: "Gallery & Contact" }).first().click();
  await expect(page).toHaveURL(/\/gallery-contact$/);
  await expect(
    page.getByRole("heading", { name: "GALLERY & CONTACT." }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Send enquiry" }),
  ).toBeVisible();
});
