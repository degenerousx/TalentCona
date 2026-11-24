import { test, expect, sent } from "./fixtures";

test("dashboard: live counts and recent activity from the audit log", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page.getByRole("heading", { name: "Welcome, Ada! 👋" })).toBeVisible();
  const metrics = page.getByRole("region", { name: "Key metrics" });
  // Each card reads "<value> <label>"; 3 students and 2 approved mentors are seeded.
  await expect(metrics).toContainText(/Live3Total Students/);
  await expect(metrics).toContainText(/Live2Total Mentors/);

  const activity = page.getByRole("region", { name: "Recent Activity" }).getByRole("link");
  await expect(activity).toHaveCount(5);
  await expect(activity.first()).toHaveAccessibleName(/^Semi Lore: Wallet enrollment debited .* Financial Ops$/);
  expect((await sent(page, "GET", "/audit/logs")).query).toMatchObject({ limit: "5", range: "30d" });

  await activity.first().click();
  await expect(page).toHaveURL(/\/audit-logs$/);
});

test.describe("an admin without audit access", () => {
  test.use({ role: "limited" });
  test("doesn't see menu items for privileges they lack", async ({ page }) => {
    await page.goto("/user-management");
    const nav = page.getByRole("navigation");
    await expect(nav.getByRole("link", { name: "User Management" })).toBeVisible();
    await expect(nav.getByRole("link", { name: "Referrals" })).toHaveCount(0);
    await expect(nav.getByRole("link", { name: "Admin Management" })).toHaveCount(0);
  });
});
