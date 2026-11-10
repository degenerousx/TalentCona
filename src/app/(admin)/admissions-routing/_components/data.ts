/**
 * Admissions & Routing UI types. `api.ts` maps the backend's responses to
 * these; the page has no sample data.
 */

/** The backend's two onboarding stages (`stage` filter on the queue). */
export type OnboardingStage = "personalInfo" | "payment";

export type OnboardingApplicant = {
  id: string;
  name: string;
  email: string;
  stuckFor: string;
  stage: string;
  /** 0 to 100. */
  progress: number;
};

export type ApplicantDetails = {
  phone: string;
  program: string;
  applicationDate: string;
  responses: Array<{ question: string; answer: string; note?: string }>;
  constraints: string;
};

export type FundraisingCampaign = {
  id: string;
  name: string;
  createdAgo: string;
  programs: string[];
  story: string;
  goal: string;
  raised: string;
  /** 0 to 100. */
  progress: number;
};

export type LoanApplication = {
  id: string;
  name: string;
  email: string;
  /** Requested amount, formatted. */
  amount: string;
  /** Label, e.g. "Pending Review". */
  status: string;
  /** Backend status: Pending, UnderReview, Approved, Rejected, Disbursed or Completed. */
  rawStatus: string;
  /** Amount plus interest, formatted. */
  total: string;
  monthly: string;
  period: string;
  interest: string;
  /** What the loan pays for, e.g. ["UI/UX Design Fundamentals", "Selected learning laptop"]. */
  items: string[];
  /** The student's reason for the loan. */
  reason: string;
};
