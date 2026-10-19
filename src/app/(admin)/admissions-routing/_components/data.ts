/**
 * Admissions & Routing content, as shown in the Figma frames.
 * Replace with API calls once the backend is available.
 */

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
};

export type LoanApplication = {
  id: string;
  name: string;
  amount: string;
  status: string;
  kycStatus: string;
  creditScore: number;
  documents: string;
  documentsNote: string;
};

export const onboardingQueue: OnboardingApplicant[] = [
  {
    id: "john-doe",
    name: "John Doe",
    email: "john@email.com",
    stuckFor: "Stuck for 2 days",
    stage: "Personal Info",
    progress: 25,
  },
  {
    id: "jane-smith",
    name: "Jane Smith",
    email: "jane@email.com",
    stuckFor: "Stuck for 1 day",
    stage: "Payment",
    progress: 75,
  },
  {
    id: "robert-brown",
    name: "Robert Brown",
    email: "robert@email.com",
    stuckFor: "Stuck for 3 hours",
    stage: "Payment",
    progress: 75,
  },
];

/*
 * The design has a single details frame (for "Oluchi Chisom"). Until real
 * data exists, every applicant shows these sample application details under
 * their own name and email.
 */
const sampleDetails: ApplicantDetails = {
  phone: "+234 803 123 4567",
  program: "Frontend Engineering",
  applicationDate: "2026-03-15",
  responses: [
    {
      question: "What's your main learning goal?",
      answer: "Start a new career",
      note: "Transition into a new field",
    },
    {
      question: "Why did you join this program?",
      answer:
        "To become a senior frontend engineer within 3 years and contribute to open-source projects.",
    },
  ],
  constraints: "I do not have any payment constraints, I can pay for my program",
};

export function getApplicant(id: string) {
  const applicant = onboardingQueue.find((a) => a.id === id);
  return applicant ? { ...applicant, ...sampleDetails } : undefined;
}

export const fundraisingCampaigns: FundraisingCampaign[] = [
  {
    id: "maria-santos",
    name: "Maria Santos",
    createdAgo: "Created 2 hours ago",
    programs: ["Web Development", "UI/UX Design"],
    story: "Aspiring web developer from rural area...",
    goal: "$500",
  },
  {
    id: "ahmed-ali",
    name: "Ahmed Ali",
    createdAgo: "Created 1 day ago",
    programs: ["Web Development"],
    story: "Single parent wanting to change career...",
    goal: "$450",
  },
];

export const loanApplications: LoanApplication[] = [
  {
    id: "david-wilson",
    name: "David Wilson",
    amount: "$1200",
    status: "Pending Review",
    kycStatus: "Complete",
    creditScore: 720,
    documents: "4/4",
    documentsNote: "All required documents submitted",
  },
  {
    id: "sofia-garcia",
    name: "Sofia Garcia",
    amount: "$950",
    status: "Pending Review",
    kycStatus: "Complete",
    creditScore: 680,
    documents: "4/4",
    documentsNote: "All required documents submitted",
  },
];
