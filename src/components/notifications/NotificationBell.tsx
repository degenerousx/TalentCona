"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Banknote, Bell, BellOff, BellRing, CheckCheck, GraduationCap, MessageSquare, RotateCw, ShieldCheck, ShieldUser, UserPlus } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/shadcn/popover";
import { Icon } from "@/components/layout/AppIcon";
import { cn } from "@/lib/cn";
import { useCurrentAdmin } from "@/lib/currentAdmin";
import { disablePush, enablePush, usePush } from "@/lib/push";
import { goTo, resolveTarget } from "./links";
import { ago, dateTime, kindOf, useMarkAllRead, useMarkRead, useNotificationList, type AppNotification, type NotificationKind } from "./api";

const KIND: Record<NotificationKind, { Icon: typeof Bell; tone: string }> = {
  student: { Icon: UserPlus, tone: "bg-blue-50 text-blue-600" },
  mentor: { Icon: GraduationCap, tone: "bg-purple-50 text-purple-600" },
  admin: { Icon: ShieldUser, tone: "bg-indigo-50 text-indigo-600" },
  money: { Icon: Banknote, tone: "bg-emerald-50 text-emerald-600" },
  message: { Icon: MessageSquare, tone: "bg-sky-50 text-sky-600" },
  security: { Icon: ShieldCheck, tone: "bg-orange-50 text-orange-600" },
  other: { Icon: Bell, tone: "bg-slate-100 text-slate-600" },
};

/** Header bell: unread badge (GET /notifications/unread-count) and the admin's notifications. */
export default function NotificationBell() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [onlyUnread, setOnlyUnread] = useState(false);
  const n = useNotificationList();
  const markRead = useMarkRead();
  const markAll = useMarkAllRead();
  const shown = onlyUnread ? n.items.filter((i) => !i.readAt) : n.items;
  const badge = n.unreadCount > 99 ? "99+" : String(n.unreadCount);

  const onOpenChange = (next: boolean) => {
    setOpen(next);
    if (next) void n.refetch();
  };

  /** The item whose target is being looked up. */
  const [opening, setOpening] = useState<string | null>(null);
  const [noTarget, setNoTarget] = useState<string | null>(null);

  /** Mark read, then open the record or page it's about (see links.ts). */
  const openItem = async (item: AppNotification) => {
    if (!item.readAt) markRead.mutate(item.id);
    setNoTarget(null);
    setOpening(item.id);
    const target = await resolveTarget(item);
    setOpening(null);
    if (!target) {
      setNoTarget(item.id);
      return;
    }
    setOpen(false);
    goTo(target, router);
  };

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
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
        collisionPadding={12}
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
              onClick={() => void n.refetch()}
              aria-label="Refresh notifications"
              className="grid size-8 place-items-center rounded-md text-slate-500 hover:bg-slate-100"
            >
              <RotateCw aria-hidden className={cn("size-4", n.isFetching && "animate-spin")} />
            </button>
            <button
              type="button"
              onClick={() => markAll.mutate()}
              disabled={!n.unreadCount || markAll.isPending}
              className="flex h-8 items-center gap-1 rounded-md px-2 text-xs font-medium text-primary hover:bg-primary-soft disabled:text-slate-400 disabled:hover:bg-transparent"
            >
              <CheckCheck aria-hidden className="size-4" />
              Mark all as read
            </button>
          </div>
        </div>

        <div className="flex gap-1 border-b border-slate-100 px-4 py-2" role="tablist" aria-label="Notification filter">
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

        {(markRead.isError || markAll.isError) && (
          <p role="alert" className="border-b border-red-100 bg-red-50 px-4 py-2 text-xs text-red-700">
            Couldn&apos;t mark {markAll.isError ? "all notifications" : "the notification"} as read. Please try again.
          </p>
        )}

        <ul className="max-h-[420px] overflow-y-auto py-2" aria-label="Latest notifications">
          {n.isPending && n.fetchStatus !== "idle" && <li className="px-4 py-8 text-center text-sm text-slate-500">Loading notifications…</li>}
          {n.isError && !n.items.length && (
            <li className="px-4 py-8 text-center text-sm text-slate-500">
              Couldn&apos;t load notifications.{" "}
              <button type="button" onClick={() => void n.refetch()} className="font-medium text-primary hover:underline">
                Try again
              </button>
            </li>
          )}
          {n.isSuccess && shown.length === 0 && (
            <li className="px-4 py-8 text-center text-sm text-slate-500">{onlyUnread ? "No unread notifications." : "No notifications yet."}</li>
          )}
          {shown.map((item) => {
            const { Icon: KindIcon, tone } = KIND[kindOf(item.type)];
            const unread = !item.readAt;
            return (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => void openItem(item)}
                  disabled={opening !== null}
                  aria-busy={opening === item.id}
                  className={cn("flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-slate-50 disabled:cursor-wait", unread && "bg-primary-soft/40")}
                  aria-label={`${unread ? "Unread: " : ""}${item.title}${item.body ? `. ${item.body}` : ""}`}
                >
                  <span className={cn("grid size-8 shrink-0 place-items-center rounded-full", tone)}>
                    <KindIcon aria-hidden className="size-4" />
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className={cn("text-sm leading-5 text-slate-900", unread ? "font-semibold" : "font-medium")}>{item.title}</span>
                    {item.body && <span className="text-xs leading-4 text-slate-600">{item.body}</span>}
                    <time dateTime={item.createdAt} className="text-[11px] leading-4 text-slate-400" title={dateTime(item.createdAt)}>
                      {dateTime(item.createdAt)} · {ago(item.createdAt)}
                    </time>
                    {opening === item.id && <span className="text-[11px] leading-4 text-primary">Opening…</span>}
                    {noTarget === item.id && <span className="text-[11px] leading-4 text-slate-500">Nothing to open for this notification.</span>}
                  </span>
                  {unread && <span aria-hidden className="mt-1.5 size-2 shrink-0 rounded-full bg-primary" />}
                </button>
              </li>
            );
          })}
          {n.hasNextPage && (
            <li className="px-4 pt-1 pb-2 text-center">
              <button
                type="button"
                onClick={() => void n.fetchNextPage()}
                disabled={n.isFetchingNextPage}
                className="h-8 rounded-md px-3 text-xs font-medium text-primary hover:bg-primary-soft disabled:text-slate-400"
              >
                {n.isFetchingNextPage ? "Loading…" : "Load older notifications"}
              </button>
            </li>
          )}
        </ul>

        <DesktopNotifications />
      </PopoverContent>
    </Popover>
  );
}

/** Footer setting: turn browser push on or off for this browser. */
function DesktopNotifications() {
  const push = usePush();
  const { id: adminId } = useCurrentAdmin();
  if (push.status === "unsupported") return null;
  const text =
    push.status === "on"
      ? "Desktop notifications are on in this browser."
      : push.status === "denied"
        ? "Desktop notifications are blocked. Allow them for this site in your browser settings."
        : "Get desktop notifications, even when the portal isn't open.";
  return (
    <div className="flex items-center justify-between gap-3 border-t border-slate-100 px-4 py-2.5">
      <p className="flex min-w-0 items-center gap-2 text-xs text-slate-600">
        {push.status === "on" ? (
          <BellRing aria-hidden className="size-4 shrink-0 text-primary" />
        ) : (
          <BellOff aria-hidden className="size-4 shrink-0 text-slate-400" />
        )}
        <span>
          {text}
          {push.error && <span className="block text-red-600">{push.error}</span>}
        </span>
      </p>
      {push.status !== "denied" && (
        <button
          type="button"
          disabled={push.busy}
          onClick={() => void (push.status === "on" ? disablePush(adminId) : enablePush(adminId))}
          className="h-7 shrink-0 rounded-md px-2 text-xs font-medium text-primary hover:bg-primary-soft disabled:text-slate-400"
        >
          {push.busy ? "Please wait…" : push.status === "on" ? "Turn off" : "Turn on"}
        </button>
      )}
    </div>
  );
}
