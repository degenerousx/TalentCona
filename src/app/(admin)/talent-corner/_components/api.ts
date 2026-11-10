import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { initialsOf, type RequestStatus, type Talent, type TalentRequest, type TalentStatus } from "./data";

/**
 * Talent Corner ↔ backend. Components import only the hooks below.
 * - Talent Request tab: `/talent-requests/admin*` (Postman "talent request → admin").
 * - Available Talents tab: `/talent-pool/admin*` (backend spec; Postman has the summary only).
 */

type CursorPage<T> = { items: T[]; limit: number; hasNext: boolean; nextCursor: string | null };

const PAGE_SIZE = 20;

// ---- Talent requests ----------------------------------------------------------

type ApiRole = {
  id: string;
  sortOrder?: number;
  title: string;
  employmentType: string;
  seniorityLevel: string;
  positionCount: number;
  requiredSkills: string[];
  niceToHaveSkills: string[];
};

type ApiTalentRequest = {
  id: string;
  referenceId: string;
  status: "Pending" | "Fulfilled" | string;
  companyName: string;
  contactFirstName: string;
  contactLastName: string;
  email: string;
  phone: string;
  country?: string | null;
  city?: string | null;
  stateRegion?: string | null;
  website?: string | null;
  description: string;
  deadline?: string | null;
  createdAt: string;
  fulfilledAt?: string | null;
  totalPositions?: number;
  roles: ApiRole[];
  fulfilledBy?: { fullName?: string | null; email?: string } | null;
};

/** "FullTime" → "Full-time", "MidLevel" → "Mid Level". */
const EMPLOYMENT: Record<string, string> = {
  FullTime: "Full-time",
  PartTime: "Part-time",
  Contract: "Contract",
  Internship: "Internship",
  Freelance: "Freelance",
  Temporary: "Temporary",
};
const spaced = (v: string) => v.replace(/([a-z])([A-Z])/g, "$1 $2");
const employment = (v: string) => EMPLOYMENT[v] ?? spaced(v);
const level = (v: string) => {
  const s = spaced(v);
  return /level$/i.test(s) ? s : `${s} Level`;
};

function toRequest(r: ApiTalentRequest): TalentRequest {
  const roles = [...(r.roles ?? [])]
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
    .map((role) => ({
      id: role.id,
      title: role.title,
      level: level(role.seniorityLevel),
      employment: employment(role.employmentType),
      positions: role.positionCount,
      requiredSkills: role.requiredSkills ?? [],
      niceToHaveSkills: role.niceToHaveSkills ?? [],
    }));
  const location = [r.city, r.stateRegion !== r.city ? r.stateRegion : null, r.country].filter(Boolean).join(", ");
  return {
    id: r.id,
    code: `#${r.referenceId}`,
    company: r.companyName,
    contact: [r.contactFirstName, r.contactLastName].filter(Boolean).join(" "),
    email: r.email,
    phone: r.phone,
    location: location || "-",
    website: r.website || undefined,
    requestedOn: r.createdAt,
    deadline: r.deadline ?? null,
    employmentType: [...new Set(roles.map((role) => role.employment))].join(", ") || "-",
    description: r.description,
    status: r.status === "Fulfilled" ? "fulfilled" : "pending",
    totalPositions: r.totalPositions ?? roles.reduce((sum, role) => sum + role.positions, 0),
    roles,
    fulfilledAt: r.fulfilledAt ?? null,
    fulfilledBy: r.fulfilledBy?.fullName || r.fulfilledBy?.email || null,
  };
}

const requestKeys = {
  all: ["talent-corner", "requests"] as const,
  summary: ["talent-corner", "requests", "summary"] as const,
  list: (status: RequestStatus | "all", search: string) => ["talent-corner", "requests", "list", status, search] as const,
  detail: (id: string) => ["talent-corner", "requests", "detail", id] as const,
};

export function useRequestSummary() {
  return useQuery({
    queryKey: requestKeys.summary,
    queryFn: () => api<{ total: number; pending: number; fulfilled: number }>("/talent-requests/admin/summary"),
  });
}

const requestStatusParam = (s: RequestStatus | "all") => (s === "all" ? undefined : s === "pending" ? "Pending" : "Fulfilled");

/** Company hiring requests, newest first; search covers company, contact, location, role title and skill tags. */
export function useTalentRequests(status: RequestStatus | "all", search: string) {
  return useInfiniteQuery({
    queryKey: requestKeys.list(status, search),
    initialPageParam: null as string | null,
    queryFn: async ({ pageParam }) => {
      const page = await api<CursorPage<ApiTalentRequest>>("/talent-requests/admin", {
        query: { limit: PAGE_SIZE, cursor: pageParam, status: requestStatusParam(status), search: search || undefined },
      });
      return { ...page, items: page.items.map(toRequest) };
    },
    getNextPageParam: (last) => (last.hasNext ? last.nextCursor : null),
  });
}

export function useTalentRequest(id: string | null) {
  return useQuery({
    queryKey: requestKeys.detail(id ?? ""),
    queryFn: async () => toRequest(await api<ApiTalentRequest>(`/talent-requests/admin/${encodeURIComponent(id!)}`)),
    enabled: !!id,
  });
}

export function useFulfillRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api<ApiTalentRequest>(`/talent-requests/admin/${encodeURIComponent(id)}/fulfill`, { method: "PATCH" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: requestKeys.all }),
  });
}

/** Every request matching the filters (the export endpoint streams CSV, so we build it from the list). */
export async function fetchAllRequests(status: RequestStatus | "all", search: string) {
  const all: TalentRequest[] = [];
  let cursor: string | null = null;
  do {
    const page: CursorPage<ApiTalentRequest> = await api<CursorPage<ApiTalentRequest>>("/talent-requests/admin", {
      query: { limit: 100, cursor, status: requestStatusParam(status), search: search || undefined },
    });
    all.push(...page.items.map(toRequest));
    cursor = page.hasNext ? page.nextCursor : null;
  } while (cursor);
  return all;
}

// ---- Talent pool ---------------------------------------------------------------

/**
 * A talent interest as the admin list/detail returns it. Postman has no example,
 * so this reads the fields the student-side interest documents (seeking,
 * targetRole, programSkills, profile.*) plus the student, program and grade.
 */
type ApiTalent = {
  id: string;
  seeking?: string | null;
  targetRole?: string | null;
  programSkills?: string[] | null;
  submittedAt?: string | null;
  status?: string | null;
  profile?: {
    status?: string | null;
    skills?: string[] | null;
    portfolioUrl?: string | null;
    githubUrl?: string | null;
    linkedinUrl?: string | null;
    hiredBy?: string | null;
    hiredAt?: string | null;
    hiredRole?: string | null;
  } | null;
  student?: { id?: string; fullName?: string | null; email?: string | null; phoneNumber?: string | null; phone?: string | null; location?: string | null; city?: string | null; country?: string | null } | null;
  fullName?: string | null;
  email?: string | null;
  program?: { title?: string | null } | null;
  programTitle?: string | null;
  cohort?: string | null;
  cohortLabel?: string | null;
  completedAt?: string | null;
  finalGradePercent?: number | null;
  finalGrade?: number | null;
  certifications?: Array<string | { title?: string; name?: string }> | null;
  projectsCompleted?: number | null;
  hiredBy?: string | null;
  hiredAt?: string | null;
  hiredRole?: string | null;
};

const monthYear = (iso?: string | null) => {
  if (!iso) return "";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "" : d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
};

function toTalent(t: ApiTalent): Talent {
  const name = t.student?.fullName || t.fullName || t.student?.email || t.email || "Graduate";
  const p = t.profile ?? {};
  const statusRaw = (p.status || t.status || "Available").toLowerCase();
  const status: TalentStatus = statusRaw === "hired" ? "hired" : "available";
  const links = [
    p.portfolioUrl ? { label: "Portfolio", url: p.portfolioUrl } : null,
    p.githubUrl ? { label: "GitHub", url: p.githubUrl } : null,
    p.linkedinUrl ? { label: "LinkedIn", url: p.linkedinUrl } : null,
  ].filter((l) => l !== null);
  const hiredBy = p.hiredBy ?? t.hiredBy;
  const grade = t.finalGradePercent ?? t.finalGrade ?? null;
  return {
    id: t.id,
    name,
    initials: initialsOf(name),
    program: t.program?.title || t.programTitle || t.targetRole || "-",
    cohort: t.cohortLabel || t.cohort || monthYear(t.completedAt ?? t.submittedAt),
    location: t.student?.location || [t.student?.city, t.student?.country].filter(Boolean).join(", ") || "-",
    status,
    grade: typeof grade === "number" ? Math.round(grade) : null,
    skills: [...new Set([...(t.programSkills ?? []), ...(p.skills ?? [])])],
    certifications: (t.certifications ?? []).map((c) => (typeof c === "string" ? c : c.title || c.name || "")).filter(Boolean),
    email: t.student?.email || t.email || "",
    phone: t.student?.phoneNumber || t.student?.phone || "",
    links,
    projectsCompleted: t.projectsCompleted ?? null,
    seeking: t.seeking || "",
    targetRole: t.targetRole || "",
    job:
      status === "hired" && hiredBy
        ? { company: hiredBy, role: p.hiredRole ?? t.hiredRole ?? "", date: monthYear(p.hiredAt ?? t.hiredAt) }
        : undefined,
  };
}

const talentKeys = {
  all: ["talent-corner", "talents"] as const,
  summary: ["talent-corner", "talents", "summary"] as const,
  list: (status: TalentStatus | "all", q: string) => ["talent-corner", "talents", "list", status, q] as const,
  detail: (id: string) => ["talent-corner", "talents", "detail", id] as const,
};

export function useTalentSummary() {
  return useQuery({
    queryKey: talentKeys.summary,
    queryFn: () =>
      api<{ totalGraduates: number; availableCount: number; hiredCount: number; averageFinalGradePercent: number | null }>(
        "/talent-pool/admin/summary",
      ),
  });
}

/** Graduates who opted into the talent pool (one card per completed enrollment). */
export function useTalents(status: TalentStatus | "all", q: string) {
  return useInfiniteQuery({
    queryKey: talentKeys.list(status, q),
    initialPageParam: null as string | null,
    queryFn: async ({ pageParam }) => {
      const page = await api<CursorPage<ApiTalent>>("/talent-pool/admin", {
        query: { limit: PAGE_SIZE, cursor: pageParam, status, q: q || undefined },
      });
      return { ...page, items: page.items.map(toTalent) };
    },
    getNextPageParam: (last) => (last.hasNext ? last.nextCursor : null),
  });
}

export function useTalent(id: string | null) {
  return useQuery({
    queryKey: talentKeys.detail(id ?? ""),
    queryFn: async () => toTalent(await api<ApiTalent>(`/talent-pool/admin/${encodeURIComponent(id!)}`)),
    enabled: !!id,
  });
}

export async function fetchAllTalents(status: TalentStatus | "all", q: string) {
  const all: Talent[] = [];
  let cursor: string | null = null;
  do {
    const page: CursorPage<ApiTalent> = await api<CursorPage<ApiTalent>>("/talent-pool/admin", {
      query: { limit: 100, cursor, status, q: q || undefined },
    });
    all.push(...page.items.map(toTalent));
    cursor = page.hasNext ? page.nextCursor : null;
  } while (cursor);
  return all;
}

export type HireDetails = { hiredBy: string; hiredAt: string; hiredRole: string };

/** PATCH /talent-pool/admin/:id/hire { hiredBy, hiredAt, hiredRole } — all required. */
export function useMarkHired() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: HireDetails & { id: string }) =>
      api(`/talent-pool/admin/${encodeURIComponent(id)}/hire`, { method: "PATCH", body }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: talentKeys.all }),
  });
}

/** PATCH /talent-pool/admin/:id/availability — re-open a hired profile. */
export function useMarkAvailable() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api(`/talent-pool/admin/${encodeURIComponent(id)}/availability`, { method: "PATCH" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: talentKeys.all }),
  });
}
