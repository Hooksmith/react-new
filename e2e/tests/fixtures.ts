import { test as base, expect, type Page } from "@playwright/test";

export async function login(page: Page, username: "officer" | "analyst" = "officer") {
  await page.goto("/login");
  await page.getByLabel("Username").fill(username);
  await page.getByLabel("Password").fill("Password123!");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByRole("heading", { name: "Portfolio overview" })).toBeVisible();
}

export const test = base.extend<{ officerPage: Page; analystPage: Page }>({
  officerPage: async ({ page }, use) => {
    await login(page, "officer");
    await use(page);
  },
  analystPage: async ({ page }, use) => {
    await login(page, "analyst");
    await use(page);
  },
});

export { expect };
