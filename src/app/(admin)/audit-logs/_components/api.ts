import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { api, ApiError, type Query } from "@/lib/api";
import { toEvent, type LogType } from "./model";

/**
 * Audit & System Logs ↔ backend (Postman: "audit"), VIEW_AUDIT_LOG:
 *   GET  /audit/logs?cursor=&limit=&search=&categories=&range=&from=&to=   list (cursor paging, max 100)
 *   GET  /audit/logs/summary?range=&from=&to=                             { events, adminChanges, securityEvents }
 *   POST /audit/logs/export?<same filters>                                { jobId } (file is emailed)
 *   GET  /admin-portal/team/members (MANAGE_ADMINS)                       "Active administrators"
 *
 * Search, categories (Change/Critical/Security/Approval/Access) and the date
 * range are filtered by the backend. The user-type and module filters aren't
 * list parameters, so those are applied to the loaded events.
 */

type CursorPage<T> = { items: T[]; limit?: number; hasNext?: boolean; nextCursor?: string | null };

const LIVE = { staleTime: 0, refetchOnWindowFocus: true, refetchInterval: 30_000 } as const;
export const PAGE = 100;

/** Backend ranges; the backend's default is 7d. */
export type Range = "1d" | "7d" | "30d" | "custom";
export const RANGES: { id: Range; label: string; phrase: string }[] = [
  { id: "1d", label: "Last 24 hours", phrase: "in the last 24 hours" },
  { id: "7d", label: "Last 7 days", phrase: "in the last 7 days" },
  { id: "30d", label: "Last 30 days", phrase: "in the last 30 days" },
  { id: "custom", label: "Custom", phrase: "in the selected dates" },
];

export type ServerFilters = { search: string; categories: LogType[]; range: Range; from: string; to: string };

export function toQuery(f: ServerFilters): Query {
  return {
    search: f.search.trim() || undefined,
    categories: f.categories.length ? f.categories.join(",") : undefined,
    range: f.range,
    from: f.range === "custom" ? f.from : undefined,
    to: f.range === "custom" ? f.to : undefined,
  };
}

/** The filtered log, newest first, 100 per request. */
export function useAuditLog(f: ServerFilters) {
  return useInfiniteQuery({
    ...LIVE,
    queryKey: ["audit-logs", "list", f],
    initialPageParam: null as string | null,
    queryFn: async ({ pageParam }) => {
      const page = await api<CursorPage<unknown>>("/audit/logs", { query: { limit: PAGE, cursor: pageParam, ...toQuery(f) } });
      return { items: page.items.map(toEvent), hasNext: !!page.hasNext && !!page.nextCursor, nextCursor: page.nextCursor ?? null };
    },
    getNextPageParam: (last) => (last.hasNext ? last.nextCursor : null),
  });
}

export type AuditSummary = { range: string; from: string; to: string; events: number; adminChanges: number; securityEvents: number };

/** The stat cards: last 24 hours. */
export function useAuditSummary() {
  return useQuery({
    ...LIVE,
    queryKey: ["audit-logs", "summary", "1d"],
    queryFn: () => api<AuditSummary>("/audit/logs/summary", { query: { range: "1d" } }),
  });
}

/** The newest security events of the last 24 hours, to say what the banner is about. */
export function useRecentSecurity(enabled: boolean) {
  return useQuery({
    ...LIVE,
    enabled,
    queryKey: ["audit-logs", "security", "1d"],
    queryFn: async () => (await api<CursorPage<unknown>>("/audit/logs", { query: { limit: 20, range: "1d", categories: "Security" } })).items.map(toEvent),
  });
}

type Member = { id: string; status: string; lastLoginAt: string | null };

/** Active admins and how many signed in today; null without MANAGE_ADMINS. */
export function useAdminActivity(enabled: boolean) {
  return useQuery({
    ...LIVE,
    refetchInterval: 60_000,
    enabled,
    queryKey: ["audit-logs", "admins"],
    queryFn: async () => {
      const all: Member[] = [];
      try {
        for (let page = 1; page <= 20; page++) {
          const res = await api<{ items: Member[]; total: number }>("/admin-portal/team/members", { query: { page, pageSize: 100 }, expectedStatuses: [403] });
          all.push(...res.items);
          if (all.length >= res.total || res.items.length < 100) break;
        }
      } catch (e) {
        if (e instanceof ApiError && e.status === 403) return null;
        throw e;
      }
      const today = new Date().toDateString();
      const active = all.filter((m) => m.status === "Active");
      return { active: active.length, today: active.filter((m) => m.lastLoginAt && new Date(m.lastLoginAt).toDateString() === today).length };
    },
  });
}

/** Starts the backend export of the filtered log; the backend emails the file to the requester and the super admin. */
export async function requestExport(f: ServerFilters) {
  return api<{ jobId: string }>("/audit/logs/export", { method: "POST", query: toQuery(f) });
}
