import { test, expect } from "./fixtures";

/** CSR & Sponsorship Management is a mock (sample data, no API calls); these check its behaviour. */
test.beforeEach(async ({ page }) => {
  await page.goto("/csr-management");
  await page.getByRole("tab", { name: "Sponsorship Requests" }).click();
  await page.getByRole("button", { name: /REQ-001/ }).click();
});

const panel = (page: import("@playwright/test").Page) => page.getByRole("dialog", { name: "Zenith Capital Partners" });

test("edit information: everything but the company name can change, and the edit is logged", async ({ page }) => {
  await panel(page).getByRole("button", { name: "Edit Information" }).click();
  // Company name is shown, locked.
  await expect(panel(page).getByText("Organization Name", { exact: true })).toBeVisible();
  await expect(panel(page).getByRole("textbox", { name: "Organization Name" })).toHaveCount(0);

  await panel(page).getByLabel("Phone Number").fill("+234 809 000 1111");
  await panel(page).getByRole("button", { name: "Cloud Computing" }).click();
  await panel(page).getByRole("button", { name: "Save Changes" }).click();

  await expect(panel(page).getByText("Updated Phone Number, Career Path Interest.")).toBeVisible();
  await expect(panel(page).getByText("Cloud Computing").first()).toBeVisible();
});

test("an invalid email is refused", async ({ page }) => {
  await panel(page).getByRole("button", { name: "Edit Information" }).click();
  await panel(page).getByLabel("Email Address").fill("not-an-email");
  await panel(page).getByRole("button", { name: "Save Changes" }).click();
  await expect(panel(page).getByRole("alert")).toHaveText("Enter a valid email address.");
});

test("admin updates: post, keep history, edit only your own", async ({ page }) => {
  const history = panel(page).getByRole("list").filter({ has: page.locator("time") });
  await expect(history.getByRole("listitem")).toHaveCount(2);
  // Other admins' updates can't be edited.
  await expect(history.getByRole("button", { name: "Edit this update" })).toHaveCount(0);

  await panel(page).getByLabel("New update").fill("Met Remi; contract draft to follow.");
  await panel(page).getByRole("button", { name: "Post Update" }).click();
  await expect(history.getByRole("listitem")).toHaveCount(3);
  const mine = history.getByRole("listitem").first();
  await expect(mine).toContainText("Ada Admin");
  await expect(mine).toContainText("Met Remi; contract draft to follow.");
  // Earlier updates are kept.
  await expect(history).toContainText("Sent the partnership deck");

  await mine.getByRole("button", { name: "Edit this update" }).click();
  await mine.getByLabel("Edit update").fill("Met Remi; contract draft sent on Friday.");
  await mine.getByRole("button", { name: "Save" }).click();
  await expect(mine).toContainText("Met Remi; contract draft sent on Friday.");
  await expect(mine).toContainText(/Edited /);
  await expect(history.getByRole("listitem")).toHaveCount(3);
});
