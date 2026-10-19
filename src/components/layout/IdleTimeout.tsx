"use client";

import { useEffect } from "react";
import { logout } from "@/lib/auth";

/**
 * Signed out after this long with no mouse, keyboard, touch or scroll activity.
 * 15 minutes, no warning (team decision). NEXT_PUBLIC_IDLE_TIMEOUT_MINUTES
 * shortens it for local testing (e.g. 1) — leave it unset everywhere else.
 */
const IDLE_MS = (Number(process.env.NEXT_PUBLIC_IDLE_TIMEOUT_MINUTES) || 15) * 60_000;
/** How often to check. Browsers slow timers in background tabs; the visibility check covers that. */
const CHECK_EVERY_MS = Math.min(15_000, IDLE_MS / 4);
/** Tell other tabs about activity at most this often. */
const SHARE_EVERY_MS = 10_000;

const ACTIVITY_EVENTS = ["pointerdown", "pointermove", "keydown", "wheel", "touchstart", "scroll"] as const;
const ACTIVITY_CHANNEL = "tc-admin-activity";

/**
 * Idle timeout for the admin portal. Activity in any tab keeps every tab
 * signed in; when all have been idle for 15 minutes, the session ends
 * (server logout + every tab signed out, see logout()). AuthGate then sends
 * the admin to /sign-in?next=… so they come back to the same page.
 *
 * Rendered inside AuthGate, so it only runs while signed in.
 */
export default function IdleTimeout() {
  useEffect(() => {
    let lastActivity = Date.now();
    let lastShared = 0;
    let signingOut = false;

    const channel = typeof BroadcastChannel === "undefined" ? null : new BroadcastChannel(ACTIVITY_CHANNEL);
    if (channel) {
      channel.onmessage = (e: MessageEvent<number>) => {
        if (typeof e.data === "number") lastActivity = Math.max(lastActivity, e.data);
      };
    }

    const onActivity = () => {
      const now = Date.now();
      lastActivity = now;
      if (channel && now - lastShared > SHARE_EVERY_MS) {
        lastShared = now;
        channel.postMessage(now);
      }
    };

    const check = () => {
      if (signingOut || Date.now() - lastActivity < IDLE_MS) return;
      signingOut = true;
      void logout({ idle: true });
    };

    const interval = setInterval(check, CHECK_EVERY_MS);
    // Timers pause while the computer sleeps — check as soon as the tab is seen again.
    document.addEventListener("visibilitychange", check);
    for (const event of ACTIVITY_EVENTS) {
      window.addEventListener(event, onActivity, { passive: true, capture: true });
    }

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", check);
      for (const event of ACTIVITY_EVENTS) {
        window.removeEventListener(event, onActivity, { capture: true });
      }
      channel?.close();
    };
  }, []);

  return null;
}
