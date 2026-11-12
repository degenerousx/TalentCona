"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Activity, Banknote, Briefcase, CheckCheck, GraduationCap, HandCoins, RotateCw, ShieldUser, UserPlus } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/shadcn/popover";
import { Icon } from "@/components/layout/AppIcon";
import { cn } from "@/lib/cn";
import type { NotificationKind } from "./sources";
import { useNotifications } from "./useNotifications";

const KIND: Record<NotificationKind, { Icon: typeof Activity; tone: string }> = {
  student: { Icon: UserPlus, tone: "bg-blue-50 text-blue-600" },
  mentor: { Icon: GraduationCap, tone: "bg-purple-50 text-purple-600" },
  admin: { Icon: ShieldUser, tone: "bg-indigo-50 text-indigo-600" },
  payout: { Icon: HandCoins, tone: "bg-emerald-50 text-emerald-600" },
  loan: { Icon: Banknote, tone: "bg-orange-50 text-orange-600" },
  talent: { Icon: Briefcase, tone: "bg-pink-50 text-pink-600" },
  activity: { Icon: Activity, tone: "bg-slate-100 text-slate-600" },
};

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

/** Header bell: unread badge, and a dropdown of the latest activity. */
export default function NotificationBell() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [onlyUnread, setOnlyUnread] = useState(false);
  const n = useNotifications();
  const shown = onlyUnread ? n.items.filter((i) => i.unread) : n.items;
  const badge = n.unreadCount > 99 ? "99+" : String(n.unreadCount);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={n.unreadCount ? `Notifications, ${n.unreadCount} unread` : "Notifications"}
          className="relative grid size-9 place-items-center rounded-full text-slate-900 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-primary"
        >
          <Icon icon="mdi:bell-outline" className="size-6" />
          {n.unreadCount > 0 && (
            <span
              data-testid="notification-count"
              className="absolute -top-0.5 -right-0.5 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-red-600 px-1 text-[10px] leading-none font-semibold text-white ring-2 ring-white"
            >
              {badge}
            </span>
          )}
        </button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        sideOffset={10}
        aria-label="Notifications"
        className="w-[400px] max-w-[calc(100vw-24px)] p-0 focus:outline-none"
        // Focus the panel, not its first button, so nothing looks pre-selected.
        onOpenAutoFocus={(e) => {
          e.preventDefault();
          (e.currentTarget as HTMLElement | null)?.focus();
        }}
      >
        <div className="flex items-center justify-between gap-2 border-b border-slate-100 px-4 py-3">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Notifications</h2>
            <p className="text-xs text-slate-500">{n.unreadCount ? `${n.unreadCount} unread` : "You're all caught up"}</p>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={n.refresh}
              aria-label="Refresh notifications"
              className="grid size-8 place-items-center rounded-md text-slate-500 hover:bg-slate-100"
            >
              <RotateCw aria-hidden className="size-4" />
            </button>
            <button
              type="button"
              onClick={n.markAllRead}
              disabled={!n.unreadCount}
              className="flex h-8 items-center gap-1 rounded-md px-2 text-xs font-medium text-primary hover:bg-primary-soft disabled:text-slate-400 disabled:hover:bg-transparent"
            >
              <CheckCheck aria-hidden className="size-4" />
              Mark all as read
            </button>
          </div>
        </div>

        <div className="flex gap-1 px-4 pt-2" role="tablist" aria-label="Notification filter">
          {[
            { id: false, label: "All" },
            { id: true, label: `Unread${n.unreadCount ? ` (${n.unreadCount})` : ""}` },
          ].map((t) => (
            <button
              key={String(t.id)}
              type="button"
              role="tab"
              aria-selected={onlyUnread === t.id}
              onClick={() => setOnlyUnread(t.id)}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-medium",
                onlyUnread === t.id ? "bg-primary text-white" : "text-slate-600 hover:bg-slate-100",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        <ul className="max-h-[420px] overflow-y-auto py-2" aria-label="Latest notifications">
          {n.loading && !n.items.length && <li className="px-4 py-8 text-center text-sm text-slate-500">Loading notifications…</li>}
          {!n.loading && shown.length === 0 && (
            <li className="px-4 py-8 text-center text-sm text-slate-500">{onlyUnread ? "No unread notifications." : "No activity to show yet."}</li>
          )}
          {shown.map((item) => {
            const { Icon: KindIcon, tone } = KIND[item.kind];
            return (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => {
                    n.markRead(item.id);
                    if (item.href) {
                      setOpen(false);
                      router.push(item.href);
                    }
                  }}
                  className={cn("flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-slate-50", item.unread && "bg-primary-soft/40")}
                  aria-label={`${item.unread ? "Unread: " : ""}${item.title}. ${item.description}`}
                >
                  <span className={cn("grid size-8 shrink-0 place-items-center rounded-full", tone)}>
                    <KindIcon aria-hidden className="size-4" />
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className={cn("text-sm leading-5 text-slate-900", item.unread ? "font-semibold" : "font-medium")}>{item.title}</span>
                    <span className="text-xs leading-4 text-slate-600">{item.description}</span>
                    {item.at && (
                      <time dateTime={item.at} className="text-[11px] leading-4 text-slate-400" title={dateTime(item.at)}>
                        {dateTime(item.at)} · {ago(item.at)}
                      </time>
                    )}
                  </span>
                  {item.unread && <span aria-hidden className="mt-1.5 size-2 shrink-0 rounded-full bg-primary" />}
                </button>
              </li>
            );
          })}
        </ul>

        {n.failed.length > 0 && (
          <p role="status" className="border-t border-slate-100 px-4 py-2 text-xs text-amber-700">
            Couldn&apos;t load: {n.failed.join(", ")}. Retrying automatically.
          </p>
        )}
      </PopoverContent>
    </Popover>
  );
}
