/**
 * The two public Talent Match forms, as Formcarry receives them. Their HTML
 * must use these `name`s; the server maps them (see `_server/formcarry.ts`).
 * FORM.md has ready-to-use HTML for both.
 *
 * Both forms post to the same Formcarry form (the free plan allows one) and
 * say which they are in the hidden `formType` field.
 */
export const FORM_TYPE_FIELD = "formType";
export const FORM_TYPES = { talent: "talent", hiring: "hiring" } as const;

/** "Join our talent network" — job seekers. */
export const TALENT_FIELDS = {
  fullName: "fullName",
  email: "email",
  phone: "phone",
  location: "location",
  /** Professional title or area of expertise. */
  professionalTitle: "professionalTitle",
  /** Comma-separated, e.g. "Python, Strategy, Product Design". */
  skills: "skills",
  yearsOfExperience: "yearsOfExperience",
  /** Educational qualifications, one per line. */
  education: "education",
  /** Work experience, free text (roles, companies, years). */
  workExperience: "workExperience",
  /** Portfolio or LinkedIn URL. Optional. */
  portfolio: "portfolio",
  /** The CV: PDF, at most 10 MB. */
  cv: "cv",
  /** "yes" when the privacy checkbox is ticked. */
  consent: "consent",
} as const;

/** "Hire talent" — organizations, companies or individuals recruiting. */
export const HIRING_FIELDS = {
  organizationName: "organizationName",
  contactName: "contactName",
  email: "email",
  phone: "phone",
  /** Optional. */
  website: "website",
  location: "location",
  roleTitle: "roleTitle",
  /** Comma-separated. */
  requiredSkills: "requiredSkills",
  /** Comma-separated. Optional. */
  niceToHaveSkills: "niceToHaveSkills",
  /** Minimum experience, one of EXPERIENCE_OPTIONS. */
  yearsOfExperience: "yearsOfExperience",
  employmentType: "employmentType",
  workMode: "workMode",
  /** Number of people to hire. */
  positions: "positions",
  /** Optional, YYYY-MM-DD. */
  deadline: "deadline",
  description: "description",
} as const;

/** Years of experience: submitted value → label. */
export const EXPERIENCE_OPTIONS = [
  { value: "0-1", label: "0–1 years" },
  { value: "1-3", label: "1–3 years" },
  { value: "4-6", label: "4–6 years" },
  { value: "7-10", label: "7–10 years" },
  { value: "11-15", label: "11–15 years" },
  { value: "16+", label: "16+ years" },
] as const;

export const EMPLOYMENT_TYPES = ["Full-time", "Part-time", "Contract", "Internship"] as const;
export const WORK_MODES = ["On-site", "Hybrid", "Remote"] as const;
