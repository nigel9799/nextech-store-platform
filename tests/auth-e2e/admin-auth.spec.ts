import { createHmac } from "node:crypto";
import { expect, test } from "@playwright/test";

function decodeBase32(value: string) {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let bits = "";
  for (const character of value.replace(/=+$/, "").toUpperCase()) {
    bits += alphabet.indexOf(character).toString(2).padStart(5, "0");
  }
  return Buffer.from(
    bits.match(/.{8}/g)?.map((byte) => Number.parseInt(byte, 2)) ?? [],
  );
}

function totp(secret: string) {
  const counter = Math.floor(Date.now() / 30_000);
  const buffer = Buffer.alloc(8);
  buffer.writeBigUInt64BE(BigInt(counter));
  const digest = createHmac("sha1", decodeBase32(secret))
    .update(buffer)
    .digest();
  const offset = digest[digest.length - 1] & 0x0f;
  const code =
    (((digest[offset] & 0x7f) << 24) |
      ((digest[offset + 1] & 0xff) << 16) |
      ((digest[offset + 2] & 0xff) << 8) |
      (digest[offset + 3] & 0xff)) %
    1_000_000;
  return code.toString().padStart(6, "0");
}

test("invitation-only owner completes MFA, manages members, and is revoked immediately", async ({
  page,
}) => {
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/admin\/login/);

  await page.getByLabel("Email address").fill("owner@local.nextech.test");
  await page.getByLabel("Password").fill("Nextech-local-test-2026!");
  await page.getByRole("button", { name: "Continue to verification" }).click();
  await expect(page).toHaveURL(/\/admin\/mfa\/enroll/);

  const secret = (await page.locator(".mfa-secret").textContent()) ?? "";
  if (Date.now() % 30_000 > 27_000) await page.waitForTimeout(3_500);
  await page.getByLabel("Authenticator code").fill(totp(secret));
  await page.getByRole("button", { name: "Verify and continue" }).click();
  await expect(
    page.getByRole("heading", { name: "ADMIN OVERVIEW" }),
  ).toBeVisible();
  await expect(page.getByText("MFA · AAL2")).toBeVisible();

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
