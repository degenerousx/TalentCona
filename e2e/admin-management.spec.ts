import { test, expect, sent } from "./fixtures";

test.beforeEach(async ({ page }) => {
  await page.goto("/admin-management");
  await expect(page.getByRole("heading", { name: "Admin Management" })).toBeVisible();
});

test("invite a new admin with a role", async ({ page }) => {
  await page.getByRole("button", { name: "Create New Admin" }).click();
  const dialog = page.getByRole("dialog", { name: "Create New Admin" });
  await dialog.getByRole("textbox", { name: "Name" }).fill("Bisi Ade");
  await dialog.getByRole("textbox", { name: "Work Email" }).fill("bisi.ade@talentcona.test");
  await dialog.getByRole("button", { name: "Role" }).click();
  await page.getByRole("checkbox", { name: /^Manage users/ }).check({ force: true });
  await page.keyboard.press("Escape");
  await expect(dialog).toBeVisible();
  await dialog.getByRole("combobox").click();
  await page.getByRole("option", { name: "No" }).click();
  await dialog.getByRole("button", { name: "Save" }).click();

  const req = await sent(page, "POST", "/admin-portal/team/invitations");
  expect(req.body).toMatchObject({ fullName: "Bisi Ade", email: "bisi.ade@talentcona.test", privileges: ["MANAGE_USERS"], isProgramAdvisor: false });
  await expect(page.getByRole("row", { name: /^Bisi Ade bisi\.ade@talentcona\.test Manage users Pending/ })).toBeVisible();
});

test("resend and revoke a pending invitation", async ({ page }) => {
  const row = page.getByRole("row", { name: /New Admin new\.admin@talentcona\.test/ });
  await row.getByRole("button", { name: "Resend" }).click();
  await sent(page, "PATCH", "/admin-portal/team/invitations/inv-1/resend");

  await row.getByRole("button", { name: "Revoke" }).click();
  await sent(page, "PATCH", "/admin-portal/team/invitations/inv-1/revoke");
  await expect(row).toHaveCount(0);
});

test("active admins: the signed-in admin can't act on themselves; others can be deactivated", async ({ page }) => {
  await page.getByRole("tab", { name: /Active Admins/ }).click();
  await expect(page.getByRole("row", { name: /^Ada Admin .* Super Admin .* You$/ })).toBeVisible();

  const kemi = page.getByRole("row", { name: /^Kemi Okon/ });
  await kemi.getByRole("button", { name: "Deactivate" }).click();
  await sent(page, "PATCH", "/admin-portal/team/members/adm-2/deactivate");
  await expect(kemi.getByRole("button", { name: "Reactivate" })).toBeVisible();
});
