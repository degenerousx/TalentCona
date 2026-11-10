import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type {
  ApplicantDetails,
  FundraisingCampaign,
  LoanApplication,
  OnboardingApplicant,
  OnboardingStage,
} from "./data";

/**
 * Admissions & Routing ↔ backend. Shapes copied from the Postman examples
 * (Admin App → Admissions & Routing, and loans → admin). Components import
 * only the hooks below.
 */

// ---- Backend shapes ---------------------------------------------------------

/** Cursor page used by every list here. */
type CursorPage<T> = { items: T[]; limit: number; hasNext: boolean; nextCursor: string | null };

type ApiProgramSummary = {
  id: string;
  title: string;
  school?: { name: string } | null;
};

type ApiQueueItem = {
  studentId: string;
  fullName: string | null;
  email: string;
  stage: string;
  progressPercent: number;
  stuckSince: string | null;
  constraint: string | null;
  selectedProgramSummaries?: ApiProgramSummary[];
};

type ApiQueueDetail = ApiQueueItem & {
  status?: string;
  learningGoal?: string[];
  motivation?: string | null;
  profileSubmittedAt?: string | null;
  createdAt?: string;
  phoneNumber?: string | null;
};

type ApiCampaign = {
  id: string;
  studentId: string;
  goalAmountMinor: number;
  raisedAmountMinor: number;
  currency: string;
  minorUnit: number;
  progressPercent: number;
  personalMessage: string | null;
  createdAt: string;
  student?: { id: string; fullName: string | null; email: string } | null;
  programTitles?: string[];
};

type ApiLoan = {
  id: string;
  studentId: string;
  amount: number;
  currency: string;
  minorUnit: number;
  interestRate: string | number;
  totalAmount: number;
  repaymentPeriod: number;
  monthlyPayment: number;
  status: string;
  reason?: string | null;
  createdAt: string;
  items?: { id: string; itemType: string; description: string | null }[];
  student?: { id: string; fullName: string | null; email: string } | null;
};

// ---- Mapping ----------------------------------------------------------------

/** "₦250,000" from a minor-unit amount (amountMinor / minorUnit). */
export function money(amountMinor: number, currency = "NGN", minorUnit = 100) {
  const value = amountMinor / (minorUnit || 1);
  try {
    return new Intl.NumberFormat("en-NG", { style: "currency", currency, maximumFractionDigits: 0 }).format(value);
  } catch {
    return `${currency} ${Math.round(value).toLocaleString()}`;
  }
}

/** "3 hours", "2 days" since an ISO time. */
function since(iso: string | null | undefined) {
  if (!iso) return null;
  const ms = Date.now() - new Date(iso).getTime();
  if (!Number.isFinite(ms) || ms < 0) return null;
  const minutes = Math.floor(ms / 60_000);
  if (minutes < 60) return `${Math.max(1, minutes)} ${minutes === 1 ? "minute" : "minutes"}`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} ${hours === 1 ? "hour" : "hours"}`;
  const days = Math.floor(hours / 24);
  return `${days} ${days === 1 ? "day" : "days"}`;
}

const STAGES: Record<string, string> = { personalInfo: "Personal Info", payment: "Payment" };
const CONSTRAINTS: Record<string, string> = {
  NoConstraints: "I do not have any payment constraints, I can pay for my program",
  NeedsLaptop: "I need a laptop",
  NeedsFunding: "I need funding for my program",
  NeedsBoth: "I need both funding and a laptop",
};
const GOALS: Record<string, string> = {
  NewCareer: "Start a new career",
  UpskillCurrentJob: "Upskill in my current job",
  PersonalGrowth: "Personal growth",
  OwnBusiness: "Grow my own business",
};
const LOAN_STATUS: Record<string, string> = {
  Pending: "Pending Review",
  UnderReview: "Under Review",
  Approved: "Approved",
  Rejected: "Rejected",
  Disbursed: "Disbursed",
  Completed: "Completed",
};

/** "2026-03-15" in the viewer's time zone, like the design. */
function isoDate(iso: string | null | undefined) {
  if (!iso) return "-";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function toApplicant(a: ApiQueueItem): OnboardingApplicant {
  const stuck = since(a.stuckSince);
  return {
    id: a.studentId,
    name: a.fullName || a.email,
    email: a.email,
    stuckFor: stuck ? `Stuck for ${stuck}` : "",
    stage: STAGES[a.stage] ?? a.stage,
    progress: a.progressPercent ?? 0,
  };
}

function toDetails(d: ApiQueueDetail): OnboardingApplicant & ApplicantDetails {
  const goals = (d.learningGoal ?? []).map((g) => GOALS[g] ?? g);
  const responses = [];
  if (goals.length) responses.push({ question: "What's your main learning goal?", answer: goals.join(", ") });
  if (d.motivation) responses.push({ question: "Why did you join this program?", answer: d.motivation });
  return {
    ...toApplicant(d),
    phone: d.phoneNumber || "-",
    program: (d.selectedProgramSummaries ?? []).map((p) => p.title).join(", ") || "-",
    applicationDate: isoDate(d.profileSubmittedAt ?? d.createdAt),
    responses,
    constraints: d.constraint ? (CONSTRAINTS[d.constraint] ?? d.constraint) : "-",
  };
}

function toCampaign(c: ApiCampaign): FundraisingCampaign {
  const created = since(c.createdAt);
  return {
    id: c.id,
    name: c.student?.fullName || c.student?.email || "Student",
    createdAgo: created ? `Created ${created} ago` : "",
    programs: c.programTitles ?? [],
    story: c.personalMessage ?? "",
    goal: money(c.goalAmountMinor, c.currency, c.minorUnit),
    raised: money(c.raisedAmountMinor, c.currency, c.minorUnit),
    progress: c.progressPercent ?? 0,
  };
}

function toLoan(l: ApiLoan): LoanApplication {
  const fmt = (n: number) => money(n, l.currency, l.minorUnit);
  const items = (l.items ?? []).map((i) => i.description).filter(Boolean) as string[];
  return {
    id: l.id,
    name: l.student?.fullName || l.student?.email || "Student",
    email: l.student?.email ?? "",
    amount: fmt(l.amount),
    status: LOAN_STATUS[l.status] ?? l.status,
    rawStatus: l.status,
    total: fmt(l.totalAmount),
    monthly: fmt(l.monthlyPayment),
    period: `${l.repaymentPeriod} ${l.repaymentPeriod === 1 ? "month" : "months"}`,
    interest: `${l.interestRate}%`,
    items,
    reason: l.reason ?? "",
  };
}

// ---- Queries ----------------------------------------------------------------

const PAGE_SIZE = 20;

export const keys = {
  summary: ["admissions", "summary"] as const,
  queue: (stage: OnboardingStage | "all", q: string) => ["admissions", "queue", stage, q] as const,
  applicant: (id: string) => ["admissions", "applicant", id] as const,
  fundraising: ["admissions", "fundraising"] as const,
  loans: (status: string) => ["admissions", "loans", status] as const,
};

/** Badge counts for the Onboarding Queue and Fundraising tabs. */
export function useAdmissionsSummary() {
  return useQuery({
    queryKey: keys.summary,
    queryFn: () => api<{ onboardingQueueCount: number; fundraisingCount: number }>("/admissions/admin/summary"),
  });
}

/** Students stuck in onboarding, newest page first; "Load more" fetches the next page. */
export function useOnboardingQueue(stage: OnboardingStage | "all", q: string) {
  return useInfiniteQuery({
    queryKey: keys.queue(stage, q),
    initialPageParam: null as string | null,
    queryFn: async ({ pageParam }) => {
      const page = await api<CursorPage<ApiQueueItem>>("/admissions/admin/onboarding-queue", {
        query: { limit: PAGE_SIZE, cursor: pageParam, stage: stage === "all" ? undefined : stage, q: q || undefined },
      });
      return { ...page, items: page.items.map(toApplicant) };
    },
    getNextPageParam: (last) => (last.hasNext ? last.nextCursor : null),
  });
}

export function useApplicant(studentId: string) {
  return useQuery({
    queryKey: keys.applicant(studentId),
    queryFn: async () => toDetails(await api<ApiQueueDetail>(`/admissions/admin/onboarding-queue/${encodeURIComponent(studentId)}`)),
  });
}

/** Active funding campaigns of students who haven't finished onboarding. */
export function useFundraising() {
  return useInfiniteQuery({
    queryKey: keys.fundraising,
    initialPageParam: null as string | null,
    queryFn: async ({ pageParam }) => {
      const page = await api<CursorPage<ApiCampaign>>("/admissions/admin/fundraising", {
        query: { limit: PAGE_SIZE, cursor: pageParam },
      });
      return { ...page, items: page.items.map(toCampaign) };
    },
    getNextPageParam: (last) => (last.hasNext ? last.nextCursor : null),
  });
}

/** Loan requests; Pending by default, as the design shows them for review. */
export function useLoans(status: string) {
  return useInfiniteQuery({
    queryKey: keys.loans(status),
    initialPageParam: null as string | null,
    queryFn: async ({ pageParam }) => {
      const page = await api<CursorPage<ApiLoan>>("/admin/loans", {
        query: { limit: PAGE_SIZE, cursor: pageParam, status: status === "all" ? undefined : status },
      });
      return { ...page, items: page.items.map(toLoan) };
    },
    getNextPageParam: (last) => (last.hasNext ? last.nextCursor : null),
  });
}

// ---- Mutations --------------------------------------------------------------

/** Sends the backend's fixed "you're stuck at this stage" email. No body. */
export function useSendReminder() {
  return useMutation({
    mutationFn: (studentId: string) =>
      api<{ accepted: boolean }>(`/admissions/admin/onboarding-queue/${encodeURIComponent(studentId)}/remind`, {
        method: "POST",
      }),
  });
}

/** Approve, or reject with an optional note for the student. */
export function useReviewLoan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, decision, note }: { id: string; decision: "approve" | "reject"; note?: string }) =>
      api(`/admin/loans/${encodeURIComponent(id)}/${decision}`, {
        method: "PATCH",
        body: decision === "reject" && note?.trim() ? { note: note.trim() } : undefined,
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admissions", "loans"] }),
  });
}
