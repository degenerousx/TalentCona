import { test, expect, sent } from "./fixtures";

test.beforeEach(async ({ page }) => {
  await page.goto("/talent-corner");
  await expect(page.getByRole("heading", { name: "Talent Corner" })).toBeVisible();
});

test("available talents show grade, skills and certifications", async ({ page }) => {
  const card = page.getByRole("list", { name: "Talents" }).getByRole("listitem").filter({ has: page.getByRole("heading", { name: "New Student Usman" }) });
  await expect(card).toContainText(/Front-End Development\W*Cohort 3/);
  await expect(card).toContainText(/88%\s*Final Grade · B/);
  await expect(card.getByRole("list", { name: "New Student Usman's skills" })).toContainText("React");
});

test("a hiring request can be opened and marked fulfilled", async ({ page }) => {
  await page.getByRole("tab", { name: "Talent Request" }).click();
  await expect(page.getByRole("group", { name: "Filter by status" }).getByRole("button", { name: "Pending (1)" })).toBeVisible();
  await page.getByRole("button", { name: "View Full Details for Acme Labs" }).click();
  const dialog = page.getByRole("dialog", { name: "Acme Labs" });
  await expect(dialog.getByRole("heading", { name: "Role Requirements (2 total positions)" })).toBeVisible();
  await dialog.getByRole("button", { name: "Mark as Fulfilled" }).click();
  await sent(page, "PATCH", "/talent-requests/admin/tr-1/fulfill");
  await expect(page.getByRole("group", { name: "Filter by status" }).getByRole("button", { name: "Fulfilled (1)" })).toBeVisible();
});
