import { test, expect, sent } from "./fixtures";

test.beforeEach(async ({ page }) => {
  await page.goto("/admissions-routing");
  await expect(page.getByRole("heading", { name: "Admissions & Routing" })).toBeVisible();
});

test("onboarding queue shows the stuck student and sends a reminder", async ({ page }) => {
  await expect(page.getByRole("tab", { name: "Onboarding Queue 1" })).toBeVisible();
  const card = page.getByRole("listitem").filter({ has: page.getByRole("heading", { name: "Chioma Okwara" }) });
  await expect(card).toContainText("Stuck for 3 days");
  await expect(card).toContainText(/Current Stage: Payment\s*60%/);
  await card.getByRole("button", { name: "Send Reminder Email to Chioma Okwara" }).click();
  await sent(page, "POST", "/admissions/admin/onboarding-queue/s-q1/remind");
});

test("stage filter goes to the backend", async ({ page }) => {
  await page.getByRole("group", { name: "Filter by stage" }).getByRole("button", { name: "Personal Info" }).click();
  await expect(page.getByRole("heading", { name: "Chioma Okwara" })).toHaveCount(0);
  expect((await sent(page, "GET", "/admissions/admin/onboarding-queue")).query.stage).toBeTruthy();
});

test("approve a loan shows the repayment terms first", async ({ page }) => {
  await page.getByRole("tab", { name: "Loan Applications" }).click();
  await page.getByRole("button", { name: "Approve loan for New Student Usman" }).click();
  const dialog = page.getByRole("dialog", { name: "Approve loan?" });
  await expect(dialog).toContainText("The student will repay ₦210,000 over 6 months (₦35,000 a month).");
  await dialog.getByRole("button", { name: "Approve loan" }).click();
  await sent(page, "PATCH", "/admin/loans/loan-1/approve");
  // Gone from the Pending filter.
  await expect(page.getByRole("heading", { name: "New Student Usman" })).toHaveCount(0);
});

test("reject a loan with a note for the student", async ({ page }) => {
  await page.getByRole("tab", { name: "Loan Applications" }).click();
  await page.getByRole("button", { name: "Reject loan for New Student Usman" }).click();
  const dialog = page.getByRole("dialog", { name: "Reject loan?" });
  await dialog.getByRole("textbox", { name: "Note for the student (optional)" }).fill("Please pay the deposit first");
  await dialog.getByRole("button", { name: "Reject loan" }).click();
  expect((await sent(page, "PATCH", "/admin/loans/loan-1/reject")).body).toMatchObject({ note: "Please pay the deposit first" });
});
