import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/auth-e2e",
  timeout: 90_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: 1,
  reporter: process.env.CI ? "github" : "list",
  use: { baseURL: "http://127.0.0.1:3000", trace: "retain-on-failure" },
  webServer: {
    command: "npm run dev -- --webpack -H 127.0.0.1 -p 3000",
    url: "http://127.0.0.1:3000/admin/login",
    reuseExistingServer: false,
    timeout: 120_000,
  },
  projects: [{ name: "auth-chromium", use: { ...devices["Desktop Chrome"] } }],
});
