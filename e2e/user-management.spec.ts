import { test, expect, sent } from "./fixtures";

test.describe("students", () => {
  test("list shows programs, payment and status; search goes to the backend", async ({ page }) => {
    await page.goto("/user-management");
    await expect(page.getByRole("row", { name: /^Semi Lore semi\.lore@example\.test Project Management UI\/UX Design Direct-Full ₦450,000 No .* Active Manage$/ })).toBeVisible();
    await expect(page.getByRole("row", { name: /^Daani Olora .* Not enrolled .* Suspended Manage$/ })).toBeVisible();
    await expect(page.getByText("Showing 3 students")).toBeVisible();

    await page.getByRole("searchbox", { name: "Search students" }).fill("usman");
    await expect(page.getByText("Showing 1 student")).toBeVisible();
    expect((await sent(page, "GET", "/students/admin")).query).toMatchObject({ search: "usman" });
  });

  test("assign an instructor to a student's enrollment", async ({ page }) => {
    await page.goto("/user-management/s-semi/e-pm");
    await expect(page.getByText("Project Management · Pending mentor match")).toBeVisible();
    await page.getByRole("button", { name: "Assign Mentor" }).click();
    const dialog = page.getByRole("dialog", { name: "Assign Mentor" });
    await expect(dialog.getByRole("button", { name: "Save" })).toBeDisabled();
    await dialog.getByRole("button", { name: /^Instructor/ }).click();
    await page.getByRole("listbox", { name: "Instructor" }).getByRole("button", { name: "Usman Soliu" }).click();
    await dialog.getByRole("button", { name: "Save" }).click();

    expect((await sent(page, "PATCH", "/students/admin/s-semi/enrollments/e-pm/assignment")).body).toMatchObject({ mentorId: "m-appr" });
    await expect(dialog).toBeHidden();
    await expect(page.getByRole("region", { name: "Project Management details" }).getByText("Usman Soliu")).toBeVisible();
  });

  test("suspending needs a reason, which is sent", async ({ page }) => {
    await page.goto("/user-management/s-semi");
    await page.getByRole("button", { name: "Suspend" }).click();
    const dialog = page.getByRole("dialog", { name: "Suspend User" });
    await dialog.getByRole("textbox", { name: "Reason for suspension" }).fill("Payment dispute");
    await dialog.getByRole("button", { name: "Suspend" }).click();
    expect((await sent(page, "POST", "/students/admin/s-semi/suspend")).body).toEqual({ reason: "Payment dispute" });
    await expect(page.getByText("Suspended").first()).toBeVisible();
  });
});

test.describe("mentors", () => {
  test("summary cards and sections come from the backend", async ({ page }) => {
    await page.goto("/user-management#mentors");
    await expect(page.getByRole("button", { name: /^Pending Review: 1\./ })).toBeVisible();
    await expect(page.getByRole("button", { name: /^Total Mentors: 2\./ })).toBeVisible();
    await expect(page.getByRole("region", { name: "Pending Reviews" }).getByRole("row", { name: /^Grace Okafor UI\/UX Design 6 years/ })).toBeVisible();
    await expect(page.getByRole("region", { name: "Assigned Mentors" }).getByRole("row", { name: /^Usman Soliu Front-End Development 3\/10/ })).toBeVisible();
    const sections = (await (await page.request.get("http://localhost:4100/__requests")).json()).data
      .filter((r: { path: string }) => r.path === "/mentors/admin")
      .map((r: { query: { section?: string } }) => r.query.section);
    expect(sections).toEqual(expect.arrayContaining(["pending", "assigned"]));
  });

  test("review → rate → approve with a program and role", async ({ page }) => {
    await page.goto("/user-management/mentors/review/m-pend");
    await expect(page.getByRole("heading", { name: "Grace Okafor", level: 2 })).toBeVisible();
    await expect(page.getByRole("button", { name: "Approve" })).toBeDisabled();

    await page.getByRole("radio", { name: "5 out of 5" }).click();
    expect((await sent(page, "PATCH", "/mentors/admin/m-pend/rating")).body).toEqual({ adminRating: 5 });
    await page.getByRole("button", { name: "Approve" }).click();

    // Approve continues to program assignment; the application is approved only on confirm.
    await page.getByRole("checkbox", { name: "Assign to UI/UX Design" }).check({ force: true });
    await page.getByRole("button", { name: "Assign", exact: true }).click();
    const dialog = page.getByRole("dialog", { name: "Assign Programs" });
    await expect(dialog.getByRole("button", { name: "Confirm Assignment" })).toBeDisabled();
    await dialog.getByRole("checkbox", { name: "Instructor in UI/UX Design" }).check({ force: true });
    await dialog.getByRole("button", { name: "Confirm Assignment" }).click();

    await expect(page.getByText("Mentorship Application Approved Successfully !")).toBeVisible();
    await sent(page, "POST", "/mentors/admin/m-pend/approve");
    expect((await sent(page, "PUT", "/mentors/admin/m-pend/programs")).body).toEqual({ programs: [{ programId: "p-ux", mentor: true, advisor: false }] });
  });

  test("rejecting an application sends the reason", async ({ page }) => {
    await page.goto("/user-management/mentors/review/m-pend");
    await page.getByRole("button", { name: "Reject" }).click();
    const dialog = page.getByRole("dialog", { name: "Reject Application" });
    await dialog.getByRole("textbox", { name: "Rejection Feedback" }).fill("Not enough teaching experience");
    await dialog.getByRole("button", { name: "Submit" }).click();
    expect((await sent(page, "POST", "/mentors/admin/m-pend/reject")).body).toMatchObject({ reason: "Not enough teaching experience" });
  });
});
