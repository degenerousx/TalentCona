import { test, expect, sent, mock } from "./fixtures";

test.beforeEach(async ({ page }) => {
  await page.goto("/referrals");
  await expect(page.getByRole("heading", { name: "Referral & Commission Engine" })).toBeVisible();
});

test("overview shows backend KPIs and the leaderboard", async ({ page }) => {
  await expect(page.getByText("₦12.4M")).toBeVisible();
  await expect(page.getByText("342", { exact: true })).toBeVisible();
  await expect(page.getByText(/^Usman Soliu\s*Student$/)).toBeVisible();
  await expect(page.getByText("₦21,600")).toBeVisible();
  expect((await sent(page, "GET", "/admin/referrals/overview")).query).toMatchObject({ range: "last_90d" });
});

test("ledger lists rows, searches and exports", async ({ page }) => {
  await page.getByRole("tab", { name: "Referral Ledger" }).click();
  await expect(page.getByRole("row", { name: /Usman Soliu .* Project Management ₦180,000 ₦9,000 Paid/ })).toBeVisible();
  await expect(page.getByRole("row", { name: /Odinaka Solomon/ })).toBeVisible();

  await page.getByRole("textbox", { name: "Search referrals" }).fill("Clement");
  await expect(page.getByRole("row", { name: /Usman Soliu/ })).toHaveCount(0);
  await expect(page.getByRole("row", { name: /Clement Isaac/ })).toBeVisible();
  expect((await sent(page, "GET", "/admin/referrals/ledger")).query).toMatchObject({ search: "Clement" });

  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export CSV" }).click();
  expect((await download).suggestedFilename()).toBe("referral-ledger.csv");
  await expect(page.getByText(/exported/i)).toBeVisible();
});

test("approve & process a pending withdrawal: approve, then disburse", async ({ page }) => {
  await page.getByRole("tab", { name: /Withdrawal Queue/ }).click();
  const card = page.getByRole("article").filter({ hasText: "₦50,000" });
  await card.getByRole("button", { name: "Approve & Process" }).click();

  const dialog = page.getByRole("dialog", { name: "Confirm Approval" });
  await expect(dialog.getByText("8101424375")).toBeVisible();
  await dialog.getByRole("button", { name: "Confirm & Process" }).click();

  await expect(page.getByText("Withdrawal for Usman Soliu approved and sent for transfer")).toBeVisible();
  await sent(page, "PATCH", "/withdrawals/admin/w-pend/approve");
  await sent(page, "PATCH", "/withdrawals/admin/w-pend/disburse");
  await expect(card).toHaveCount(0);
});

test("reject needs a reason and sends it", async ({ page }) => {
  await page.getByRole("tab", { name: /Withdrawal Queue/ }).click();
  await page.getByRole("article").filter({ hasText: "₦50,000" }).getByRole("button", { name: "Reject" }).click();
  const dialog = page.getByRole("dialog", { name: "Reject Withdrawal" });
  await expect(dialog.getByRole("button", { name: "Reject" })).toBeDisabled();
  await dialog.getByRole("textbox", { name: "Reason" }).fill("Bank details don't match");
  await dialog.getByRole("button", { name: "Reject" }).click();

  await expect(page.getByText("Withdrawal for Usman Soliu rejected")).toBeVisible();
  expect((await sent(page, "PATCH", "/withdrawals/admin/w-pend/reject")).body).toEqual({ note: "Bank details don't match" });
});

test("a failed transfer after approval is reported, and the request stays approved", async ({ page }) => {
  await mock.failNext(page, "PATCH", "/withdrawals/admin/w-pend/disburse", 502, "Paystack is unavailable");
  await page.getByRole("tab", { name: /Withdrawal Queue/ }).click();
  await page.getByRole("article").filter({ hasText: "₦50,000" }).getByRole("button", { name: "Approve & Process" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Confirm & Process" }).click();
  await expect(page.getByText(/Approved, but the transfer couldn't start: Paystack is unavailable/)).toBeVisible();
  await expect(page.getByRole("article").filter({ hasText: "₦50,000" }).getByRole("button", { name: "Process Payout" })).toBeVisible();
});

test("a new withdrawal request appears in the queue without a reload", async ({ page }) => {
  await page.getByRole("tab", { name: /Withdrawal Queue/ }).click();
  await expect(page.getByRole("article")).toHaveCount(2);
  await mock.payout(page);
  // The queue refreshes when the tab becomes visible again (and every 30 s).
  await page.evaluate(() => window.dispatchEvent(new Event("visibilitychange")));
  await expect(page.getByRole("article").filter({ hasText: "₦25,000" })).toBeVisible();
});

test("commission settings: saves a valid rate, refuses one over 100", async ({ page }) => {
  await page.getByRole("tab", { name: "Commission Settings" }).click();
  const rate = page.getByRole("spinbutton", { name: "Global Reward Rate (%)" });
  await expect(rate).toHaveValue("5");

  await rate.fill("150");
  await page.getByRole("button", { name: "Save Settings" }).click();
  await expect(page.getByText("Enter a rate between 0 and 100.")).toBeVisible();

  await rate.fill("7.5");
  await page.getByRole("button", { name: "Save Settings" }).click();
  await expect(page.getByText("Global reward rate set to 7.5%")).toBeVisible();
  expect((await sent(page, "PATCH", "/admin/referrals/settings")).body).toEqual({ rewardPercent: 7.5 });
});

test("referrer profile: balances, history and code reset", async ({ page }) => {
  await page.getByRole("button", { name: "View" }).first().click();
  await expect(page.getByText("usman.ref@example.test")).toBeVisible();
  await expect(page.getByText("₦71,600")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Referral History (2)" })).toBeVisible();
  await expect(page.getByRole("textbox", { name: "Referral code" })).toHaveValue("TC2723FCE5");

  await page.getByRole("button", { name: "Reset Code" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Reset Code" }).click();
  await expect(page.getByText(/Referral code reset to TC/)).toBeVisible();
  await sent(page, "POST", "/admin/referrals/referrers/u-usman/reset-code");
  await expect(page.getByRole("textbox", { name: "Referral code" })).not.toHaveValue("TC2723FCE5");
});
