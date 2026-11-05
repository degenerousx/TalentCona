/**
 * The "Join our talent network" form, as Formcarry receives it. The public
 * form must use these `name`s; the server maps them to `Candidate` (see
 * `_server/formcarry.ts`). FORM.md has ready-to-use HTML.
 */
export const FORM_FIELDS = {
  fullName: "fullName",
  email: "email",
  phone: "phone",
  professionalTitle: "professionalTitle",
  yearsOfExperience: "yearsOfExperience",
  location: "location",
  /** Comma-separated, e.g. "Python, Strategy, Product Design". */
  skills: "skills",
  /** Optional. */
  linkedin: "linkedin",
  /** The CV file: PDF, DOC or DOCX, at most 10 MB. */
  cv: "cv",
  /** "yes" when the privacy checkbox is ticked. */
  consent: "consent",
} as const;

/** The Years of experience options: submitted value → label. */
export const EXPERIENCE_OPTIONS = [
  { value: "1-3", label: "1–3 years" },
  { value: "4-6", label: "4–6 years" },
  { value: "7-10", label: "7–10 years" },
  { value: "11-15", label: "11–15 years" },
  { value: "16+", label: "16+ years" },
] as const;
