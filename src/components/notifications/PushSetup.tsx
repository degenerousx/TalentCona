"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { BellRing, X } from "lucide-react";
import { useCurrentAdmin } from "@/lib/currentAdmin";
import { dismissPrompt, enablePush, initPush, promptDismissed, usePush } from "@/lib/push";
import { isMfaComplete, useSession } from "@/lib/session";
import { useMarkRead, useRefreshNotifications } from "./api";

/**
 * Mounted once in the admin shell. On load it registers the service worker
 * and keeps an allowed browser subscribed for the signed-in admin; it
 * refreshes the bell when a push arrives and opens a clicked push in-app.
 * The first time, it offers to turn desktop notifications on (the browser's
 * permission prompt needs a click to show everywhere).
 */
export default function PushSetup() {
  const router = useRouter();
  const session = useSession();
  const { id: adminId } = useCurrentAdmin();
  const ready = isMfaComplete(session);
  const push = usePush();
  const refresh = useRefreshNotifications();
  const { mutate: markRead } = useMarkRead();
  const [dismissed, setDismissed] = useState(promptDismissed);

  useEffect(() => {
    if (ready && adminId) void initPush(adminId);
  }, [ready, adminId]);

  // Messages from public/sw.js.
  useEffect(() => {
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
    const onMessage = (e: MessageEvent) => {
      const msg = e.data as { type?: string; id?: string | null; url?: string } | null;
      if (msg?.type === "tc:notification") void refresh();
      if (msg?.type === "tc:open") {
        if (msg.id) markRead(msg.id);
        if (msg.url) router.push(msg.url);
      }
    };
    navigator.serviceWorker.addEventListener("message", onMessage);
    return () => navigator.serviceWorker.removeEventListener("message", onMessage);
  }, [refresh, markRead, router]);

  if (!ready || dismissed || push.status !== "default") return null;

  const close = () => {
    dismissPrompt();
    setDismissed(true);
  };

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-labelledby="push-prompt-title"
      className="fixed right-4 bottom-4 z-50 w-[340px] max-w-[calc(100vw-32px)] rounded-xl border border-slate-200 bg-white p-4 shadow-lg"
    >
      <div className="flex items-start gap-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-primary-soft text-primary">
          <BellRing aria-hidden className="size-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p id="push-prompt-title" className="text-sm font-semibold text-slate-900">
            Turn on desktop notifications?
          </p>
          <p className="mt-0.5 text-xs leading-4 text-slate-600">Get alerted about new activity even when the portal isn&apos;t open.</p>
          {push.error && <p className="mt-1 text-xs text-red-600">{push.error}</p>}
          <div className="mt-3 flex justify-end gap-2">
            <button type="button" onClick={close} className="h-8 rounded-md px-3 text-xs font-medium text-slate-600 hover:bg-slate-100">
              Not now
            </button>
            <button
              type="button"
              disabled={push.busy}
              onClick={async () => {
                await enablePush(adminId);
                // Done either way: allowed, or the browser's own prompt was answered/blocked.
                close();
              }}
              className="h-8 rounded-md bg-primary px-3 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-60"
            >
              {push.busy ? "Turning on…" : "Turn on"}
            </button>
          </div>
        </div>
        <button type="button" onClick={close} aria-label="Dismiss" className="grid size-6 place-items-center rounded text-slate-400 hover:bg-slate-100">
          <X aria-hidden className="size-4" />
        </button>
      </div>
    </div>
  );
}
