import { test, expect, sent, mock } from "./fixtures";

const bell = (page: import("@playwright/test").Page) => page.getByRole("button", { name: /^Notifications/ });

test.beforeEach(async ({ page }) => {
  await page.goto("/dashboard");
  await expect(bell(page)).toHaveAccessibleName("Notifications, 2 unread");
});

test("panel lists title and body, newest first, with unread marked", async ({ page }) => {
  await bell(page).click();
  const panel = page.getByRole("dialog", { name: "Notifications" });
  await expect(panel.getByText("2 unread")).toBeVisible();
  // Each notification row has a timestamp; the list also holds the "Load older" button.
  const items = panel.getByRole("list", { name: "Latest notifications" }).getByRole("button").filter({ has: page.locator("time") });
  await expect(items.first()).toHaveAccessibleName("Unread: New mentor application. Grace Okafor submitted a mentor application.");
  await expect(items.nth(2)).toHaveAccessibleName("Password changed. Your TalentCona password was changed successfully.");

  await panel.getByRole("tab", { name: "Unread (2)" }).click();
  await expect(items).toHaveCount(2);
});

test("load older notifications pages with the cursor", async ({ page }) => {
  await bell(page).click();
  const panel = page.getByRole("dialog", { name: "Notifications" });
  const items = panel.getByRole("list", { name: "Latest notifications" }).getByRole("button").filter({ has: page.locator("time") });
  await expect(items).toHaveCount(20);
  await panel.getByRole("button", { name: "Load older notifications" }).click();
  await expect(items).toHaveCount(25);
  expect((await sent(page, "GET", "/notifications")).query).toMatchObject({ limit: "20", cursor: "20" });
});

test("mark all as read clears the badge", async ({ page }) => {
  await bell(page).click();
  await page.getByRole("button", { name: "Mark all as read" }).click();
  await sent(page, "POST", "/notifications/read-all");
  await expect(bell(page)).toHaveAccessibleName(/^Notifications(?!, \d+ unread)/);
});

test("clicking a notification with data.url marks it read and opens that page", async ({ page }) => {
  await bell(page).click();
  await page.getByRole("button", { name: /New mentor application/ }).click();
  await expect(page).toHaveURL(/\/user-management\/mentors\/review\/m-pend$/);
  await sent(page, "PATCH", "/notifications/n-1/read");
  await expect(bell(page)).toHaveAccessibleName("Notifications, 1 unread");
});

test("a notification without a link finds the record from its text", async ({ page }) => {
  await bell(page).click();
  await page.getByRole("button", { name: /Semi Lore needs a mentor for Project Management/ }).click();
  // Looked up by name, then the enrollment for that program.
  expect((await sent(page, "GET", "/students/admin")).query).toMatchObject({ search: "Semi Lore" });
  await expect(page).toHaveURL(/\/user-management\/s-semi\/e-pm$/);
});

test("a security notification has nothing to open", async ({ page }) => {
  await bell(page).click();
  await page.getByRole("button", { name: /Password changed/ }).click();
  await expect(page.getByText("Nothing to open for this notification.")).toBeVisible();
  await expect(page).toHaveURL(/\/dashboard$/);
});

test("a new notification raises the badge on the next poll", async ({ page }) => {
  await mock.notify(page, { title: "New hiring request", body: "Acme Labs needs 2 developers.", data: { url: "/talent-corner" } });
  // The bell polls every 30 s while the tab is visible; becoming visible also refreshes it.
  await page.evaluate(() => window.dispatchEvent(new Event("visibilitychange")));
  await expect(bell(page)).toHaveAccessibleName("Notifications, 3 unread");
  await bell(page).click();
  await page.getByRole("button", { name: /New hiring request/ }).click();
  await expect(page).toHaveURL(/\/talent-corner$/);
});
