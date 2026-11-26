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

test.describe("sponsored talent", () => {
  test.beforeEach(async ({ page }) => {
    await page.keyboard.press("Escape");
    await page.getByRole("tab", { name: "Sponsored Talent" }).click();
  });

  test("no money anywhere in the section", async ({ page }) => {
    const panel = page.getByRole("tabpanel");
    await expect(panel.getByRole("columnheader", { name: /pledged|received/i })).toHaveCount(0);
    await expect(panel).not.toContainText("$");
    await page.getByRole("button", { name: "View Chisom Okeke" }).click();
    const d = page.getByRole("dialog", { name: "Chisom Okeke" });
    await expect(d).not.toContainText(/\$|pledged|received|funding|outstanding|cost|payment/i);
  });

  test("add students assigned to a sponsor, including one created on the Sponsors tab", async ({ page }) => {
    // A brand-new sponsor shows up in the picker.
    await page.getByRole("tab", { name: "Sponsors", exact: true }).click();
    await page.getByRole("button", { name: "Add Sponsor" }).click();
    const f = page.getByRole("dialog", { name: "Add Sponsor" });
    await f.getByLabel("Sponsor Name *").fill("Lagos Tech Trust");
    await f.getByLabel("Contact Person *").fill("Ifeoma Nnaji");
    await f.getByLabel("Email *").fill("ifeoma@lagostechtrust.org");
    await f.getByLabel("Phone *").fill("+234 803 555 0101");
    await f.getByLabel("Country *").fill("Nigeria");
    await f.getByLabel("Start Date *").fill("2027-01-10");
    await f.getByLabel("End Date *").fill("2027-12-31");
    await f.getByLabel("Amount Pledged (USD) *").fill("9000");
    await f.getByRole("button", { name: "Software Engineering" }).click();
    await f.getByRole("button", { name: "Add Sponsor" }).click();
    await page.keyboard.press("Escape");
    await page.getByRole("tab", { name: "Sponsored Talent" }).click();

    await page.getByRole("button", { name: "Add Students", exact: true }).click();
    const d = page.getByRole("dialog", { name: "Add Students" });
    await d.getByRole("button", { name: "Add Student" }).click();
    await expect(d.getByRole("alert")).toHaveText("Full name is required.");

    const first = d.getByRole("group", { name: /Student 1/ });
    await first.getByLabel("Full Name *").fill("Ada Okafor");
    await first.getByLabel("Email *").fill("ada.okafor@example.com");
    await first.getByLabel("Sponsor *").selectOption({ label: "Lagos Tech Trust (Corporate)" });
    await first.getByLabel("Start Date *").fill("2027-01-15");
    await d.getByRole("button", { name: "Add another student" }).click();
    const second = d.getByRole("group", { name: /Student 2/ });
    await second.getByLabel("Full Name *").fill("Bayo Ojo");
    await second.getByLabel("Email *").fill("chisom.o@email.com");
    await second.getByLabel("Start Date *").fill("2027-01-15");
    await d.getByRole("button", { name: "Add 2 Students" }).click();
    await expect(d.getByRole("alert")).toHaveText("Student 2: chisom.o@email.com is already a sponsored student.");
    await second.getByLabel("Email *").fill("bayo.ojo@example.com");
    await second.getByLabel("Sponsor *").selectOption({ label: "TechBridge Foundation (Corporate)" });
    await d.getByRole("button", { name: "Add 2 Students" }).click();

    await expect(page.getByRole("row", { name: /TLT-009 Ada Okafor .* Lagos Tech Trust/ })).toBeVisible();
    await expect(page.getByRole("row", { name: /TLT-010 Bayo Ojo .* TechBridge Foundation/ })).toBeVisible();
  });

  test("edit a student, change and reassign their sponsor, with history", async ({ page }) => {
    await page.getByRole("button", { name: "View Chisom Okeke" }).click();
    const d = page.getByRole("dialog", { name: "Chisom Okeke" });
    await d.getByRole("button", { name: "Edit Information" }).click();
    await d.getByLabel("Phone").fill("+234 809 000 2222");
    await d.getByLabel("Sponsor *").selectOption({ label: "Ade Williams (Individual)" });
    await d.getByRole("button", { name: "Save", exact: true }).click();
    await expect(d).toContainText("+234 809 000 2222");
    await expect(d.getByText("Moved from TechBridge Foundation to Ade Williams")).toBeVisible();

    await d.getByLabel("Reassign to").selectOption({ label: "Afrique Futures Initiative (Corporate)" });
    await d.getByRole("button", { name: "Reassign" }).click();
    await expect(d.getByText("Moved from Ade Williams to Afrique Futures Initiative")).toBeVisible();
    await expect(d.getByText("Assigned to TechBridge Foundation")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("row", { name: /Chisom Okeke .* Afrique Futures Initiative/ })).toBeVisible();
  });
});

test.describe("add students in bulk", () => {
  const HEAD = ["Full Name *", "Email *", "Phone", "Program *", "Cohort *", "Sponsorship Type", "Start Date *", "Sponsor"];
  const xlsx = async (rows: (string | null)[][]) => {
    const { default: write } = await import("write-excel-file/node");
    return { name: "students.xlsx", mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", buffer: await write([HEAD, ...rows]).toBuffer() };
  };

  test.beforeEach(async ({ page }) => {
    await page.keyboard.press("Escape");
    await page.getByRole("tab", { name: "Sponsored Talent" }).click();
    await page.getByRole("button", { name: "Add Students in Bulk" }).click();
  });

  test("template downloads, and a wrong file is refused", async ({ page }) => {
    const d = page.getByRole("dialog", { name: "Add Students in Bulk" });
    const download = page.waitForEvent("download");
    await d.getByRole("button", { name: "Download template" }).click();
    expect((await download).suggestedFilename()).toBe("talentcona-sponsored-students-template.xlsx");

    await d.getByLabel("Upload Excel file").setInputFiles({ name: "students.csv", mimeType: "text/csv", buffer: Buffer.from("a,b") });
    await expect(d.getByRole("alert")).toContainText("Upload an Excel file (.xlsx)");
  });

  test("upload, review problems, assign sponsor and mentor, add", async ({ page }) => {
    const d = page.getByRole("dialog", { name: "Add Students in Bulk" });
    await d.getByLabel("Upload Excel file").setInputFiles(
      await xlsx([
        ["Ada Okafor", "ada.okafor@example.com", "+234 803 555 0101", "Software Engineering", "Cohort 5", "Full", "2027-01-15", "TechBridge Foundation"],
        ["Bayo Ojo", "bayo.ojo@example.com", null, "data analytics", "Cohort 5", "Partial", "15/01/2027", null],
        ["Bad Row", "chisom.o@email.com", null, "Underwater Basket Weaving", "Cohort 5", null, "2027-01-15", null],
      ]),
    );
    await expect(d.getByText("students.xlsx")).toBeVisible();
    // Problems in the file are listed on the row.
    await expect(d.getByText("chisom.o@email.com is already a sponsored student or appears twice")).toBeVisible();
    await expect(d.getByText("“Underwater Basket Weaving” isn't a TalentCona program")).toBeVisible();
    await d.getByRole("button", { name: "Remove Bad Row" }).click();

    // Ada's sponsor came from the sheet; Bayo needs one; both need a mentor.
    await expect(d.getByLabel("Sponsor for Ada Okafor")).toHaveValue("SPO-001");
    await d.getByRole("button", { name: "Add 2 Students" }).click();
    await expect(d.getByRole("alert")).toContainText("2 students still need a sponsor and mentor.");

    await d.getByLabel("Mentor for all students").selectOption({ label: "Bola Tito · Data Analytics, Data Science, Artificial Intelligence" });
    await d.getByRole("button", { name: "Apply mentor" }).click();
    await d.getByLabel("Mentor for Ada Okafor").selectOption({ label: "Usman Soliu (6/10)" });
    await d.getByLabel("Sponsor for Bayo Ojo").selectOption({ label: "Ade Williams" });
    await d.getByRole("button", { name: "Add 2 Students" }).click();

    await expect(page.getByRole("row", { name: /TLT-009 Ada Okafor .* TechBridge Foundation Usman Soliu/ })).toBeVisible();
    await expect(page.getByRole("row", { name: /TLT-010 Bayo Ojo .* Data Analytics Ade Williams Bola Tito/ })).toBeVisible();
  });
});
