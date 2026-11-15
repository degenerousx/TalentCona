"use client";

import { useInfiniteQuery, useMutation, useQuery, useQueryClient, type InfiniteData, type QueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useRef } from "react";
import { api } from "@/lib/api";
import { useCurrentAdmin } from "@/lib/currentAdmin";
import { isMfaComplete, useSession } from "@/lib/session";

/**
 * In-app notifications ↔ backend (Postman: "notifications"):
 *   GET   /notifications?limit=&cursor=          the signed-in admin's notifications, newest first
 *   GET   /notifications/unread-count            { count }
 *   PATCH /notifications/:notificationId/read    marks one read, returns it
 *   POST  /notifications/read-all                { updatedCount }
 */

export type AppNotification = {
  id: string;
  type: string;
  title: string;
  body: string | null;
  /** Free-form; `data.url` is where clicking the notification goes. */
  data: Record<string, unknown> | null;
  readAt: string | null;
  createdAt: string;
};

type Page = { items: AppNotification[]; limit: number; hasNext: boolean; nextCursor: string | null };

/** Bell badge refresh while the tab is visible (TanStack pauses it in hidden tabs). */
export const POLL_MS = 30_000;
const PAGE = 20;

const key = {
  all: (adminId: string | null) => ["notifications", adminId] as const,
  count: (adminId: string | null) => ["notifications", adminId, "unread-count"] as const,
  list: (adminId: string | null) => ["notifications", adminId, "list"] as const,
};

/** Where clicking goes: an in-portal path (router) or another site (new tab). */
export function targetOf(n: Pick<AppNotification, "data">): { href: string; external: boolean } | null {
  const raw = n.data?.url;
  if (typeof raw !== "string" || !raw.trim()) return null;
  const url = raw.trim();
  if (url.startsWith("/") && !url.startsWith("//")) return { href: url, external: false };
  try {
    const u = new URL(url);
    if (typeof window !== "undefined" && u.origin === window.location.origin) return { href: u.pathname + u.search + u.hash, external: false };
    return u.protocol === "https:" || u.protocol === "http:" ? { href: u.href, external: true } : null;
  } catch {
    return null;
  }
}

export type NotificationKind = "student" | "mentor" | "admin" | "money" | "message" | "security" | "other";

/** Groups a backend `type` (e.g. PASSWORD_CHANGED, ADMIN_STUDENT_MESSAGE) for its icon. */
export function kindOf(type: string): NotificationKind {
  const t = type.toUpperCase();
  if (/PASSWORD|MFA|LOGIN|SECURITY|SESSION|OTP/.test(t)) return "security";
  if (/MESSAGE|CHAT/.test(t)) return "message";
  if (/LOAN|PAYMENT|PAYOUT|WITHDRAW|REFUND|WALLET|REPAYMENT|INVOICE/.test(t)) return "money";
  if (/MENTOR/.test(t)) return "mentor";
  if (/STUDENT|ENROL/.test(t)) return "student";
  if (/ADMIN|INVIT|PRIVILEGE|TEAM/.test(t)) return "admin";
  return "other";
}

/** Who the cache belongs to; nothing is fetched until sign-in (incl. MFA) is complete. */
function useOwner() {
  const session = useSession();
  const { id } = useCurrentAdmin();
  return { adminId: id, ready: isMfaComplete(session) };
}

/** The bell badge: unread count, polled every 30 s while visible and on focus. */
export function useUnreadCount() {
  const { adminId, ready } = useOwner();
  return useQuery({
    queryKey: key.count(adminId),
    queryFn: () => api<{ count: number }>("/notifications/unread-count").then((d) => d?.count ?? 0),
    enabled: ready,
    staleTime: 0,
    refetchOnWindowFocus: true,
    refetchInterval: POLL_MS,
  });
}

/** The newest notifications, page by page. */
export function useNotificationList(enabled = true) {
  const { adminId, ready } = useOwner();
  const qc = useQueryClient();
  const count = useUnreadCount();
  const list = useInfiniteQuery({
    queryKey: key.list(adminId),
    enabled: ready && enabled,
    staleTime: 0,
    refetchOnWindowFocus: true,
    initialPageParam: null as string | null,
    queryFn: ({ pageParam }) => api<Page>("/notifications", { query: { limit: PAGE, cursor: pageParam } }),
    getNextPageParam: (last) => (last.hasNext && last.nextCursor ? last.nextCursor : null),
  });
  // A new unread count means something arrived (or was read elsewhere): re-read the list.
  const lastCount = useRef<number | undefined>(undefined);
  useEffect(() => {
    if (count.data === undefined) return;
    if (lastCount.current !== undefined && lastCount.current !== count.data) void qc.invalidateQueries({ queryKey: key.list(adminId) });
    lastCount.current = count.data;
  }, [count.data, qc, adminId]);
  return { ...list, items: list.data?.pages.flatMap((p) => p.items) ?? [], unreadCount: count.data ?? 0 };
}

type ListData = InfiniteData<Page, string | null>;

function patchList(qc: QueryClient, adminId: string | null, fn: (n: AppNotification) => AppNotification) {
  qc.setQueryData<ListData>(key.list(adminId), (d) => d && { ...d, pages: d.pages.map((p) => ({ ...p, items: p.items.map(fn) })) });
}

/** Mark one read: updates the list and badge at once, then re-reads the count from the server. */
export function useMarkRead() {
  const { adminId } = useOwner();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api<AppNotification>(`/notifications/${encodeURIComponent(id)}/read`, { method: "PATCH" }),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: key.all(adminId) });
      const list = qc.getQueryData<ListData>(key.list(adminId));
      const count = qc.getQueryData<number>(key.count(adminId));
      const wasUnread = list?.pages.some((p) => p.items.some((n) => n.id === id && !n.readAt)) ?? true;
      const now = new Date().toISOString();
      patchList(qc, adminId, (n) => (n.id === id && !n.readAt ? { ...n, readAt: now } : n));
      if (wasUnread && count) qc.setQueryData(key.count(adminId), count - 1);
      return { list, count };
    },
    onSuccess: (saved) => {
      if (saved?.id) patchList(qc, adminId, (n) => (n.id === saved.id ? { ...n, readAt: saved.readAt ?? n.readAt } : n));
    },
    onError: (_e, _id, ctx) => {
      if (ctx?.list) qc.setQueryData(key.list(adminId), ctx.list);
      if (ctx?.count !== undefined) qc.setQueryData(key.count(adminId), ctx.count);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: key.count(adminId) }),
  });
}

/** Mark all read: everything listed shows read and the badge clears, then both are re-read. */
export function useMarkAllRead() {
  const { adminId } = useOwner();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api<{ updatedCount: number }>("/notifications/read-all", { method: "POST" }),
    onMutate: async () => {
      await qc.cancelQueries({ queryKey: key.all(adminId) });
      const list = qc.getQueryData<ListData>(key.list(adminId));
      const count = qc.getQueryData<number>(key.count(adminId));
      const now = new Date().toISOString();
      patchList(qc, adminId, (n) => (n.readAt ? n : { ...n, readAt: now }));
      qc.setQueryData(key.count(adminId), 0);
      return { list, count };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.list) qc.setQueryData(key.list(adminId), ctx.list);
      if (ctx?.count !== undefined) qc.setQueryData(key.count(adminId), ctx.count);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: key.all(adminId) }),
  });
}

/** Re-read the badge and list now (a push arrived, or the admin pressed refresh). */
export function useRefreshNotifications() {
  const { adminId } = useOwner();
  const qc = useQueryClient();
  return useCallback(() => qc.invalidateQueries({ queryKey: key.all(adminId) }), [qc, adminId]);
}

/** "12 Nov 2026, 14:30" */
export function dateTime(iso: string) {
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? ""
    : `${d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}, ${d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}`;
}

/** "Just now", "5 min ago", "3 h ago", "2 days ago". */
export function ago(iso: string) {
  const ms = Date.now() - new Date(iso).getTime();
  if (!Number.isFinite(ms)) return "";
  if (ms < 60_000) return "Just now";
  const m = Math.floor(ms / 60_000);
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} h ago`;
  const d = Math.floor(h / 24);
  return `${d} ${d === 1 ? "day" : "days"} ago`;
}
