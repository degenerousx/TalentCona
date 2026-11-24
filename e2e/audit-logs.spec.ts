import { test, expect, sent } from "./fixtures";

test.beforeEach(async ({ page }) => {
  await page.goto("/audit-logs");
  await expect(page.getByRole("heading", { name: "Audit & System Logs" })).toBeVisible();
});

const rows = (page: import("@playwright/test").Page) => page.getByRole("table").getByRole("row").filter({ has: page.getByRole("cell") });

test("summary cards and the security alert come from the backend", async ({ page }) => {
  const summary = page.getByRole("region", { name: "Summary" });
  await expect(summary.getByText("Events today").locator("xpath=following-sibling::p[1]")).toHaveText("5");
  await expect(page.getByRole("alert").getByText("1 security event needs review")).toBeVisible();
  expect((await sent(page, "GET", "/audit/logs/summary")).query).toEqual({ range: "1d" });
});

test("rows show actor, readable activity, module and IP", async ({ page }) => {
  await expect(rows(page).first()).toHaveAccessibleName(/^Semi Lore Student Wallet enrollment debited al-1 Financial Ops/);
  await expect(page.getByRole("row", { name: /Kemi Okon Admin Mentor matched al-2 User Management .* 104\.22\.160\.19/ })).toBeVisible();
  // MFA stays upper case when the action is made readable.
  await expect(page.getByRole("button", { name: "Admin MFA verification failed" })).toBeVisible();
});

test("search is sent to the backend", async ({ page }) => {
  await page.getByRole("textbox", { name: "Search audit log" }).fill("104.22");
  await expect(rows(page)).toHaveCount(1);
  expect((await sent(page, "GET", "/audit/logs")).query).toMatchObject({ search: "104.22", limit: "100" });
});

test("user type and module filters narrow the list", async ({ page }) => {
  await page.getByRole("combobox", { name: "Users" }).selectOption("Student");
  await expect(rows(page)).toHaveCount(1);
  await expect(rows(page).first()).toContainText("Semi Lore");

  await page.getByRole("combobox", { name: "Users" }).selectOption("All users");
  await page.getByRole("combobox", { name: "Modules" }).selectOption("Admin Management");
  await expect(rows(page).first()).toContainText("Admin roles updated");
  for (const text of await rows(page).allInnerTexts()) expect(text).toContain("Admin Management");
});

test("an activity expands to show before / after", async ({ page }) => {
  const toggle = page.getByRole("button", { name: "Admin roles updated" });
  await toggle.click();
  await expect(toggle).toHaveAttribute("aria-expanded", "true");
  await expect(page.getByRole("row", { name: /^BEFORE Privileges: MANAGE_USERS AFTER Privileges: MANAGE_USERS, MANAGE_ADMINS/ })).toBeVisible();
});

test("export is requested from the backend, which emails it", async ({ page }) => {
  await page.getByRole("button", { name: "Export audit log" }).click();
  await expect(page.getByText("Your export is being processed")).toBeVisible();
  await sent(page, "POST", "/audit/logs/export");
});
