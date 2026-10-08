import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "./fixtures";

const scan = (page: Parameters<typeof AxeBuilder>[0]["page"]) =>
  new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze();

test("login page has no WCAG A/AA violations", async ({ page }) => {
  await page.goto("/login");
  expect((await scan(page)).violations).toEqual([]);
});

for (const path of ["/", "/analytics", "/loans", "/loans/apply"]) {
  test(`${path} has no WCAG A/AA violations`, async ({ officerPage: page }) => {
    await page.goto(path);
    await page.waitForLoadState("networkidle");
    expect((await scan(page)).violations).toEqual([]);
  });
}

test("skip link moves focus to main content", async ({ officerPage: page }) => {
  await page.keyboard.press("Tab");
  const skip = page.getByRole("link", { name: "Skip to main content" });
  await expect(skip).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.locator("#main")).toBeFocused();
});

test("pages never scroll horizontally (phones / 400% zoom reflow, WCAG 1.4.10)", async ({
  officerPage: page,
}) => {
  for (const path of ["/", "/analytics", "/loans", "/loans/apply"]) {
    await page.goto(path);
    const { scrollWidth, clientWidth } = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));
    expect(scrollWidth, path).toBeLessThanOrEqual(clientWidth);
  }
});
