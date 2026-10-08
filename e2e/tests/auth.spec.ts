import { expect, login, test } from "./fixtures";

test("unauthenticated users are redirected to sign in, then returned", async ({ page }) => {
  await page.goto("/loans");
  await expect(page).toHaveURL(/\/login\?next=%2Floans/);

  await page.getByLabel("Username").fill("officer");
  await page.getByLabel("Password").fill("Password123!");
  await page.getByRole("button", { name: "Sign in" }).click();

  await expect(page.getByRole("heading", { name: "Loan applications" })).toBeVisible();
});

test("shows a generic error for bad credentials", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Username").fill("officer");
  await page.getByLabel("Password").fill("not-the-password");
  await page.getByRole("button", { name: "Sign in" }).click();
  // Filter: Next.js also renders a (empty) role="alert" route announcer.
  await expect(page.getByRole("alert").filter({ hasText: /\S/ })).toHaveText(
    "Incorrect username or password",
  );
});

test("API rejects unauthenticated and CSRF-less requests", async ({ page, request }) => {
  expect((await request.get("/api/loans")).status()).toBe(401);

  await login(page);
  // Authenticated cookie but no CSRF header → 403.
  const res = await page.request.post("/api/loans", { data: {} });
  expect(res.status()).toBe(403);
});

test("sends hardened security headers", async ({ page }) => {
  const res = await page.goto("/login");
  const headers = res!.headers();
  expect(headers["content-security-policy"]).toContain("frame-ancestors 'none'");
  expect(headers["content-security-policy"]).toMatch(/'nonce-[\w-]+'/);
  expect(headers["x-content-type-options"]).toBe("nosniff");
  expect(headers["x-powered-by"]).toBeUndefined();
});
