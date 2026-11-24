/**
 * SAMPLE DATA for the Student Creation & Onboarding mock design.
 * Nothing here comes from or goes to the backend.
 */

export type FundingSource = "CRS" | "Corporate Organisation" | "Individual" | "Philanthropy";
export const FUNDING_SOURCES: { id: FundingSource; hint: string }[] = [
  { id: "CRS", hint: "Funded through a CRS programme" },
  { id: "Corporate Organisation", hint: "A company sponsors the student" },
  { id: "Individual", hint: "A person pays, or the student pays" },
  { id: "Philanthropy", hint: "Foundation, trust or donor fund" },
];

export const PROGRAMMES = [
  { id: "pm", title: "Project Management", school: "School of Product & Project Management", fee: 45000000 },
  { id: "fe", title: "Front-End Development", school: "School of Engineering", fee: 25200000 },
  { id: "ux", title: "UI/UX Design", school: "School of Design", fee: 38000000 },
  { id: "da", title: "Data Analysis", school: "School of Data", fee: 32000000 },
];
export const COHORTS = ["Cohort 4 · Jan 2027", "Cohort 5 · Apr 2027"];

export const naira = (minor: number) => `₦${(minor / 100).toLocaleString("en-NG")}`;

export type CreatedStatus = "Invitation sent" | "Activated" | "Onboarding" | "Active" | "Invite expired";

export const CREATED_STUDENTS: {
  name: string;
  email: string;
  programme: string;
  source: FundingSource;
  sponsor: string;
  amount: number;
  status: CreatedStatus;
  created: string;
  via: "Single" | "Bulk";
}[] = [
  { name: "Amaka Nwosu", email: "amaka.nwosu@example.com", programme: "UI/UX Design", source: "Corporate Organisation", sponsor: "Zenith Tech Ltd", amount: 38000000, status: "Invitation sent", created: "Today, 10:42", via: "Single" },
  { name: "Tunde Bakare", email: "tunde.bakare@example.com", programme: "Data Analysis", source: "CRS", sponsor: "Lagos Youth CRS Fund", amount: 32000000, status: "Activated", created: "Today, 09:15", via: "Bulk" },
  { name: "Fatima Bello", email: "fatima.bello@example.com", programme: "Project Management", source: "Philanthropy", sponsor: "Bright Futures Foundation", amount: 45000000, status: "Onboarding", created: "Yesterday", via: "Bulk" },
  { name: "Chinedu Eze", email: "chinedu.eze@example.com", programme: "Front-End Development", source: "Individual", sponsor: "—", amount: 12600000, status: "Active", created: "22 Nov 2026", via: "Single" },
  { name: "Grace Adeyemi", email: "grace.adeyemi@example.com", programme: "Front-End Development", source: "CRS", sponsor: "Lagos Youth CRS Fund", amount: 25200000, status: "Invite expired", created: "12 Nov 2026", via: "Bulk" },
];

/** The Excel template's columns, in order. */
export const TEMPLATE_COLUMNS = [
  { name: "First Name", required: true, example: "Amaka" },
  { name: "Last Name", required: true, example: "Nwosu" },
  { name: "Email", required: true, example: "amaka.nwosu@example.com" },
  { name: "Phone", required: false, example: "+2348031234567" },
  { name: "Programme", required: true, example: "UI/UX Design" },
  { name: "Cohort", required: true, example: "Cohort 4 · Jan 2027" },
  { name: "Amount Paid (NGN)", required: true, example: "380000" },
  { name: "Funding Source", required: true, example: "Corporate Organisation" },
  { name: "Sponsor Name", required: false, example: "Zenith Tech Ltd" },
  { name: "Payment Reference", required: false, example: "ZTL-2026-0141" },
];

export type RowIssue = { column: string; message: string; level: "error" | "warning" };
export type UploadRow = {
  row: number;
  first: string;
  last: string;
  email: string;
  programme: string;
  amount: string;
  source: string;
  sponsor: string;
  issues: RowIssue[];
};

/** A sample upload of 50 rows: 44 ready, 2 with warnings, 4 with errors (first 12 shown). */
export const UPLOAD = {
  file: "lagos-csr-cohort4.xlsx",
  size: "48 KB",
  total: 50,
  ready: 44,
  warnings: 2,
  errors: 4,
  rows: [
    { row: 2, first: "Tunde", last: "Bakare", email: "tunde.bakare@example.com", programme: "Data Analysis", amount: "320,000", source: "CRS", sponsor: "Lagos Youth CRS Fund", issues: [] },
    { row: 3, first: "Ifeoma", last: "Okafor", email: "ifeoma.okafor@example", programme: "UI/UX Design", amount: "380,000", source: "CRS", sponsor: "Lagos Youth CRS Fund", issues: [{ column: "Email", message: "Not a valid email address", level: "error" }] },
    { row: 4, first: "Musa", last: "Ibrahim", email: "musa.ibrahim@example.com", programme: "Cyber Security", amount: "300,000", source: "Philanthropy", sponsor: "Bright Futures Foundation", issues: [{ column: "Programme", message: "“Cyber Security” isn't a TalentCona programme", level: "error" }] },
    { row: 5, first: "Kemi", last: "Adebayo", email: "kemi.adebayo@example.com", programme: "Project Management", amount: "450,000", source: "Corporate Organisation", sponsor: "", issues: [{ column: "Sponsor Name", message: "Required for Corporate Organisation", level: "error" }] },
    { row: 6, first: "Emeka", last: "Obi", email: "emeka.obi@example.com", programme: "Front-End Development", amount: "252,000", source: "CRS", sponsor: "Lagos Youth CRS Fund", issues: [] },
    { row: 7, first: "Halima", last: "Yusuf", email: "tunde.bakare@example.com", programme: "Data Analysis", amount: "320,000", source: "CRS", sponsor: "Lagos Youth CRS Fund", issues: [{ column: "Email", message: "Same email as row 2", level: "error" }] },
    { row: 8, first: "Segun", last: "Afolabi", email: "segun.afolabi@example.com", programme: "UI/UX Design", amount: "190,000", source: "Individual", sponsor: "", issues: [{ column: "Amount Paid", message: "Below the programme fee (₦380,000): student will owe ₦190,000", level: "warning" }] },
    { row: 9, first: "Blessing", last: "Udo", email: "blessing.udo@example.com", programme: "Project Management", amount: "450,000", source: "Philanthropy", sponsor: "Bright Futures Foundation", issues: [] },
    { row: 10, first: "Yemi", last: "Alade", email: "yemi.alade@example.com", programme: "Data Analysis", amount: "320,000", source: "CRS", sponsor: "Lagos Youth CRS Fund", issues: [{ column: "Email", message: "Already has a TalentCona account: will be enrolled, not re-created", level: "warning" }] },
    { row: 11, first: "Ngozi", last: "Chukwu", email: "ngozi.chukwu@example.com", programme: "Front-End Development", amount: "252,000", source: "Corporate Organisation", sponsor: "Zenith Tech Ltd", issues: [] },
  ] satisfies UploadRow[],
};

export const BULK_SUMMARY = {
  students: 46,
  total: 1612000000,
  byProgramme: [
    { title: "Front-End Development", count: 18, amount: 453600000 },
    { title: "Data Analysis", count: 12, amount: 384000000 },
    { title: "UI/UX Design", count: 9, amount: 323000000 },
    { title: "Project Management", count: 7, amount: 315000000 },
  ],
  bySource: [
    { source: "CRS" as FundingSource, sponsor: "Lagos Youth CRS Fund", count: 26 },
    { source: "Corporate Organisation" as FundingSource, sponsor: "Zenith Tech Ltd", count: 11 },
    { source: "Philanthropy" as FundingSource, sponsor: "Bright Futures Foundation", count: 8 },
    { source: "Individual" as FundingSource, sponsor: "Self / individual", count: 1 },
  ],
};
