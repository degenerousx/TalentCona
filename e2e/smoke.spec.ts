import { test, expect } from "./fixtures";

/** Every page wired to the backend opens, shows backend data, and no error state. */
const PAGES: [path: string, heading: RegExp, shows: string][] = [
  ["/dashboard", /dashboard|welcome/i, "Semi Lore: Wallet enrollment debited"],
  ["/user-management", /user management/i, "Semi Lore"],
  ["/admin-management", /admin management/i, "new.admin@talentcona.test"],
  ["/admissions-routing", /admissions & routing/i, "Chioma Okwara"],
  ["/talent-corner", /talent corner/i, "New Student Usman"],
  ["/referrals", /referral/i, "Usman Soliu"],
  ["/audit-logs", /audit/i, "Kemi Okon"],
  // Mock design (sample data, no API calls).
  ["/csr-management", /csr & sponsorship management/i, "Top Sponsors"],
];

for (const [path, heading, shows] of PAGES) {
  test(`${path} loads with live data`, async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto(path);
    await expect(page.getByRole("heading", { name: heading }).first()).toBeVisible();
    await expect(page.getByText(shows).first()).toBeVisible();
    await expect(page.getByText(/something went wrong|couldn't load/i)).toHaveCount(0);
    expect(errors).toEqual([]);
  });
}
