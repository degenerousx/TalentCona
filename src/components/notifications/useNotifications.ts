"use client";

import { useQueries } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useCurrentAdmin } from "@/lib/currentAdmin";
import { can } from "@/lib/permissions";
import { isMfaComplete, useSession } from "@/lib/session";
import { SOURCES, type AppNotification } from "./sources";

/** How often sources are re-read while the portal is open (plus on tab focus). */
export const POLL_MS = 30_000;
const MAX_ITEMS = 50;
/** On first use, older activity starts as read so the badge isn't flooded with history. */
const FIRST_USE_WINDOW_MS = 7 * 24 * 3_600_000;

// ---- Read state ----------------------------------------------------------------
// The backend has nowhere to store "read", so it lives in this browser, per admin.

type ReadState = { since: number; read: string[] };

const storageKey = (adminId: string | null) => `tc-notifications:${adminId ?? "me"}`;
const READ_EVENT = "tc-notifications-read";

function loadState(adminId: string | null): ReadState {
  try {
    const raw = localStorage.getItem(storageKey(adminId));
    if (raw) {
      const parsed = JSON.parse(raw) as ReadState;
      if (typeof parsed.since === "number" && Array.isArray(parsed.read)) return parsed;
    }
  } catch {
    // Private mode / blocked storage: fall through to a fresh state.
  }
  const fresh = { since: Date.now() - FIRST_USE_WINDOW_MS, read: [] };
  saveState(adminId, fresh);
  return fresh;
}

function saveState(adminId: string | null, state: ReadState) {
  try {
    // Keep the newest ids only; old ones have long left every source.
    localStorage.setItem(storageKey(adminId), JSON.stringify({ ...state, read: state.read.slice(-500) }));
  } catch {
    // Read state just won't persist.
  }
  if (typeof window !== "undefined") window.dispatchEvent(new Event(READ_EVENT));
}

const timeOf = (n: AppNotification) => (n.at ? new Date(n.at).getTime() : 0);

export type NotificationsState = {
  items: (AppNotification & { unread: boolean })[];
  unreadCount: number;
  loading: boolean;
  /** Sources that failed on their last read (others still show). */
  failed: string[];
  markRead: (id: string) => void;
  markAllRead: () => void;
  refresh: () => void;
};

export function useNotifications(): NotificationsState {
  const session = useSession();
  const { id: adminId } = useCurrentAdmin();
  const ready = isMfaComplete(session);
  const sources = SOURCES.filter((s) => s.privileges.some((p) => can(session, p)));

  const results = useQueries({
    queries: sources.map((s) => ({
      queryKey: ["notifications", s.key, adminId],
      queryFn: () => s.fetch({ adminId }),
      enabled: ready,
      staleTime: 0,
      refetchInterval: POLL_MS,
      refetchIntervalInBackground: false,
      refetchOnWindowFocus: true,
      retry: 1,
    })),
  });

  const [state, setState] = useState<ReadState | null>(null);
  useEffect(() => {
    const sync = () => setState(loadState(adminId));
    sync();
    // Other tabs (storage) and other bells in this tab (READ_EVENT) stay in step.
    window.addEventListener("storage", sync);
    window.addEventListener(READ_EVENT, sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener(READ_EVENT, sync);
    };
  }, [adminId]);

  const dataKey = results.map((r) => r.dataUpdatedAt).join(",");
  const items = useMemo(() => {
    const read = new Set(state?.read ?? []);
    const since = state?.since ?? 0;
    const seen = new Set<string>();
    const all: (AppNotification & { unread: boolean })[] = [];
    for (const r of results) {
      for (const n of r.data ?? []) {
        if (seen.has(n.id)) continue;
        seen.add(n.id);
        all.push({ ...n, unread: !read.has(n.id) && (n.at === null || timeOf(n) > since) });
      }
    }
    return all.sort((a, b) => timeOf(b) - timeOf(a)).slice(0, MAX_ITEMS);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataKey, state]);

  const markRead = useCallback(
    (id: string) => {
      const current = loadState(adminId);
      if (!current.read.includes(id)) saveState(adminId, { ...current, read: [...current.read, id] });
    },
    [adminId],
  );

  const markAllRead = useCallback(() => {
    const current = loadState(adminId);
    // Only what is shown: something that arrives on the next poll is still new.
    saveState(adminId, { ...current, read: [...new Set([...current.read, ...items.map((n) => n.id)])] });
  }, [adminId, items]);

  const refresh = useCallback(() => results.forEach((r) => void r.refetch()), [results]);

  return {
    items,
    unreadCount: items.filter((n) => n.unread).length,
    loading: results.some((r) => r.isPending && r.fetchStatus !== "idle"),
    failed: sources.filter((_, i) => results[i]?.isError).map((s) => s.label),
    markRead,
    markAllRead,
    refresh,
  };
}
