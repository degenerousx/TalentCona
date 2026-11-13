import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { api, ApiError } from "@/lib/api";
import { toEvent, type AuditEvent } from "./model";

/**
 * Audit & System Logs ↔ backend.
 *   GET /audit/logs?cursor=&limit=&actorUserId=&entityType=&action=   (VIEW_AUDIT_LOG)
 *   GET /admin-portal/team/members?page=&pageSize=                      (MANAGE_ADMINS, for "Active administrators")
 * The log has no total, search, role or module filter, so the page reads the
 * newest events in pages of 100 and filters what it has loaded.
 */

type CursorPage<T> = { items: T[]; limit?: number; hasNext?: boolean; nextCursor?: string | null };

const LIVE = { staleTime: 0, refetchOnWindowFocus: true, refetchInterval: 30_000 } as const;
export const PAGE = 100;

export type ServerFilters = { actorUserId?: string; entityType?: string; action?: string };

/** The newest events, page by page (Next loads more when the filtered list runs out). */
export function useAuditLog(server: ServerFilters = {}) {
  return useInfiniteQuery({
    ...LIVE,
    queryKey: ["audit-logs", "list", server],
    initialPageParam: null as string | null,
    queryFn: async ({ pageParam }) => {
      const page = await api<CursorPage<unknown>>("/audit/logs", { query: { limit: PAGE, cursor: pageParam, ...server } });
      return { items: page.items.map(toEvent), hasNext: !!page.hasNext && !!page.nextCursor, nextCursor: page.nextCursor ?? null };
    },
    getNextPageParam: (last) => (last.hasNext ? last.nextCursor : null),
  });
}

/** Every event in the last 24 hours (up to 2,000), for the stat cards and the security banner. */
export function useRecentEvents() {
  return useQuery({
    ...LIVE,
    queryKey: ["audit-logs", "recent"],
    queryFn: async () => {
      const since = Date.now() - 24 * 3_600_000;
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);
      const cutoff = Math.min(since, startOfToday.getTime());
      const out: AuditEvent[] = [];
      let cursor: string | null = null;
      let capped = false;
      for (let i = 0; i < 20; i++) {
        const page: CursorPage<unknown> = await api<CursorPage<unknown>>("/audit/logs", { query: { limit: PAGE, cursor } });
        const events = page.items.map(toEvent);
        out.push(...events);
        const oldest = events.at(-1)?.at;
        if (!page.hasNext || !page.nextCursor || (oldest && new Date(oldest).getTime() < cutoff)) break;
        cursor = page.nextCursor;
        if (i === 19) capped = true;
      }
      return { events: out.filter((e) => e.at && new Date(e.at).getTime() >= cutoff), capped, since, startOfToday: startOfToday.getTime() };
    },
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

/** Up to 5,000 newest events, for Export audit log. */
export async function fetchForExport(server: ServerFilters = {}) {
  const out: AuditEvent[] = [];
  let cursor: string | null = null;
  for (let i = 0; i < 50; i++) {
    const page: CursorPage<unknown> = await api<CursorPage<unknown>>("/audit/logs", { query: { limit: PAGE, cursor, ...server } });
    out.push(...page.items.map(toEvent));
    if (!page.hasNext || !page.nextCursor) break;
    cursor = page.nextCursor;
  }
  return out;
}
