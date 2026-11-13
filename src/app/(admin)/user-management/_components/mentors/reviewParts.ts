export const RATING_LABELS: Record<number, string> = {
  0: "Not rated yet",
  1: "Poor - Does not meet requirements",
  2: "Fair - Meets minimum requirements",
  3: "Good - Meets requirements",
  4: "Very good - Exceeds requirements",
  5: "Excellent - Outstanding candidate",
};

/** Up to three initials, e.g. "Dr. Sarah Martinez" → "DSM". */
export const applicantInitials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 3)
    .map((p) => p[0].toUpperCase())
    .join("");

/** Application statuses that still await an admin decision. */
export const isAwaitingReview = (status: string) => !["Approved", "Rejected", "ChangesRequested", "Draft"].includes(status);

/** "LinkedIn" for a LinkedIn URL, otherwise "Portfolio". */
export const linkLabel = (url: string) => (/linkedin\.com/i.test(url) ? "LinkedIn" : "Portfolio");
