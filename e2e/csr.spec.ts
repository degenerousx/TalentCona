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
  await panel(page).getByRole("button", { name: "Save", exact: true }).click();

  await expect(panel(page).getByText("Updated Phone Number, Career Path Interest.")).toBeVisible();
  await expect(panel(page).getByText("Cloud Computing").first()).toBeVisible();
});

test("an invalid email is refused", async ({ page }) => {
  await panel(page).getByRole("button", { name: "Edit Information" }).click();
  await panel(page).getByLabel("Email Address").fill("not-an-email");
  await panel(page).getByRole("button", { name: "Save", exact: true }).click();
  await expect(panel(page).getByRole("alert")).toHaveText("Enter a valid email address.");
});

test("admin updates: post, keep history, edit only your own", async ({ page }) => {
  const history = panel(page).getByRole("list").filter({ has: page.locator("time") });
  await expect(history.getByRole("listitem")).toHaveCount(2);
  // Other admins' updates can't be edited.
  await expect(history.getByRole("button", { name: "Edit this update" })).toHaveCount(0);

  await panel(page).getByLabel("New update").fill("Met Remi; contract draft to follow.");
  await panel(page).getByRole("button", { name: "Save", exact: true }).click();
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

test("requests have no approve / reject, stay on the tab and show when they were last worked on", async ({ page }) => {
  await expect(panel(page).getByRole("button", { name: /approve|reject/i })).toHaveCount(0);
  await expect(panel(page).getByText(/Last worked on .* by Tunde Bello/)).toBeVisible();

  await panel(page).getByLabel("New update").fill("Followed up by email.");
  await panel(page).getByRole("button", { name: "Save", exact: true }).click();
  await expect(panel(page).getByText(/Last worked on .* by Ada Admin/)).toBeVisible();

  await page.keyboard.press("Escape");
  const card = page.getByRole("button", { name: /REQ-001/ });
  await expect(card).toContainText(/Last worked on .* by Ada Admin/);
  // Untouched requests say so.
  await expect(page.getByRole("button", { name: /REQ-005/ })).toContainText("Not worked on yet");
});

test.describe("sponsors", () => {
  test.beforeEach(async ({ page }) => {
    await page.keyboard.press("Escape");
    await page.getByRole("tab", { name: "Sponsors", exact: true }).click();
  });

  test("add a sponsor with all the required details", async ({ page }) => {
    await page.getByRole("button", { name: "Add Sponsor" }).click();
    const form = page.getByRole("dialog", { name: "Add Sponsor" });
    await form.getByRole("button", { name: "Add Sponsor" }).click();
    await expect(form.getByRole("alert")).toHaveText("Sponsor name is required.");

    await form.getByLabel("Sponsor Name *").fill("Lagos Tech Trust");
    await form.getByLabel("Contact Person *").fill("Ifeoma Nnaji");
    await form.getByLabel("Email *").fill("ifeoma@lagostechtrust.org");
    await form.getByLabel("Phone *").fill("+234 803 555 0101");
    await form.getByLabel("Country *").fill("Nigeria");
    await form.getByLabel("Start Date *").fill("2027-01-10");
    await form.getByLabel("End Date *").fill("2026-12-31");
    await form.getByLabel("Amount Pledged (USD) *").fill("9000");
    await form.getByRole("button", { name: "Software Engineering" }).click();
    await form.getByRole("button", { name: "Add Sponsor" }).click();
    await expect(form.getByRole("alert")).toHaveText("End date can't be before the start date.");

    await form.getByLabel("End Date *").fill("2027-12-31");
    await form.getByRole("button", { name: "Add Sponsor" }).click();

    // Opens the new sponsor, with the creation in its history.
    const panel = page.getByRole("dialog", { name: "Lagos Tech Trust" });
    await expect(panel.getByText("SPO-005")).toBeVisible();
    await expect(panel.getByText("Added the sponsor.")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("article").filter({ hasText: "Lagos Tech Trust" })).toContainText("$9,000");
  });

  test("edit a sponsor and record admin updates", async ({ page }) => {
    await page.getByRole("button", { name: "TechBridge Foundation" }).click();
    const panel = page.getByRole("dialog", { name: "TechBridge Foundation" });
    await expect(panel.getByText(/Last worked on .* by Tunde Bello/)).toBeVisible();

    await panel.getByRole("button", { name: "Edit Information" }).click();
    await panel.getByLabel("Amount Received (USD)").fill("18000");
    await panel.getByRole("button", { name: "Save", exact: true }).click();
    await expect(panel.getByText("Updated Amount Received.")).toBeVisible();
    await expect(panel.getByText("$18,000").first()).toBeVisible();

    const history = panel.getByRole("list").filter({ has: page.locator("time") });
    await panel.getByLabel("New update").fill("Called Lydia about 2027 renewal.");
    await panel.getByRole("button", { name: "Save", exact: true }).click();
    // Newest first.
    const mine = history.getByRole("listitem").first();
    await expect(mine).toContainText("Called Lydia about 2027 renewal.");
    await expect(mine).toContainText("Ada Admin");
    await expect(history.getByRole("listitem")).toHaveCount(4);

    await mine.getByRole("button", { name: "Edit this update" }).click();
    await mine.getByLabel("Edit update").fill("Called Lydia: 2027 renewal agreed in principle.");
    await mine.getByRole("button", { name: "Save" }).click();
    await expect(mine).toContainText("2027 renewal agreed in principle.");
    await expect(mine).toContainText(/Edited /);
    await expect(history.getByRole("listitem")).toHaveCount(4);
    await expect(history).toContainText("Sent the September progress report");
  });
});
