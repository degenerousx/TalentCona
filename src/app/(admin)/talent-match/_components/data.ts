/**
 * Talent Match types, plus sample records used as test fixtures.
 *
 * Talents and hiring requests are live: both public forms post to Formcarry
 * and `api.ts` reads them through the portal's server routes. Confirmed
 * matches are kept in the page until the backend has an endpoint for them.
 */

/** Where a talent's profile is in review. "new" = not opened in Formcarry yet. */
export type TalentStatus = "new" | "in-review" | "matched";

/** A job seeker who submitted the talent network form. */
export type Talent = {
  id: string;
  name: string;
  initials: string;
  email: string;
  phone?: string;
  location: string;
  /** Professional title or area of expertise. */
  title: string;
  skills: string[];
  /** Lower bound of the range, used for scoring. */
  yearsExperience: number;
  /** What they picked, e.g. "4–6 years". */
  experienceLabel?: string;
  /** Educational qualifications, one per entry. */
  education: string[];
  workExperience?: string;
  portfolioUrl?: string;
  cvUrl?: string;
  cvFileName?: string;
  /** ISO date-time. */
  submittedAt: string;
  status: TalentStatus;
};

export type RequestStatus = "open" | "matched";

/** A recruitment request from an organization, company or individual. */
export type HiringRequest = {
  id: string;
  organization: string;
  contactName: string;
  email: string;
  phone?: string;
  website?: string;
  location: string;
  role: string;
  requiredSkills: string[];
  /** Minimum years, lower bound of the range picked. */
  minYearsExperience: number;
  experienceLabel?: string;
  employmentType: string;
  workMode: string;
  positions: number;
  /** ISO date, optional. */
  deadline?: string;
  description: string;
  /** ISO date-time. */
  submittedAt: string;
  status: RequestStatus;
};

/** How well one talent fits one hiring request. */
export type TalentMatch = {
  talentId: string;
  /** 0–100. */
  score: number;
  matchedSkills: string[];
  missingSkills: string[];
  /** Short reasons, as an AI matcher would give. */
  reasons: string[];
};

/** A talent approved for a hiring request with Confirm Match. */
export type ConfirmedMatch = {
  requestId: string;
  talentId: string;
  score: number;
  /** ISO date-time. */
  confirmedAt: string;
  /** Set when recorded as a hire from the profile: ISO date and the role. */
  hiredOn?: string;
  role?: string;
};

export const talentStatusLabel: Record<TalentStatus, string> = {
  new: "New",
  "in-review": "In review",
  matched: "Matched",
};

export const requestStatusLabel: Record<RequestStatus, string> = {
  open: "Open",
  matched: "Matched",
};

export function shortDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export function initialsOf(name: string) {
  const parts = name.split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  return (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase();
}

// ---- Fixtures ---------------------------------------------------------------

export const talentFixtures: Talent[] = [
  {
    id: "talent-1",
    name: "David Kim",
    initials: "DK",
    email: "david.k@example.com",
    phone: "+234 804 567 8901",
    location: "Lagos, Nigeria",
    title: "Data Analyst",
    skills: ["Python", "SQL", "Pandas", "Data Visualization"],
    yearsExperience: 4,
    experienceLabel: "4–6 years",
    education: ["B.Sc. Statistics, University of Lagos", "IBM Data Science Professional"],
    workExperience: "Data Analyst, TechCorp Solutions (2022–present)\nJunior Analyst, Finlytics (2020–2022)",
    portfolioUrl: "https://linkedin.com/in/davidkim",
    cvUrl: "https://example.com/cv/david-kim.pdf",
    cvFileName: "David-Kim-CV.pdf",
    submittedAt: "2026-11-04T10:00:00.000Z",
    status: "new",
  },
];

export const hiringRequestFixtures: HiringRequest[] = [
  {
    id: "request-1",
    organization: "TechCorp Solutions",
    contactName: "Adewale Ogunleye",
    email: "hiring@techcorp.example",
    phone: "+234 901 234 5678",
    website: "https://techcorp.example",
    location: "Lagos, Nigeria",
    role: "Data Analyst",
    requiredSkills: ["Python", "SQL", "Power BI"],
    minYearsExperience: 1,
    experienceLabel: "1–3 years",
    employmentType: "Full-time",
    workMode: "Hybrid",
    positions: 2,
    deadline: "2026-12-15",
    description: "Analyse product and sales data and build dashboards for the leadership team.",
    submittedAt: "2026-11-05T09:00:00.000Z",
    status: "open",
  },
];
