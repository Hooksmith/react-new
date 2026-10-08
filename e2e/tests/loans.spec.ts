import { expect, test } from "./fixtures";

test("navigates across zones and filters the loan list", async ({ officerPage: page }) => {
  // Cross-zone hard navigation from shell → loans zone.
  await page.goto("/loans");
  await expect(page.getByRole("heading", { name: "Loan applications" })).toBeVisible();

  await page.getByLabel("Status").selectOption("APPROVED");
  await expect(page).toHaveURL(/status=APPROVED/);
  const statuses = page.locator("tbody tr td:last-child");
  await expect(statuses.first()).toContainText("Approved");
});

test("submits a loan application end to end", async ({ officerPage: page }) => {
  await page.goto("/loans/apply");

  await page.getByLabel("Full name").fill("Sokha Chan");
  await page.getByLabel("National ID").fill("012345678");
  await page.getByLabel("Email").fill("sokha@example.com");
  await page.getByLabel("Phone").fill("+85512345678");
  await page.getByLabel("Date of birth").fill("1990-05-01");
  await page.getByRole("button", { name: "Continue" }).click();

  await page.getByLabel("Employer name").fill("ACME Co., Ltd.");
  await page.getByLabel(/Net monthly income/).fill("2500");
  await page.getByRole("button", { name: "Continue" }).click();

  await page.getByLabel("Amount").fill("10000");
  await page.getByLabel("Term (months)").fill("36");
  await page.getByLabel("Purpose").fill("Home renovation and furniture");
  await expect(page.getByText(/Estimated installment/)).toBeVisible();
  await page.getByRole("button", { name: "Continue" }).click();

  await expect(page.getByText("•••••5678")).toBeVisible();
  await page.getByRole("button", { name: "Submit application" }).click();

  await expect(page.getByRole("heading", { name: "Application submitted" })).toBeVisible();
});

test("enforces segregation of duties", async ({ officerPage: page }) => {
  await page.goto("/loans?status=UNDER_REVIEW");
  await page.locator("tbody a").first().click();
  await expect(page.getByRole("heading", { name: "Decision" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Approve" })).toHaveCount(0);
  await expect(page.getByText(/require a credit analyst/)).toBeVisible();
});

test("analysts can approve under-review loans", async ({ analystPage: page }) => {
  await page.goto("/loans?status=UNDER_REVIEW");
  await page.locator("tbody a").first().click();
  await page.getByRole("button", { name: "Approve" }).click();
  await expect(page.getByRole("status").filter({ hasText: /is now Approved/ })).toBeAttached();
});
