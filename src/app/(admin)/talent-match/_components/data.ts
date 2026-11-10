/**
 * Talent Match types and display helpers.
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

/** "fulfilled" once a talent is confirmed for the request. */
export type RequestStatus = "pending" | "fulfilled";

/** A recruitment request from an organization, company or individual. */
export type HiringRequest = {
  id: string;
  /** Display ID, e.g. "TR-0001", numbered in order of arrival. */
  code: string;
  organization: string;
  contactName: string;
  email: string;
  phone?: string;
  website?: string;
  location: string;
  role: string;
  requiredSkills: string[];
  /** Optional on the form. */
  niceToHaveSkills: string[];
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
  pending: "Pending",
  fulfilled: "Fulfilled",
};

/** Seniority label for a minimum number of years, as in the design's level pill. */
export function levelFor(minYears: number) {
  if (minYears >= 11) return "Lead Level";
  if (minYears >= 7) return "Senior Level";
  if (minYears >= 4) return "Mid Level";
  if (minYears >= 1) return "Junior Level";
  return "Entry Level";
}

/** A 0–100 match score as a 0–5 rating in half stars. */
export function ratingFor(score: number) {
  return Math.round((score / 20) * 2) / 2;
}

/** "April 15, 2026" */
export function longDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

export function shortDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export function initialsOf(name: string) {
  const parts = name.split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  return (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase();
}
