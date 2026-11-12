import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, ApiError, type Query } from "@/lib/api";

/**
 * User Management ↔ backend (Postman "Admin App → User Management").
 *
 * Students  GET  /students/admin                                   list (cursor)
 *           GET  /students/admin/:id                               profile + program groups
 *           GET  /students/admin/:id/enrollments/:eid              overview + activity (cursor)
 *           GET  …/enrollments/:eid/{performance|engagement|campaign|assignment|assignment-options}
 *           PATCH …/enrollments/:eid/assignment                     { mentorId?, advisorId? }
 *           POST /students/admin/:id/{notify|suspend|reinstate}
 * Mentors   GET  /mentors/admin/summary, /mentors/admin?section=…  list (cursor)
 *           GET  /mentors/admin/:id, /mentors/admin/:id/programs/:programId
 *           PATCH /mentors/admin/:id/rating                         { adminRating }
 *           POST /mentors/admin/:id/{approve|reject|request-changes} { reason?, adminNotes? }
 *           PUT  /mentors/admin/:id/programs                        { programs: [{ programId, mentor, advisor }] } (replaces all)
 *           POST /mentors/admin/:id/{notify|suspend|reinstate}
 * Loans     GET  /admin/loans (no per-student filter) + GET /loans/:id/repayments
 * Programs  GET  /programs/admin (pickers and filters)
 *
 * Shapes the Postman examples leave empty (assigned mentors, performance
 * items, mentor sessions/mentees, contributions) are read defensively.
 */

type CursorPage<T> = { items: T[]; limit: number; hasNext: boolean; nextCursor: string | null };
type Loose = Record<string, unknown>;

const PAGE_SIZE = 20;
const enc = encodeURIComponent;

/**
 * Users change outside this tab (a mentor submits an application, a student
 * enrols, another admin approves someone), so User Management never trusts
 * its cache: data is stale at once, refetched when the tab regains focus,
 * and lists and counts also poll while the page is open.
 */
const FRESH = { staleTime: 0, refetchOnWindowFocus: true } as const;
const LIVE = { ...FRESH, refetchInterval: 60_000 } as const;

// ---- Formatting ---------------------------------------------------------------

/** "₦315,000" from a minor-unit amount. */
export function money(amountMinor: number | null | undefined, currency?: string | null, minorUnit?: number | null) {
  if (amountMinor == null) return null;
  const value = amountMinor / (minorUnit || 100);
  const cur = currency || "NGN";
  try {
    return new Intl.NumberFormat("en-NG", { style: "currency", currency: cur, maximumFractionDigits: 0 }).format(value);
  } catch {
    return `${cur} ${Math.round(value).toLocaleString()}`;
  }
}

/** "Oct 24, 2026" */
export function shortDate(iso: string | null | undefined) {
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

/** "14:30" */
export function clockTime(iso: string | null | undefined) {
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

/** "3 hours ago", "2 days ago". */
export function timeAgo(iso: string | null | undefined) {
  if (!iso) return null;
  const ms = Date.now() - new Date(iso).getTime();
  if (!Number.isFinite(ms)) return null;
  if (ms < 60_000) return "just now";
  const minutes = Math.floor(ms / 60_000);
  if (minutes < 60) return `${minutes} ${minutes === 1 ? "minute" : "minutes"} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} ${hours === 1 ? "hour" : "hours"} ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} ${days === 1 ? "day" : "days"} ago`;
  return shortDate(iso);
}

/** "45 mins", "2 hours". */
export function minutesLabel(min: number | null | undefined) {
  if (min == null || !Number.isFinite(min)) return null;
  if (min < 60) return `${Math.round(min)} ${Math.round(min) === 1 ? "min" : "mins"}`;
  const h = Math.round((min / 60) * 10) / 10;
  return `${h} ${h === 1 ? "hour" : "hours"}`;
}

export const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join("") || "?";

/** "UI/UX Design" → "ui-ux-design" (the backend's expertise slug format). */
export const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

/** "PendingMentorMatch" → "Pending mentor match". */
export const humanize = (s: string | null | undefined) =>
  s ? s.replace(/[_-]+/g, " ").replace(/([a-z])([A-Z])/g, "$1 $2").replace(/^\w/, (c) => c.toUpperCase()).replace(/ (\w)/g, (m) => m.toLowerCase()) : "";

const str = (v: unknown) => (typeof v === "string" && v.trim() ? v : null);
const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : typeof v === "string" && v.trim() && Number.isFinite(Number(v)) ? Number(v) : null);
const pick = (o: Loose | null | undefined, ...keys: string[]) => {
  for (const k of keys) {
    const v = o?.[k];
    if (v !== undefined && v !== null && v !== "") return v;
  }
  return null;
};
const nameOf = (v: unknown) => (v && typeof v === "object" ? str(pick(v as Loose, "fullName", "name", "title")) : str(v));

// ---- Shared types ---------------------------------------------------------------

export type AccountStatus = "Active" | "Inactive" | "Suspended" | string;

export type PersonRef = { id: string; name: string; email: string; type: string | null };

const toPerson = (p: Loose | null | undefined): PersonRef | null =>
  p && (p.id || p.fullName)
    ? { id: String(p.id ?? ""), name: str(p.fullName) ?? str(p.email) ?? "Unnamed", email: str(p.email) ?? "", type: str(p.userType) }
    : null;

// ---- Programs (for pickers) ---------------------------------------------------------

export type ProgramOption = { id: string; title: string; school: string };

/** Every program, all pages. */
export function usePrograms() {
  return useQuery({
    queryKey: ["user-management", "programs"],
    queryFn: async () => {
      const all: ProgramOption[] = [];
      for (let page = 1; page <= 50; page++) {
        const res = await api<{ items: { id: string; title: string; school?: { name?: string } | null }[]; total: number }>("/programs/admin", {
          query: { page, pageSize: 100 },
        });
        all.push(...res.items.map((p) => ({ id: p.id, title: p.title, school: p.school?.name ?? "" })));
        if (all.length >= res.total || res.items.length === 0) break;
      }
      return all.sort((a, b) => a.title.localeCompare(b.title));
    },
    staleTime: 5 * 60_000,
  });
}

// ---- Students: list ---------------------------------------------------------------

export type StudentRow = {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  joinedAt: string | null;
  status: AccountStatus;
  programs: { enrollmentId: string; programId: string; title: string; status: string }[];
  /** e.g. "Direct-Full", "Fundraising". */
  payment: string | null;
  amountPaid: string | null;
  laptop: boolean | null;
};

type ApiStudentRow = {
  id: string;
  fullName: string | null;
  email: string;
  profileAvatarUrl: string | null;
  joinedAt: string | null;
  accountLabel: string | null;
  programs?: { enrollmentId: string; programId: string; title: string; status: string }[] | null;
  paymentLabel: string | null;
  amountPaidMinor: number | null;
  currency: string | null;
  minorUnit: number | null;
  laptopIncluded: boolean | null;
};

const toStudentRow = (s: ApiStudentRow): StudentRow => ({
  id: s.id,
  name: s.fullName || s.email,
  email: s.email,
  avatar: s.profileAvatarUrl,
  joinedAt: s.joinedAt,
  status: s.accountLabel ?? "Active",
  programs: s.programs ?? [],
  payment: s.paymentLabel,
  amountPaid: money(s.amountPaidMinor, s.currency, s.minorUnit),
  laptop: s.laptopIncluded,
});

/** Server-side filters for GET /students/admin. */
export type StudentQuery = {
  search?: string;
  joinedFrom?: string;
  joinedTo?: string;
  programIds?: string[];
  accountStatus?: string;
  paymentMethod?: string;
  amountMin?: string;
  amountMax?: string;
  laptop?: boolean;
};

/** "2026-01-31" → start or end of that day as an ISO instant. */
const dayBound = (d: string | undefined, end: boolean) => (d ? new Date(`${d}T${end ? "23:59:59.999" : "00:00:00"}`).toISOString() : undefined);

export function useStudents(q: StudentQuery) {
  return useInfiniteQuery({
    ...LIVE,
    queryKey: ["user-management", "students", "list", q],
    initialPageParam: null as string | null,
    queryFn: async ({ pageParam }) => {
      const query: Query = {
        limit: PAGE_SIZE,
        cursor: pageParam,
        search: q.search?.trim() || undefined,
        joinedFrom: dayBound(q.joinedFrom, false),
        joinedTo: dayBound(q.joinedTo, true),
        programIds: q.programIds?.length ? q.programIds : undefined,
        accountStatus: q.accountStatus,
        paymentMethod: q.paymentMethod,
        amountMin: q.amountMin || undefined,
        amountMax: q.amountMax || undefined,
        laptop: q.laptop,
      };
      const page = await api<CursorPage<ApiStudentRow>>("/students/admin", { query });
      return { ...page, items: page.items.map(toStudentRow) };
    },
    getNextPageParam: (last) => (last.hasNext ? last.nextCursor : null),
  });
}

// ---- Students: profile -------------------------------------------------------------

export type EnrollmentSummary = {
  enrollmentId: string;
  programId: string;
  title: string;
  status: string;
  progress: number;
  completedAt: string | null;
  finalScore: number | null;
};

export type StudentDetail = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  location: string | null;
  avatar: string | null;
  joinedAt: string | null;
  status: AccountStatus;
  suspensionReason: string | null;
  current: EnrollmentSummary[];
  completed: EnrollmentSummary[];
  closed: EnrollmentSummary[];
};

type ApiEnrollmentSummary = {
  enrollmentId: string;
  programId: string;
  title: string;
  status: string;
  courseProgressPercent: number | null;
  completedAt: string | null;
  finalScorePercent: number | null;
};

type ApiStudentDetail = {
  id: string;
  fullName: string | null;
  email: string;
  phoneNumber: string | null;
  city: string | null;
  stateRegion: string | null;
  country: string | null;
  profileAvatarUrl: string | null;
  joinedAt: string | null;
  accountLabel: string | null;
  suspensionReason: string | null;
  programs?: { current?: ApiEnrollmentSummary[]; completed?: ApiEnrollmentSummary[]; closed?: ApiEnrollmentSummary[] } | null;
};

const toEnrollment = (e: ApiEnrollmentSummary): EnrollmentSummary => ({
  enrollmentId: e.enrollmentId,
  programId: e.programId,
  title: e.title,
  status: e.status,
  progress: Math.round(e.courseProgressPercent ?? 0),
  completedAt: e.completedAt,
  finalScore: e.finalScorePercent,
});

const studentKey = (id: string) => ["user-management", "students", "detail", id] as const;

export function useStudent(id: string) {
  return useQuery({
    ...FRESH,
    queryKey: studentKey(id),
    retry: (count, e) => !(e instanceof ApiError && (e.status === 404 || e.status === 400)) && count < 2,
    queryFn: async (): Promise<StudentDetail> => {
      const s = await api<ApiStudentDetail>(`/students/admin/${enc(id)}`, { expectedStatuses: [404] });
      return {
        id: s.id,
        name: s.fullName || s.email,
        email: s.email,
        phone: s.phoneNumber,
        location: [s.city, s.stateRegion, s.country].filter(Boolean).join(", ") || null,
        avatar: s.profileAvatarUrl,
        joinedAt: s.joinedAt,
        status: s.accountLabel ?? "Active",
        suspensionReason: s.suspensionReason,
        current: (s.programs?.current ?? []).map(toEnrollment),
        completed: (s.programs?.completed ?? []).map(toEnrollment),
        closed: (s.programs?.closed ?? []).map(toEnrollment),
      };
    },
  });
}

// ---- Students: one enrollment --------------------------------------------------------

export type ActivityItem = { id: string; action: string; label: string; detail: string | null; createdAt: string };

export type EnrollmentOverview = {
  enrollmentId: string;
  programId: string;
  title: string;
  status: string;
  progress: number;
  mentor: PersonRef | null;
  advisor: PersonRef | null;
  payment: string | null;
  amountPaid: string | null;
  laptop: boolean | null;
  lastActiveAt: string | null;
};

type ApiEnrollment = {
  enrollmentId: string;
  programId: string;
  programTitle: string;
  status: string;
  courseProgressPercent: number | null;
  mentor: Loose | null;
  advisor: Loose | null;
  paymentLabel: string | null;
  amountPaidMinor: number | null;
  currency: string | null;
  minorUnit: number | null;
  laptopIncluded: boolean | null;
  lastActiveAt: string | null;
  activity?: CursorPage<ActivityItem> | null;
};

/** Overview (from the first page) plus the activity timeline, page by page. */
export function useEnrollment(studentId: string, enrollmentId: string) {
  const query = useInfiniteQuery({
    ...FRESH,
    queryKey: ["user-management", "students", "enrollment", studentId, enrollmentId],
    initialPageParam: null as string | null,
    retry: (count, e) => !(e instanceof ApiError && (e.status === 404 || e.status === 400)) && count < 2,
    queryFn: ({ pageParam }) =>
      api<ApiEnrollment>(`/students/admin/${enc(studentId)}/enrollments/${enc(enrollmentId)}`, {
        query: { limit: 10, cursor: pageParam },
        expectedStatuses: [404],
      }),
    getNextPageParam: (last) => (last.activity?.hasNext ? last.activity.nextCursor : null),
  });
  const first = query.data?.pages[0];
  const overview: EnrollmentOverview | null = first
    ? {
        enrollmentId: first.enrollmentId,
        programId: first.programId,
        title: first.programTitle,
        status: first.status,
        progress: Math.round(first.courseProgressPercent ?? 0),
        mentor: toPerson(first.mentor),
        advisor: toPerson(first.advisor),
        payment: first.paymentLabel,
        amountPaid: money(first.amountPaidMinor, first.currency, first.minorUnit),
        laptop: first.laptopIncluded,
        lastActiveAt: first.lastActiveAt,
      }
    : null;
  const activity = query.data?.pages.flatMap((p) => p.activity?.items ?? []) ?? [];
  return { query, overview, activity };
}

export type ScoredItem = { id: string; title: string; submittedAt: string | null; score: number | null; status: string | null };

export type Performance = {
  progress: number;
  modules: { completed: number; total: number; rate: number | null };
  mcq: { percent: number | null; passRate: number | null; attempts: number };
  assessments: { completed: number; total: number; average: number | null; items: ScoredItem[] };
  miniProjects: { completed: number; total: number; average: number | null; items: ScoredItem[] };
  finalProject: { title: string | null; status: string | null; submittedAt: string | null; score: number | null; display: string | null; gradedAt: string | null };
};

const toScored = (raw: unknown, i: number): ScoredItem => {
  const o = (raw ?? {}) as Loose;
  return {
    id: String(pick(o, "id", "submissionId", "assessmentId", "miniProjectId") ?? i),
    title: str(pick(o, "title", "name", "moduleTitle", "label")) ?? `Item ${i + 1}`,
    submittedAt: str(pick(o, "submittedAt", "completedAt", "attemptedAt", "createdAt")),
    score: num(pick(o, "scorePercent", "percent", "score", "percentage")),
    status: str(pick(o, "status")),
  };
};

export function usePerformance(studentId: string, enrollmentId: string) {
  return useQuery({
    queryKey: ["user-management", "students", "performance", studentId, enrollmentId],
    queryFn: async (): Promise<Performance> => {
      const p = await api<Loose>(`/students/admin/${enc(studentId)}/enrollments/${enc(enrollmentId)}/performance`);
      const m = (p.metrics ?? {}) as Loose;
      const a = (p.assessments ?? {}) as Loose;
      const mp = (p.miniProjects ?? {}) as Loose;
      const f = (p.finalProject ?? {}) as Loose;
      return {
        progress: Math.round(num(p.programProgressPercent) ?? 0),
        modules: { completed: num(m.completedModulesCount) ?? 0, total: num(m.totalModulesCount) ?? 0, rate: num(m.moduleCompletionRate) },
        mcq: { percent: num(m.mcqPointsPercent), passRate: num(m.mcqPassRatePercent), attempts: num(m.mcqAttemptCount) ?? 0 },
        assessments: {
          completed: num(a.completedCount) ?? num(m.assessmentsCompleted) ?? 0,
          total: num(a.totalCount) ?? num(m.assessmentsTotal) ?? 0,
          average: num(a.averageScorePercent),
          items: Array.isArray(a.items) ? a.items.map(toScored) : [],
        },
        miniProjects: {
          completed: num(mp.completedCount) ?? 0,
          total: num(mp.totalCount) ?? 0,
          average: num(mp.averageScorePercent),
          items: Array.isArray(mp.items) ? mp.items.map(toScored) : [],
        },
        finalProject: {
          title: str(f.title),
          status: str(f.status),
          submittedAt: str(f.submittedAt),
          score: num(f.scorePercent),
          display: str(f.scoreDisplay),
          gradedAt: str(f.gradedAt),
        },
      };
    },
  });
}

export type EngagementItem = { key: string; label: string; active: boolean; facts: string[]; lastActivityAt: string | null };
export type Engagement = { lastActiveAt: string | null; sessions: number; communities: number; overview: EngagementItem[] };

const FACT_LABELS: Record<string, string> = {
  membershipCount: "communities joined",
  messageCount: "messages",
  lessonsOpenedCount: "lessons opened",
  lessonsCompletedCount: "lessons completed",
  lessonsTotalCount: "lessons in total",
  completedCount: "completed",
  eventCount: "events",
  courseProgressPercent: "% progress",
};

export function useEngagement(studentId: string, enrollmentId: string) {
  return useQuery({
    queryKey: ["user-management", "students", "engagement", studentId, enrollmentId],
    queryFn: async (): Promise<Engagement> => {
      const e = await api<Loose>(`/students/admin/${enc(studentId)}/enrollments/${enc(enrollmentId)}/engagement`);
      const overview = Array.isArray(e.overview) ? (e.overview as Loose[]) : [];
      return {
        lastActiveAt: str(e.lastActiveAt),
        sessions: num(e.sessionsCompletedCount) ?? 0,
        communities: num(e.communitiesCount) ?? 0,
        overview: overview.map((o, i) => ({
          key: String(o.key ?? i),
          label: str(o.label) ?? humanize(String(o.key ?? "")),
          active: o.active === true,
          lastActivityAt: str(o.lastActivityAt),
          facts: Object.entries(FACT_LABELS)
            .filter(([k]) => num(o[k]) !== null)
            .map(([k, label]) => (label.startsWith("%") ? `${num(o[k])}${label}` : `${num(o[k])} ${label}`)),
        })),
      };
    },
  });
}

export type Contribution = { id: string; name: string; amount: string | null; message: string | null; at: string | null };
export type Campaign = {
  id: string;
  status: string;
  goal: string | null;
  raised: string | null;
  progress: number;
  link: string | null;
  story: string | null;
  programs: string[];
  laptops: string[];
  supporters: number;
  contributions: Contribution[];
};

export function useCampaign(studentId: string, enrollmentId: string) {
  return useQuery({
    queryKey: ["user-management", "students", "campaign", studentId, enrollmentId],
    queryFn: async (): Promise<Campaign | null> => {
      const c = await api<Loose | null>(`/students/admin/${enc(studentId)}/enrollments/${enc(enrollmentId)}/campaign`);
      if (!c) return null;
      const currency = str(c.currency);
      const unit = num(c.minorUnit);
      const goal = num(c.goalAmount);
      const raised = num(c.raisedAmount) ?? 0;
      const items = Array.isArray(c.items) ? (c.items as Loose[]) : [];
      const contributions = Array.isArray(c.contributions) ? (c.contributions as Loose[]) : [];
      const of = (type: string) => items.filter((i) => String(i.itemType).toLowerCase() === type).map((i) => str(i.description) ?? humanize(type));
      return {
        id: String(c.id),
        status: str(c.status) ?? "",
        goal: money(goal, currency, unit),
        raised: money(raised, currency, unit),
        progress: Math.min(100, Math.round(num(c.progressPercent) ?? (goal ? (raised / goal) * 100 : 0))),
        link: str(c.fundingLink),
        story: str(c.personalMessage),
        programs: of("program"),
        laptops: of("laptop"),
        supporters: num(c.paidContributionCount) ?? contributions.length,
        contributions: contributions.map((x, i) => ({
          id: String(x.id ?? i),
          name: str(pick(x, "contributorName", "donorName", "fullName", "name")) ?? nameOf(x.contributor) ?? "Anonymous",
          amount: money(num(x.amount), str(x.currency) ?? currency, num(x.minorUnit) ?? unit),
          message: str(pick(x, "message", "note")),
          at: str(pick(x, "paidAt", "createdAt")),
        })),
      };
    },
  });
}

// ---- Students: loan (no per-student admin endpoint) ------------------------------------------

export type LoanInstallment = { id: string; number: number; dueDate: string; amount: string | null; paidAt: string | null };
export type StudentLoan = {
  id: string;
  status: string;
  principal: string | null;
  total: string | null;
  paid: string | null;
  due: string | null;
  monthly: string | null;
  months: number | null;
  nextDue: string | null;
  items: string[];
  /** null when the repayment schedule can't be read with an admin session. */
  schedule: LoanInstallment[] | null;
};

type ApiLoanRow = {
  id: string;
  studentId?: string | null;
  student?: { id?: string } | null;
  amount: number;
  totalAmount: number | null;
  currency: string;
  minorUnit: number;
  monthlyPayment: number | null;
  repaymentPeriod: number | null;
  status: string;
  createdAt: string;
  items?: { programId?: string | null; description?: string | null }[];
};

/**
 * The student's loan for this program: every /admin/loans page is read and
 * filtered by student (the endpoint has no student filter), then the
 * repayment schedule is fetched for the matching loan.
 */
export function useStudentLoan(studentId: string, programId: string | null) {
  return useQuery({
    queryKey: ["user-management", "students", "loan", studentId, programId],
    enabled: !!programId,
    queryFn: async (): Promise<StudentLoan | null> => {
      const mine: ApiLoanRow[] = [];
      let cursor: string | null = null;
      for (let i = 0; i < 50; i++) {
        const page: CursorPage<ApiLoanRow> = await api<CursorPage<ApiLoanRow>>("/admin/loans", { query: { limit: 100, cursor } });
        mine.push(...page.items.filter((l) => (l.studentId ?? l.student?.id) === studentId));
        if (!page.hasNext || !page.nextCursor) break;
        cursor = page.nextCursor;
      }
      if (!mine.length) return null;
      mine.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      const loan = mine.find((l) => l.items?.some((it) => it.programId === programId));
      if (!loan) return null;
      const fmt = (v: number | null | undefined) => money(v, loan.currency, loan.minorUnit);

      let schedule: LoanInstallment[] | null = null;
      let paidMinor = 0;
      try {
        const rows: Loose[] = [];
        let c: string | null = null;
        for (let i = 0; i < 10; i++) {
          const page: CursorPage<Loose> = await api<CursorPage<Loose>>(`/loans/${enc(loan.id)}/repayments`, {
            query: { limit: 100, cursor: c },
            expectedStatuses: [403, 404],
          });
          rows.push(...page.items);
          if (!page.hasNext || !page.nextCursor) break;
          c = page.nextCursor;
        }
        schedule = rows
          .map((r, i) => ({
            id: String(r.id ?? i),
            number: num(r.paymentNumber) ?? i + 1,
            dueDate: String(r.dueDate ?? ""),
            amount: fmt(num(r.amount)),
            amountMinor: num(r.amount) ?? 0,
            paidAt: str(r.paidAt),
          }))
          .sort((a, b) => a.number - b.number)
          .map(({ amountMinor, ...r }) => {
            if (r.paidAt) paidMinor += amountMinor;
            return r;
          });
      } catch (e) {
        if (!(e instanceof ApiError && (e.status === 403 || e.status === 404))) throw e;
      }
      const total = loan.totalAmount ?? loan.amount;
      return {
        id: loan.id,
        status: loan.status,
        principal: fmt(loan.amount),
        total: fmt(total),
        paid: schedule ? fmt(paidMinor) : null,
        due: schedule ? fmt(Math.max(total - paidMinor, 0)) : null,
        monthly: fmt(loan.monthlyPayment),
        months: loan.repaymentPeriod,
        nextDue: schedule?.find((r) => !r.paidAt)?.dueDate ?? null,
        items: (loan.items ?? []).map((it) => it.description ?? "").filter(Boolean),
        schedule,
      };
    },
  });
}

// ---- Students: mentor assignment --------------------------------------------------------

const assignmentKey = (studentId: string, enrollmentId: string) => ["user-management", "students", "assignment", studentId, enrollmentId] as const;

export function useAssignment(studentId: string, enrollmentId: string | null) {
  return useQuery({
    ...FRESH,
    queryKey: assignmentKey(studentId, enrollmentId ?? ""),
    enabled: !!enrollmentId,
    queryFn: async () => {
      const a = await api<Loose | null>(`/students/admin/${enc(studentId)}/enrollments/${enc(enrollmentId!)}/assignment`, { expectedStatuses: [404] }).catch(
        (e) => {
          if (e instanceof ApiError && e.status === 404) return null;
          throw e;
        },
      );
      return { mentor: toPerson(a?.mentor as Loose), advisor: toPerson(a?.advisor as Loose), status: str(a?.status) };
    },
  });
}

export function useAssignmentOptions(studentId: string, enrollmentId: string | null) {
  return useQuery({
    queryKey: ["user-management", "students", "assignment-options", studentId, enrollmentId ?? ""],
    enabled: !!enrollmentId,
    queryFn: async () => {
      const o = await api<{ mentors?: Loose[]; advisors?: Loose[] }>(`/students/admin/${enc(studentId)}/enrollments/${enc(enrollmentId!)}/assignment-options`);
      const list = (l?: Loose[]) => (l ?? []).map(toPerson).filter((p): p is PersonRef => !!p && !!p.id);
      return { mentors: list(o.mentors), advisors: list(o.advisors) };
    },
  });
}

export function useUpdateAssignment(studentId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ enrollmentId, mentorId, advisorId }: { enrollmentId: string; mentorId?: string; advisorId?: string }) =>
      api(`/students/admin/${enc(studentId)}/enrollments/${enc(enrollmentId)}/assignment`, {
        method: "PATCH",
        body: { ...(mentorId ? { mentorId } : {}), ...(advisorId ? { advisorId } : {}) },
      }),
    onSuccess: (_d, { enrollmentId }) => {
      void qc.invalidateQueries({ queryKey: assignmentKey(studentId, enrollmentId) });
      void qc.invalidateQueries({ queryKey: ["user-management", "students", "enrollment", studentId, enrollmentId] });
      void qc.invalidateQueries({ queryKey: studentKey(studentId) });
      // Mentee counts and capacity change for the mentors involved.
      void qc.invalidateQueries({ queryKey: ["user-management", "mentors"] });
    },
  });
}

// ---- Account actions (students and mentors) --------------------------------------------------

export type AccountKind = "students" | "mentors";

const detailKey = (kind: AccountKind, id: string) => (kind === "students" ? studentKey(id) : mentorKey(id));

export function useNotify(kind: AccountKind, id: string) {
  return useMutation({
    mutationFn: (body: { subject: string; message: string }) => api<{ accepted: boolean }>(`/${kind}/admin/${enc(id)}/notify`, { method: "POST", body }),
  });
}

export function useSuspend(kind: AccountKind, id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (reason: string) => api(`/${kind}/admin/${enc(id)}/suspend`, { method: "POST", body: { reason } }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: detailKey(kind, id) });
      void qc.invalidateQueries({ queryKey: ["user-management", kind, "list"] });
    },
  });
}

export function useReinstate(kind: AccountKind, id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api(`/${kind}/admin/${enc(id)}/reinstate`, { method: "POST" }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: detailKey(kind, id) });
      void qc.invalidateQueries({ queryKey: ["user-management", kind, "list"] });
    },
  });
}

// ---- Mentors: summary and list -------------------------------------------------------------

export function useMentorSummary(enabled = true) {
  return useQuery({
    ...LIVE,
    enabled,
    queryKey: ["user-management", "mentors", "summary"],
    queryFn: () => api<{ pendingReviewCount: number; totalMentors: number; mentorCount: number; programAdvisorCount: number }>("/mentors/admin/summary"),
  });
}

export type MentorSection = "pending" | "assigned" | "unassigned";
export type Capacity = "Available" | "NearFull" | "Full";

export type MentorRow = {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  expertise: string[];
  experience: number | null;
  systemRating: number | null;
  adminRating: number | null;
  programs: string[];
  mentees: number | null;
  maxMentees: number | null;
  averageRating: number | null;
  capacity: Capacity | null;
};

const CAPACITIES: Capacity[] = ["Available", "NearFull", "Full"];
const toCapacity = (v: unknown): Capacity | null => {
  const s = String(v ?? "").replace(/[\s_-]/g, "").toLowerCase();
  return CAPACITIES.find((c) => c.toLowerCase() === s) ?? null;
};

const toMentorRow = (m: Loose): MentorRow => {
  const programs = Array.isArray(m.programs) ? (m.programs as unknown[]).map(nameOf).filter((p): p is string => !!p) : [];
  return {
    id: String(m.id),
    name: str(m.fullName) ?? str(m.email) ?? "Unnamed",
    email: str(m.email) ?? "",
    avatar: str(m.profileAvatarUrl),
    expertise: Array.isArray(m.expertise) ? (m.expertise as unknown[]).map((e) => nameOf(e) ?? (e && typeof e === "object" ? str((e as Loose).label) : null)).filter((e): e is string => !!e) : [],
    experience: num(m.totalYearsExperience),
    systemRating: num(m.systemRating),
    adminRating: num(m.adminRating),
    programs,
    mentees: num(pick(m, "currentStudentCount", "menteeCount", "menteesCount", "mentees")),
    maxMentees: num(pick(m, "maxStudents", "maxMentees")),
    averageRating: num(m.averageRating),
    capacity: toCapacity(m.capacity),
  };
};

export type MentorQuery = {
  search?: string;
  expertise?: string;
  experienceMin?: string;
  experienceMax?: string;
  systemRating?: string;
  adminRating?: string;
  approvedFrom?: string;
  approvedTo?: string;
  programIds?: string[];
  capacity?: string;
  menteesMin?: string;
  menteesMax?: string;
  averageRating?: string;
};

export function useMentors(section: MentorSection, q: MentorQuery) {
  return useInfiniteQuery({
    ...LIVE,
    queryKey: ["user-management", "mentors", "list", section, q],
    initialPageParam: null as string | null,
    queryFn: async ({ pageParam }) => {
      const query: Query = {
        section,
        limit: 10,
        cursor: pageParam,
        search: q.search?.trim() || undefined,
        expertise: q.expertise ? slugify(q.expertise) : undefined,
        experienceMin: q.experienceMin || undefined,
        experienceMax: q.experienceMax || undefined,
        systemRating: q.systemRating,
        adminRating: q.adminRating,
        approvedFrom: dayBound(q.approvedFrom, false),
        approvedTo: dayBound(q.approvedTo, true),
        programIds: q.programIds?.length ? q.programIds : undefined,
        capacity: q.capacity,
        menteesMin: q.menteesMin || undefined,
        menteesMax: q.menteesMax || undefined,
        averageRating: q.averageRating,
      };
      const page = await api<CursorPage<Loose>>("/mentors/admin", { query });
      return { ...page, items: page.items.map(toMentorRow) };
    },
    getNextPageParam: (last) => (last.hasNext ? last.nextCursor : null),
  });
}

export type MentorRoleView = "instructors" | "advisors";

/**
 * Mentors who are Instructors (or Program Advisors) on at least one program.
 * GET /mentors/admin has no role filter, so every assigned mentor is read and
 * their per-program roles checked: from the row when it carries the
 * mentor/advisor flags, otherwise from GET /mentors/admin/:id.
 */
export function useMentorsByRole(role: MentorRoleView | null) {
  return useQuery({
    ...LIVE,
    enabled: !!role,
    queryKey: ["user-management", "mentors", "list", "role", role ?? ""],
    queryFn: async (): Promise<MentorRow[]> => {
      const flag = role === "instructors" ? "mentor" : "advisor";
      const raw: Loose[] = [];
      let cursor: string | null = null;
      for (let i = 0; i < 50; i++) {
        const page: CursorPage<Loose> = await api<CursorPage<Loose>>("/mentors/admin", { query: { section: "assigned", limit: 100, cursor } });
        raw.push(...page.items);
        if (!page.hasNext || !page.nextCursor) break;
        cursor = page.nextCursor;
      }
      const out: MentorRow[] = [];
      for (let i = 0; i < raw.length; i += 6) {
        const rows = await Promise.all(
          raw.slice(i, i + 6).map(async (r) => {
            const progs = Array.isArray(r.programs) ? (r.programs as unknown[]) : [];
            const flagged = progs.length > 0 && progs.every((p) => p && typeof p === "object" && typeof (p as Loose)[flag] === "boolean");
            const titles = flagged
              ? progs.filter((p) => (p as Loose)[flag] === true).map((p) => nameOf(p) ?? "Program")
              : toMentorDetail(await api<Loose>(`/mentors/admin/${enc(String(r.id))}`)).programs.filter((p) => p[flag]).map((p) => p.title);
            return titles.length ? { ...toMentorRow(r), programs: titles } : null;
          }),
        );
        out.push(...rows.filter((x): x is MentorRow => !!x));
      }
      return out.sort((a, b) => a.name.localeCompare(b.name));
    },
  });
}

// ---- Mentors: profile ----------------------------------------------------------------------

export type MentorProgramLink = { programId: string; title: string; mentor: boolean; advisor: boolean; assignedAt: string | null; mentees: number };

export type MentorDetail = {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  status: AccountStatus;
  suspensionReason: string | null;
  application: {
    id: string | null;
    status: string;
    bio: string | null;
    country: string | null;
    experience: number | null;
    link: string | null;
    introVideo: string | null;
    systemRating: number | null;
    systemRatingSummary: string | null;
    adminRating: number | null;
    submittedAt: string | null;
    reviewedAt: string | null;
    rejectionReason: string | null;
    education: string | null;
    expertise: { label: string; years: number | null }[];
    documents: { label: string; url: string }[];
  };
  mentees: number;
  maxMentees: number | null;
  capacity: Capacity | null;
  averageRating: number | null;
  ratingCount: number;
  programs: MentorProgramLink[];
};

const mentorKey = (id: string) => ["user-management", "mentors", "detail", id] as const;

const toMentorDetail = (m: Loose): MentorDetail => {
  const a = (m.application ?? {}) as Loose;
  const url = (v: unknown) => (v && typeof v === "object" ? str((v as Loose).secureUrl) : null);
  const docs: { label: string; url: string }[] = [];
  const selfie = url(a.selfieImage);
  if (selfie) docs.push({ label: "Selfie", url: selfie });
  const gov = url(a.governmentIdImage);
  if (gov) docs.push({ label: "Government ID", url: gov });
  (Array.isArray(a.certificates) ? (a.certificates as Loose[]) : []).forEach((c, i) => {
    const u = url(c.mediaAsset) ?? url(c);
    if (u) docs.push({ label: `Certificate ${i + 1}`, url: u });
  });
  return {
    id: String(m.id),
    name: str(m.fullName) ?? str(a.legalFullName) ?? str(m.email) ?? "Unnamed",
    email: str(m.email) ?? "",
    avatar: str(m.profileAvatarUrl),
    status: str(m.accountLabel) ?? "Active",
    suspensionReason: str(m.suspensionReason),
    application: {
      id: str(a.id),
      status: str(a.status) ?? "",
      bio: str(a.professionalBio),
      country: str(a.country),
      experience: num(a.totalYearsExperience),
      link: str(a.linkedinOrPortfolioUrl),
      introVideo: str(a.introVideoUrl),
      systemRating: num(a.systemRating),
      systemRatingSummary: str(a.systemRatingSummary),
      adminRating: num(a.adminRating),
      submittedAt: str(a.submittedAt),
      reviewedAt: str(a.reviewedAt),
      rejectionReason: str(a.rejectionReason),
      education: nameOf(a.highestEducationalLevel) ?? (a.highestEducationalLevel ? str((a.highestEducationalLevel as Loose).label) : null),
      expertise: (Array.isArray(a.expertise) ? (a.expertise as Loose[]) : []).map((e) => ({
        label: str(e.label) ?? humanize(String(e.slug ?? "")),
        years: num(e.yearsOfExperience),
      })),
      documents: docs,
    },
    mentees: num(m.currentStudentCount) ?? 0,
    maxMentees: num(m.maxStudents),
    capacity: toCapacity(m.capacity),
    averageRating: num(m.averageRating),
    ratingCount: num(m.ratingCount) ?? 0,
    programs: (Array.isArray(m.programs) ? (m.programs as Loose[]) : []).map((p) => ({
      programId: String(p.programId),
      title: str(p.title) ?? "Program",
      mentor: p.mentor === true,
      advisor: p.advisor === true,
      assignedAt: str(p.assignedAt),
      mentees: num(p.menteeCount) ?? 0,
    })),
  };
};

export function useMentor(id: string) {
  return useQuery({
    ...FRESH,
    queryKey: mentorKey(id),
    retry: (count, e) => !(e instanceof ApiError && (e.status === 404 || e.status === 400)) && count < 2,
    queryFn: async () => toMentorDetail(await api<Loose>(`/mentors/admin/${enc(id)}`, { expectedStatuses: [404] })),
  });
}

/** Instructor / Program Advisor wording for a program link. */
export const roleLabel = (p: { mentor: boolean; advisor: boolean }) =>
  p.mentor && p.advisor ? "Instructor & Program Advisor" : p.mentor ? "Instructor" : p.advisor ? "Program Advisor" : "No role";

export type MentorSession = { id: string; title: string; at: string | null; status: string | null; kind: "session" | "feedback" };
export type Mentee = { id: string | null; enrollmentId: string | null; name: string; progress: number | null; lastSessionAt: string | null };
export type MentorProgramDetail = {
  activity: MentorSession[];
  sessionsCompleted: number;
  averageDuration: number | null;
  averageResponse: number | null;
  averageRating: number | null;
  mentees: Mentee[];
};

export function useMentorProgram(mentorId: string, programId: string) {
  return useQuery({
    queryKey: ["user-management", "mentors", "program", mentorId, programId],
    queryFn: async (): Promise<MentorProgramDetail> => {
      const d = await api<Loose>(`/mentors/admin/${enc(mentorId)}/programs/${enc(programId)}`);
      const act = (d.activity ?? {}) as Loose;
      const perf = (d.performance ?? {}) as Loose;
      const entry = (kind: "session" | "feedback") => (raw: unknown, i: number): MentorSession => {
        const o = (raw ?? {}) as Loose;
        const who = nameOf(pick(o, "student", "mentee", "studentName", "studentFullName"));
        const base = str(pick(o, "title", "label", "topic", "comment"));
        return {
          id: `${kind}-${String(o.id ?? i)}`,
          title: base ?? (kind === "session" ? `Session${who ? ` with ${who}` : ""}` : `Feedback${who ? ` from ${who}` : ""}`),
          at: str(pick(o, "completedAt", "endedAt", "scheduledAt", "startsAt", "startAt", "createdAt")),
          status: str(o.status) ?? (num(o.rating) !== null ? `${num(o.rating)}/5` : null),
          kind,
        };
      };
      const activity = [
        ...(Array.isArray(act.sessions) ? act.sessions.map(entry("session")) : []),
        ...(Array.isArray(act.feedback) ? act.feedback.map(entry("feedback")) : []),
      ].sort((a, b) => (b.at ?? "").localeCompare(a.at ?? ""));
      return {
        activity,
        sessionsCompleted: num(perf.sessionsCompletedCount) ?? 0,
        averageDuration: num(perf.averageDurationMinutes),
        averageResponse: num(perf.averageResponseTimeMinutes),
        averageRating: num(perf.averageRating),
        mentees: (Array.isArray(d.mentees) ? (d.mentees as Loose[]) : []).map((x) => {
          const student = (x.student ?? {}) as Loose;
          return {
            id: str(pick(x, "studentId", "studentUserId")) ?? str(student.id) ?? str(x.id),
            enrollmentId: str(x.enrollmentId),
            name: str(pick(x, "fullName", "name", "studentName")) ?? str(student.fullName) ?? "Student",
            progress: num(pick(x, "courseProgressPercent", "progressPercent", "progress")),
            lastSessionAt: str(pick(x, "lastSessionAt", "lastSessionDate")),
          };
        }),
      };
    },
  });
}

// ---- Mentors: review and programs ----------------------------------------------------------

function useMentorMutation<V>(id: string, fn: (v: V) => Promise<unknown>) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: mentorKey(id) });
      void qc.invalidateQueries({ queryKey: ["user-management", "mentors", "list"] });
      void qc.invalidateQueries({ queryKey: ["user-management", "mentors", "summary"] });
    },
  });
}

export const useRateMentor = (id: string) =>
  useMentorMutation(id, (adminRating: number) => api(`/mentors/admin/${enc(id)}/rating`, { method: "PATCH", body: { adminRating } }));

export type ReviewAction = "approve" | "reject" | "request-changes";

export const useReviewMentor = (id: string) =>
  useMentorMutation(id, ({ action, reason }: { action: ReviewAction; reason?: string }) =>
    api(`/mentors/admin/${enc(id)}/${action}`, { method: "POST", body: reason?.trim() ? { reason: reason.trim() } : {} }),
  );

/** PUT replaces every program link, so callers pass the complete list. */
export const useSetMentorPrograms = (id: string) =>
  useMentorMutation(id, (programs: { programId: string; mentor: boolean; advisor: boolean }[]) =>
    api(`/mentors/admin/${enc(id)}/programs`, { method: "PUT", body: { programs } }),
  );

/** Current links with one program's roles changed (or added); a program with no role is dropped. */
export function mergePrograms(current: MentorProgramLink[], changes: { programId: string; mentor: boolean; advisor: boolean }[]) {
  const map = new Map(current.map((p) => [p.programId, { programId: p.programId, mentor: p.mentor, advisor: p.advisor }]));
  for (const c of changes) map.set(c.programId, c);
  return [...map.values()].filter((p) => p.mentor || p.advisor);
}

/** Readable message for a failed mutation. */
export const errorText = (e: unknown) => (e instanceof Error && e.message ? e.message : "Something went wrong. Please try again.");

// ---- Counts (dashboard) -----------------------------------------------------------

/** Lists have no total, so counts page through them; past the cap they read "1,000+". */
const COUNT_CAP_PAGES = 10;
export type Count = { value: number; capped: boolean };

async function countPages(path: string, query: Query): Promise<Count> {
  let value = 0;
  let cursor: string | null = null;
  for (let i = 0; i < COUNT_CAP_PAGES; i++) {
    const page: CursorPage<unknown> = await api<CursorPage<unknown>>(path, { query: { ...query, limit: 100, cursor } });
    value += page.items.length;
    if (!page.hasNext || !page.nextCursor) return { value, capped: false };
    cursor = page.nextCursor;
  }
  return { value, capped: true };
}

export const countLabel = (c: Count | undefined) => (c ? `${c.value.toLocaleString()}${c.capped ? "+" : ""}` : undefined);

/** Students, optionally only those with this account status. */
export function useStudentCount(accountStatus?: "Active" | "Inactive" | "Suspended", enabled = true) {
  return useQuery({
    ...LIVE,
    enabled,
    queryKey: ["user-management", "students", "list", "count", accountStatus ?? "all"],
    queryFn: () => countPages("/students/admin", { accountStatus }),
  });
}

/** Mentors in one directory section. */
export function useMentorCount(section: MentorSection, enabled = true) {
  return useQuery({
    ...LIVE,
    enabled,
    queryKey: ["user-management", "mentors", "list", "count", section],
    queryFn: () => countPages("/mentors/admin", { section }),
  });
}
