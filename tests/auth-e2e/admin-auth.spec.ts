import { expect, test } from "@playwright/test";

test("password authentication rejects invalid credentials without account disclosure", async ({
  page,
}) => {
  await page.goto("/admin/login");
  await page.getByLabel("Email address").fill("owner@local.nextech.test");
  await page.getByLabel("Password").fill("not-the-owner-password");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/admin\/login\?error=invalid/);
  await expect(
    page.getByText("The email or password was not accepted."),
  ).toBeVisible();
});

test("local fixture signs in and out securely, manages members, and is revoked immediately", async ({
  page,
}) => {
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/admin\/login/);

  await page.getByLabel("Email address").fill("owner@local.nextech.test");
  await page.getByLabel("Password").fill("Nextech-local-test-2026!");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(
    page.getByRole("heading", { name: "ADMIN OVERVIEW" }),
  ).toBeVisible();
  await expect(page.getByText("PASSWORD AUTHENTICATED")).toBeVisible();

  await page.getByRole("button", { name: "Log out" }).press("Enter");
  await expect(page).toHaveURL(/\/admin\/login\?notice=signed-out/);
  await expect(page.getByText("You have signed out safely.")).toBeVisible();

  await page.getByLabel("Email address").fill("owner@local.nextech.test");
  await page.getByLabel("Password").fill("Nextech-local-test-2026!");
  await page.getByRole("button", { name: "Sign in" }).click();

  await page.getByRole("link", { name: "Team & roles" }).click();
  await page.getByLabel("Email").fill("staff-invite@local.nextech.test");
  await page.getByLabel("Role").selectOption("catalogue_manager");
  await page.getByRole("button", { name: "Send invitation" }).click();
  await expect(page.getByText("Invitation created.")).toBeVisible();
  await expect(page.getByText("staff-invite@local.nextech.test")).toBeVisible();

  const ownRow = page
    .getByRole("row")
    .filter({ hasText: /^owner@local\.nextech\.test/ });
  await ownRow.locator('select[name="status"]').selectOption("suspended");
  await ownRow.getByRole("button", { name: "Save" }).click();
  await expect(page).toHaveURL(/\/admin\/login\?notice=access-revoked/);
});

test("password recovery does not disclose whether an account exists", async ({
  page,
}) => {
  await page.goto("/admin/forgot-password");
  await page.getByLabel("Email address").fill("unknown@local.nextech.test");
  await page.getByRole("button", { name: "Send reset link" }).click();
  await expect(page.getByText("If an invited account exists")).toBeVisible();
});
