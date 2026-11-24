import { test, expect, sent } from "./fixtures";

test.describe("sign-in", () => {
  test.use({ role: "none" });

  test("password + MFA code signs in and lands on the dashboard", async ({ page }) => {
    await page.goto("/sign-in");
    await page.getByLabel("Email").fill("ada.admin@talentcona.test");
    await page.getByLabel("Password", { exact: true }).fill("Password123!");
    await page.getByRole("button", { name: "Sign In" }).click();

    await expect(page).toHaveURL(/\/verify-identity/);
    const login = await sent(page, "POST", "/auth/login");
    expect(login.body).toMatchObject({ email: "ada.admin@talentcona.test", password: "Password123!" });

    await page.getByLabel(/code/i).fill("123456");
    await page.getByRole("button", { name: "Verify" }).click();
    await expect(page).toHaveURL(/\/dashboard/);
    expect((await sent(page, "POST", "/auth/admin/mfa/verify")).body).toEqual({ code: "123456" });
  });

  test("wrong password shows the backend's message and stays on sign-in", async ({ page }) => {
    await page.goto("/sign-in");
    await page.getByLabel("Email").fill("ada.admin@talentcona.test");
    await page.getByLabel("Password", { exact: true }).fill("wrong-password");
    await page.getByRole("button", { name: "Sign In" }).click();
    await expect(page.getByText("Incorrect email or password.")).toBeVisible();
    await expect(page).toHaveURL(/\/sign-in/);
  });

  test("wrong MFA code is rejected", async ({ page }) => {
    await page.goto("/sign-in");
    await page.getByLabel("Email").fill("ada.admin@talentcona.test");
    await page.getByLabel("Password", { exact: true }).fill("Password123!");
    await page.getByRole("button", { name: "Sign In" }).click();
    await page.getByLabel(/code/i).fill("000000");
    await page.getByRole("button", { name: "Verify" }).click();
    await expect(page.getByText(/that code didn't work/i)).toBeVisible();
    await expect(page).toHaveURL(/\/verify-identity/);
  });

  test("signed-out visitors are sent to sign-in", async ({ page }) => {
    await page.goto("/user-management");
    await expect(page).toHaveURL(/\/sign-in/);
  });
});

test("a signed-in admin is resumed from the refresh cookie and can sign out", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/dashboard/);
  await sent(page, "POST", "/auth/refresh");
  await expect(page.getByRole("heading", { name: "Welcome, Ada! 👋" })).toBeVisible();
  await page.getByRole("button", { name: "Logout" }).click();
  // A confirmation step, if the portal shows one.
  const confirm = page.getByRole("dialog").getByRole("button", { name: /log ?out|sign out|yes/i });
  if (await confirm.isVisible().catch(() => false)) await confirm.click();
  await expect(page).toHaveURL(/\/sign-in/);
  await sent(page, "POST", "/auth/logout");
});
