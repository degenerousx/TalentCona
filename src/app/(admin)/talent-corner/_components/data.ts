/**
 * Talent Corner UI types. `api.ts` maps the backend's responses to these;
 * the page has no sample data.
 */

export type TalentStatus = "available" | "hired";

export type Talent = {
  /** Talent interest id (one per completed enrollment). */
  id: string;
  name: string;
  initials: string;
  program: string;
  /** Cohort or completion date, e.g. "Jan 2026". Empty when unknown. */
  cohort: string;
  location: string;
  status: TalentStatus;
  /** Final grade in percent, or null when the backend has none. */
  grade: number | null;
  skills: string[];
  certifications: string[];
  email: string;
  phone: string;
  links: Array<{ label: string; url: string }>;
  projectsCompleted: number | null;
  /** What the graduate is looking for, e.g. "Hire", "Internship", "Both". */
  seeking: string;
  targetRole: string;
  job?: { company: string; role: string; date: string };
};

export type RequestStatus = "pending" | "fulfilled";

export type RoleRequirement = {
  id: string;
  title: string;
  level: string;
  employment: string;
  positions: number;
  requiredSkills: string[];
  niceToHaveSkills: string[];
};

export type TalentRequest = {
  id: string;
  /** "#TR-0001" */
  code: string;
  company: string;
  contact: string;
  email: string;
  phone: string;
  location: string;
  website?: string;
  /** ISO date-times. */
  requestedOn: string;
  deadline: string | null;
  /** The roles' employment types, e.g. "Full-time" or "Full-time, Contract". */
  employmentType: string;
  description: string;
  status: RequestStatus;
  totalPositions: number;
  roles: RoleRequirement[];
  fulfilledAt: string | null;
  fulfilledBy: string | null;
};

const fmt = (iso: string, month: "short" | "long") => {
  // Date-only strings ("2026-12-31") are read as local dates, not UTC midnight.
  const d = new Date(/^\d{4}-\d{2}-\d{2}$/.test(iso) ? `${iso}T00:00:00` : iso);
  return Number.isNaN(d.getTime()) ? "-" : d.toLocaleDateString("en-US", { month, day: "numeric", year: "numeric" });
};

/** "Apr 15, 2026" (cards) */
export const shortDate = (iso: string | null) => (iso ? fmt(iso, "short") : "-");
/** "April 15, 2026" (details modal) */
export const longDate = (iso: string | null) => (iso ? fmt(iso, "long") : "-");

export const totalPositions = (r: TalentRequest) => r.totalPositions;

export function initialsOf(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  return (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase();
}
