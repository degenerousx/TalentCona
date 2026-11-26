/**
 * SAMPLE DATA for the CSR & Sponsorship Management mock (Figma "CSR" section).
 * No API calls: nothing here comes from or goes to the backend.
 *
 * Sponsors and sponsorship requests mirror the two forms on
 * talentcona.com/sponsor-talent: the Full Application and the Quick Sponsor
 * Request (field names and options as on the site).
 */

export const usd = (n: number) => `$${n.toLocaleString("en-US")}`;
export const usdK = (n: number) => `$${Math.round(n / 1000)}K`;

// ---- Website form options (talentcona.com/sponsor-talent) -------------------------

export const CAREER_PATHS = [
  "Product Design",
  "Product Management",
  "Software Engineering",
  "Data Analytics",
  "Data Science",
  "Cybersecurity",
  "Cloud Computing",
  "Digital Marketing",
  "UI/UX Design",
  "Business Analysis",
  "Artificial Intelligence",
  "Others",
] as const;
/** The only Area of Interest used for sponsor quick requests. */
export const AREA_OF_INTEREST = "I want to partner with TalentCona";

export type OrgType = "Corporate" | "Individual";
export type SponsorshipType = "Full" | "Partial";

/** A Full Application submission (all fields of the website form). */
export type FullApplication = {
  form: "Full Application";
  organizationType: string;
  organizationName: string;
  contactPerson: string;
  email: string;
  country: string;
  phone: string;
  stateCity: string;
  goals: string;
  preference: "Full Sponsorship" | "Partial Sponsorship";
  talents: number;
  careerPaths: string[];
  impactFocus: string[];
  engagement: string[];
  submittedAt: string;
};

/** A Quick Sponsor Request submission. */
export type QuickRequest = {
  form: "Quick Sponsor Request";
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  areaOfInterest: typeof AREA_OF_INTEREST;
  additionalInfo: string;
  submittedAt: string;
};

export type Submission = FullApplication | QuickRequest;

// ---- Sponsors ------------------------------------------------------------------------

export type SponsorStatus = "Active" | "Completed" | "Pending";
export type Sponsor = {
  id: string;
  name: string;
  orgType: OrgType;
  type: SponsorshipType;
  status: SponsorStatus;
  contact: string;
  email: string;
  country: string;
  start: string;
  end: string;
  talents: number;
  pledged: number;
  received: number;
  activeSponsorships: number;
  careerPaths: string[];
  /** What the sponsor submitted on the website: shown by "View Company Info". */
  application: FullApplication;
};

const app = (a: Omit<FullApplication, "form">): FullApplication => ({ form: "Full Application", ...a });

export const SPONSORS: Sponsor[] = [
  {
    id: "SPO-001", name: "TechBridge Foundation", orgType: "Corporate", type: "Full", status: "Active",
    contact: "Lydia Amara", email: "grants@techbridge.org", country: "USA", start: "2026-01-15", end: "2026-12-31",
    talents: 6, pledged: 18000, received: 13500, activeSponsorships: 2,
    careerPaths: ["Software Engineering", "Data Analytics", "Product Design", "Product Management"],
    application: app({
      organizationType: "Corporate Organization", organizationName: "TechBridge Foundation", contactPerson: "Lydia Amara",
      email: "grants@techbridge.org", country: "United States", phone: "+1 415 555 0142", stateCity: "San Francisco, CA",
      goals: "We fund early-career technologists in Africa and want graduates ready for remote engineering and data roles.",
      preference: "Full Sponsorship", talents: 6,
      careerPaths: ["Software Engineering", "Data Analytics", "Product Design", "Product Management"],
      impactFocus: ["Women in Technology", "Youths"], engagement: ["Mentorship", "Career Talks"], submittedAt: "2026-01-08",
    }),
  },
  {
    id: "SPO-002", name: "Ade Williams", orgType: "Individual", type: "Partial", status: "Active",
    contact: "Ade Williams", email: "ade.williams@gmail.com", country: "Nigeria", start: "2026-03-01", end: "2026-09-30",
    talents: 2, pledged: 2400, received: 1200, activeSponsorships: 2,
    careerPaths: ["Software Engineering", "Data Analytics"],
    application: app({
      organizationType: "Individual", organizationName: "Ade Williams", contactPerson: "Ade Williams",
      email: "ade.williams@gmail.com", country: "Nigeria", phone: "+234 803 412 7788", stateCity: "Lagos",
      goals: "I want to give back by covering part of the fees for two talents from my community.",
      preference: "Partial Sponsorship", talents: 2, careerPaths: ["Software Engineering", "Data Analytics"],
      impactFocus: ["Underserved Communities"], engagement: ["Mentorship"], submittedAt: "2026-02-20",
    }),
  },
  {
    id: "SPO-003", name: "Afrique Futures Initiative", orgType: "Corporate", type: "Full", status: "Completed",
    contact: "Kofi Mensah", email: "partners@afriquefutures.org", country: "Ghana", start: "2025-09-01", end: "2026-03-31",
    talents: 5, pledged: 15000, received: 15000, activeSponsorships: 0,
    careerPaths: ["Software Engineering", "Product Management"],
    application: app({
      organizationType: "Corporate Organization", organizationName: "Afrique Futures Initiative", contactPerson: "Kofi Mensah",
      email: "partners@afriquefutures.org", country: "Ghana", phone: "+233 24 555 0199", stateCity: "Accra",
      goals: "Our CSR programme sponsors a full cohort of talents each year and hires the strongest graduates.",
      preference: "Full Sponsorship", talents: 5, careerPaths: ["Software Engineering", "Product Management"],
      impactFocus: ["Recent Graduates"], engagement: ["Internship Opportunities", "Recruitment Opportunities"], submittedAt: "2025-08-14",
    }),
  },
  {
    id: "SPO-004", name: "Blessing Okafor", orgType: "Individual", type: "Partial", status: "Pending",
    contact: "Blessing Okafor", email: "blessing.okafor@gmail.com", country: "Nigeria", start: "2026-09-10", end: "2027-03-10",
    talents: 1, pledged: 500, received: 0, activeSponsorships: 0,
    careerPaths: ["Software Engineering"],
    application: app({
      organizationType: "Individual", organizationName: "Blessing Okafor", contactPerson: "Blessing Okafor",
      email: "blessing.okafor@gmail.com", country: "Nigeria", phone: "+234 806 220 1945", stateCity: "Enugu",
      goals: "I'd like to support one young woman starting a software career.",
      preference: "Partial Sponsorship", talents: 1, careerPaths: ["Software Engineering"],
      impactFocus: ["Women in Technology"], engagement: ["Financial Sponsorship Only"], submittedAt: "2026-09-02",
    }),
  },
];

// ---- Sponsored talent ------------------------------------------------------------------

export type TalentStatus = "Active" | "Completed" | "Pending";
/** A sponsored student. Linked to a sponsor by id, so renaming a sponsor keeps the link. */
export type SponsoredTalent = {
  id: string;
  name: string;
  email: string;
  phone: string;
  program: string;
  sponsorId: string;
  type: SponsorshipType;
  status: TalentStatus;
  cohort: string;
  startDate: string;
  progress: number;
  certifications: string;
  internship: string;
  /** Assigned mentor (see MENTORS), if any. */
  mentorId?: string;
  /** Every sponsor change, oldest first. */
  sponsorHistory: { from: string | null; to: string; at: string; by: string }[];
};

/** Programmes a sponsored student can be enrolled in. */
export const PROGRAMS = CAREER_PATHS.filter((p) => p !== "Others");
export const COHORTS = ["Cohort 2", "Cohort 3", "Cohort 4", "Cohort 5"] as const;

/** Mentors who can be assigned to sponsored students (sample). */
export type Mentor = { id: string; name: string; programs: string[]; students: number; capacity: number };
export const MENTORS: Mentor[] = [
  { id: "MEN-01", name: "Usman Soliu", programs: ["Software Engineering"], students: 6, capacity: 10 },
  { id: "MEN-02", name: "Grace Okafor", programs: ["UI/UX Design", "Product Design"], students: 4, capacity: 8 },
  { id: "MEN-03", name: "Bola Tito", programs: ["Data Analytics", "Data Science", "Artificial Intelligence"], students: 7, capacity: 10 },
  { id: "MEN-04", name: "Funke Adebayo", programs: ["Product Management", "Business Analysis"], students: 3, capacity: 8 },
  { id: "MEN-05", name: "Chidi Nnamdi", programs: ["Cybersecurity", "Cloud Computing", "Software Engineering"], students: 5, capacity: 10 },
  { id: "MEN-06", name: "Ronke Bello", programs: ["Digital Marketing"], students: 2, capacity: 6 },
];

export const TALENTS: SponsoredTalent[] = [
  { id: "TLT-001", name: "Chisom Okeke", email: "chisom.o@email.com", phone: "+234 803 111 2201", program: "Software Engineering", sponsorId: "SPO-001", type: "Full", status: "Active", cohort: "Cohort 4", startDate: "2026-01-20", progress: 72, certifications: "0 earned", internship: "Not Started", mentorId: "MEN-01", sponsorHistory: [{ from: null, to: "SPO-001", at: "2026-01-20T09:00:00", by: "Kemi Okon" }] },
  { id: "TLT-002", name: "Bola Adeyemi", email: "bola.a@email.com", phone: "+234 803 111 2202", program: "Data Analytics", sponsorId: "SPO-001", type: "Full", status: "Completed", cohort: "Cohort 3", startDate: "2025-10-06", progress: 100, certifications: "1 earned", internship: "Placed", mentorId: "MEN-03", sponsorHistory: [{ from: null, to: "SPO-001", at: "2025-10-06T09:00:00", by: "Kemi Okon" }] },
  { id: "TLT-003", name: "Emeka Nwosu", email: "emeka.n@email.com", phone: "+234 803 111 2203", program: "Software Engineering", sponsorId: "SPO-002", type: "Partial", status: "Active", cohort: "Cohort 4", startDate: "2026-03-05", progress: 48, certifications: "0 earned", internship: "Not Started", mentorId: "MEN-01", sponsorHistory: [{ from: null, to: "SPO-002", at: "2026-03-05T09:00:00", by: "Kemi Okon" }] },
  { id: "TLT-004", name: "Ngozi Eze", email: "ngozi.e@email.com", phone: "+234 803 111 2204", program: "Data Analytics", sponsorId: "SPO-002", type: "Partial", status: "Active", cohort: "Cohort 4", startDate: "2026-03-05", progress: 55, certifications: "0 earned", internship: "Not Started", mentorId: "MEN-03", sponsorHistory: [{ from: null, to: "SPO-002", at: "2026-03-05T09:00:00", by: "Kemi Okon" }] },
  { id: "TLT-005", name: "Amara Diallo", email: "amara.d@email.com", phone: "+234 803 111 2205", program: "Software Engineering", sponsorId: "SPO-003", type: "Full", status: "Completed", cohort: "Cohort 2", startDate: "2025-09-05", progress: 100, certifications: "1 earned", internship: "Placed", mentorId: "MEN-01", sponsorHistory: [{ from: null, to: "SPO-003", at: "2025-09-05T09:00:00", by: "Kemi Okon" }] },
  { id: "TLT-006", name: "John Uche", email: "john.u@email.com", phone: "+234 803 111 2206", program: "Software Engineering", sponsorId: "SPO-004", type: "Partial", status: "Pending", cohort: "Cohort 5", startDate: "2026-09-15", progress: 0, certifications: "0 earned", internship: "Not Started", sponsorHistory: [{ from: null, to: "SPO-004", at: "2026-09-15T09:00:00", by: "Kemi Okon" }] },
  { id: "TLT-007", name: "Kemi Okonkwo", email: "kemi.o@email.com", phone: "+234 803 111 2207", program: "Product Design", sponsorId: "SPO-001", type: "Full", status: "Active", cohort: "Cohort 4", startDate: "2026-01-20", progress: 64, certifications: "0 earned", internship: "Not Started", mentorId: "MEN-02", sponsorHistory: [{ from: null, to: "SPO-001", at: "2026-01-20T09:00:00", by: "Kemi Okon" }] },
  { id: "TLT-008", name: "Tola Hassan", email: "tola.h@email.com", phone: "+234 803 111 2208", program: "Product Management", sponsorId: "SPO-001", type: "Full", status: "Completed", cohort: "Cohort 3", startDate: "2025-10-06", progress: 100, certifications: "1 earned", internship: "Applied", mentorId: "MEN-04", sponsorHistory: [{ from: null, to: "SPO-001", at: "2025-10-06T09:00:00", by: "Kemi Okon" }] },
];

// ---- Sponsorship requests (website submissions) ----------------------------------------

export type SponsorshipRequest = {
  id: string;
  name: string;
  contact: string;
  email: string;
  orgType: OrgType;
  submission: Submission;
};

const quick = (q: Omit<QuickRequest, "form" | "areaOfInterest">): QuickRequest => ({ form: "Quick Sponsor Request", areaOfInterest: AREA_OF_INTEREST, ...q });

export const REQUESTS: SponsorshipRequest[] = [
  {
    id: "REQ-001", name: "Zenith Capital Partners", contact: "Remi Afolabi", email: "remi.a@zenithcapital.com", orgType: "Corporate",
    submission: app({
      organizationType: "Corporate Organization", organizationName: "Zenith Capital Partners", contactPerson: "Remi Afolabi",
      email: "remi.a@zenithcapital.com", country: "Nigeria", phone: "+234 809 555 0112", stateCity: "Lagos",
      goals: "We are expanding our engineering team to build a new fintech platform and want to sponsor and hire 15 talents.",
      preference: "Full Sponsorship", talents: 15, careerPaths: ["Software Engineering", "Data Analytics"],
      impactFocus: ["Recent Graduates", "Career Switchers"], engagement: ["Internship Opportunities", "Recruitment Opportunities"], submittedAt: "2026-10-01",
    }),
  },
  {
    id: "REQ-002", name: "Tunde Bakare", contact: "Tunde Bakare", email: "tunde.bakare@gmail.com", orgType: "Individual",
    submission: quick({ firstName: "Tunde", lastName: "Bakare", email: "tunde.bakare@gmail.com", phone: "+234 802 555 3341", additionalInfo: "I'd like to sponsor two students in Product Design. Please call me to discuss.", submittedAt: "2026-09-30" }),
  },
  {
    id: "REQ-003", name: "GlobalTech Alumni Network", contact: "James Obi", email: "csr@globaltech.io", orgType: "Corporate",
    submission: app({
      organizationType: "Corporate Organization", organizationName: "GlobalTech Alumni Network", contactPerson: "James Obi",
      email: "csr@globaltech.io", country: "United Kingdom", phone: "+44 20 7946 0321", stateCity: "London",
      goals: "Our alumni pool funds every year to sponsor talents into cloud and software careers.",
      preference: "Full Sponsorship", talents: 8, careerPaths: ["Software Engineering", "Cloud Computing"],
      impactFocus: ["Youths", "Underserved Communities"], engagement: ["Mentorship", "Employee Volunteering"], submittedAt: "2026-09-20",
    }),
  },
  {
    id: "REQ-004", name: "DigiAfrica Foundation", contact: "Amina Bello", email: "info@digiafrica.org", orgType: "Corporate",
    submission: app({
      organizationType: "Corporate Organization", organizationName: "DigiAfrica Foundation", contactPerson: "Amina Bello",
      email: "info@digiafrica.org", country: "Kenya", phone: "+254 712 555 018", stateCity: "Nairobi",
      goals: "We want to grow data and AI skills among young women across East Africa.",
      preference: "Partial Sponsorship", talents: 4, careerPaths: ["Data Analytics", "Artificial Intelligence"],
      impactFocus: ["Women in Technology"], engagement: ["Career Talks"], submittedAt: "2026-09-15",
    }),
  },
  {
    id: "REQ-005", name: "Chiamaka Obi", contact: "Chiamaka Obi", email: "chiamaka.obi@outlook.com", orgType: "Individual",
    submission: quick({ firstName: "Chiamaka", lastName: "Obi", email: "chiamaka.obi@outlook.com", phone: "+234 817 555 9020", additionalInfo: "", submittedAt: "2026-09-10" }),
  },
  {
    id: "REQ-006", name: "MedTech Corp", contact: "Tosin Ajayi", email: "hr@medtech.ng", orgType: "Corporate",
    submission: app({
      organizationType: "Company", organizationName: "MedTech Corp", contactPerson: "Tosin Ajayi",
      email: "hr@medtech.ng", country: "Nigeria", phone: "+234 701 555 7782", stateCity: "Abuja",
      goals: "Sponsor six cybersecurity talents to join our security operations team.",
      preference: "Full Sponsorship", talents: 6, careerPaths: ["Cybersecurity"],
      impactFocus: ["No Preference"], engagement: ["Recruitment Opportunities"], submittedAt: "2026-09-05",
    }),
  },
];

// ---- Payments ------------------------------------------------------------------------------

export type PaymentStatus = "Confirmed" | "Pending";
export type Payment = {
  reference: string;
  sponsor: string;
  talents: string;
  amount: number;
  method: string;
  date: string;
  status: PaymentStatus;
};

export const PAYMENTS: Payment[] = [
  { reference: "TB-0001-JAN", sponsor: "TechBridge Foundation", talents: "6 students", amount: 9000, method: "Bank Transfer", date: "2026-01-20", status: "Confirmed" },
  { reference: "TB-0002-APR", sponsor: "TechBridge Foundation", talents: "6 students", amount: 4500, method: "Bank Transfer", date: "2026-04-20", status: "Confirmed" },
  { reference: "AW-SPONS-001", sponsor: "Ade Williams", talents: "Emeka Nwosu & Ngozi Eze", amount: 1200, method: "Bank Transfer", date: "2026-03-05", status: "Confirmed" },
  { reference: "AFI-2025-Q1", sponsor: "Afrique Futures Initiative", talents: "5 students", amount: 15000, method: "Wire Transfer", date: "2025-09-05", status: "Confirmed" },
  { reference: "TB-0003-JUL", sponsor: "TechBridge Foundation", talents: "6 students", amount: 4500, method: "Bank Transfer", date: "2026-07-20", status: "Pending" },
  { reference: "AW-SPONS-002", sponsor: "Ade Williams", talents: "Emeka Nwosu & Ngozi Eze", amount: 1200, method: "Bank Transfer", date: "2026-06-05", status: "Pending" },
];

// ---- Overview ------------------------------------------------------------------------------

export const CONTRIBUTIONS = [
  { month: "Apr", pledged: 48000, received: 32000 },
  { month: "May", pledged: 55000, received: 40000 },
  { month: "Jun", pledged: 62000, received: 49000 },
  { month: "Jul", pledged: 71000, received: 58000 },
  { month: "Aug", pledged: 84000, received: 67000 },
  { month: "Sep", pledged: 97000, received: 78000 },
];
export const STATUS_SPLIT = [
  { name: "Active", value: 64, color: "#302a91" },
  { name: "Completed", value: 23, color: "#00c853" },
  { name: "Pending", value: 10, color: "#ff8f00" },
  { name: "Cancelled", value: 3, color: "#ff4842" },
];
export const BY_CAREER_PATH = [
  { path: "Software Eng.", talents: 38 },
  { path: "Product Design", talents: 22 },
  { path: "Data Analytics", talents: 18 },
  { path: "Product Mgmt", talents: 12 },
  { path: "Cybersecurity", talents: 6 },
  { path: "Cloud", talents: 4 },
];

// ---- Admin updates on sponsorship requests -------------------------------------------------

/** Organization Type options on the website's Full Application. */
export const ORG_TYPES = ["Corporate Organization", "Company", "Individual"] as const;
export const IMPACT_FOCUS = ["Women in Technology", "Youths", "Persons with Disabilities", "Underserved Communities", "Recent Graduates", "Career Switchers", "No Preference"] as const;
export const ENGAGEMENT = ["Mentorship", "Internship Opportunities", "Employee Volunteering", "Career Talks", "Recruitment Opportunities", "Financial Sponsorship Only"] as const;

/** One entry in a request's activity history. "edit" entries are written automatically when details are saved. */
export type AdminUpdate = {
  id: string;
  author: string;
  at: string;
  text: string;
  kind: "update" | "edit";
  editedAt?: string;
};

export const REQUEST_UPDATES: Record<string, AdminUpdate[]> = {
  "REQ-001": [
    { id: "u-1", author: "Kemi Okon", at: "2026-10-02T10:15:00", kind: "update", text: "Called Remi Afolabi. They want all 15 talents to start in the January cohort and asked for a partnership deck." },
    { id: "u-2", author: "Tunde Bello", at: "2026-10-04T14:40:00", kind: "update", text: "Sent the partnership deck and pricing for Software Engineering and Data Analytics. Follow-up meeting booked for 9 Oct." },
  ],
  "REQ-002": [{ id: "u-3", author: "Kemi Okon", at: "2026-10-01T09:05:00", kind: "update", text: "Left a voicemail for Tunde Bakare. Will try again tomorrow." }],
  "REQ-003": [
    { id: "u-4", author: "Tunde Bello", at: "2026-09-22T11:30:00", kind: "update", text: "Alumni board confirmed funding for 8 talents." },
    { id: "u-5", author: "Kemi Okon", at: "2026-09-24T16:00:00", kind: "update", text: "Agreed a January start with James. Sending the sponsorship agreement next." },
  ],
  "REQ-006": [{ id: "u-6", author: "Tunde Bello", at: "2026-09-07T13:20:00", kind: "update", text: "Cybersecurity cohort dates don't suit MedTech yet. Will follow up in January." }],
};

/** Admin updates on sponsors (same shape as request updates). */
export const SPONSOR_UPDATES: Record<string, AdminUpdate[]> = {
  "SPO-001": [
    { id: "su-1", author: "Kemi Okon", at: "2026-07-21T11:00:00", kind: "update", text: "Quarterly review with Lydia: happy with progress, asked for talent progress reports every month." },
    { id: "su-2", author: "Tunde Bello", at: "2026-10-03T15:45:00", kind: "update", text: "Sent the September progress report. Q4 payment of $4,500 expected by end of October." },
  ],
  "SPO-002": [{ id: "su-3", author: "Kemi Okon", at: "2026-06-06T10:20:00", kind: "update", text: "Ade confirmed the second instalment for Emeka and Ngozi." }],
  "SPO-003": [{ id: "su-4", author: "Tunde Bello", at: "2026-04-02T09:30:00", kind: "update", text: "Sponsorship completed. All 5 talents graduated; sent the impact report and thank-you letter." }],
};
