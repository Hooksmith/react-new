import { defineConfig, devices } from "@playwright/test";

const CI = !!process.env.CI;
// In CI we test production builds (`pnpm build` runs first); locally, dev servers.
const cmd = (app: "shell" | "loans") => `pnpm --filter @nexbank/${app} ${CI ? "start" : "dev"}`;
// Both zones must share the secret that signs the session cookie.
const SESSION_SECRET = process.env.SESSION_SECRET ?? "e2e-only-session-secret-0123456789abcdef";

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: CI,
  retries: CI ? 2 : 0,
  reporter: CI ? [["github"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],
  webServer: [
    {
      command: cmd("loans"),
      url: "http://localhost:3001/loans/api/health",
      reuseExistingServer: !CI,
      cwd: "..",
      timeout: 120_000,
      env: { SESSION_SECRET },
    },
    {
      command: cmd("shell"),
      url: "http://localhost:3000/api/health",
      reuseExistingServer: !CI,
      cwd: "..",
      timeout: 120_000,
      env: { SESSION_SECRET, LOANS_ZONE_URL: "http://localhost:3001" },
    },
  ],
});
