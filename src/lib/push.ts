"use client";

import { useSyncExternalStore } from "react";
import { api } from "./api";

/**
 * Web push (browser/desktop notifications) ↔ backend (Postman: "notifications / Web Push"):
 *   GET    /notifications/web-push/vapid-public-key   { publicKey }
 *   POST   /notifications/web-push/subscribe          { endpoint, keys: { p256dh, auth }, userAgent }
 *   DELETE /notifications/web-push/subscribe          { endpoint }
 *
 * Flow: register /sw.js on load → ask permission (after a click, which every
 * browser allows) → fetch the VAPID key → subscribe with the browser → save the
 * subscription on TalentCona. The service worker shows each push and tells open
 * tabs to refresh the bell.
 */

const PATH = "/notifications/web-push/subscribe";

export type PushStatus =
  /** No service worker / Push API (e.g. iOS Safari outside an installed app). */
  | "unsupported"
  /** Not asked yet. */
  | "default"
  /** The admin (or the browser) blocked notifications for this site. */
  | "denied"
  /** Allowed, but this browser isn't subscribed (the admin turned it off, or it's being set up). */
  | "off"
  | "on";

type State = { status: PushStatus; busy: boolean; error: string | null };

let state: State = { status: "unsupported", busy: false, error: null };
const listeners = new Set<() => void>();
const set = (patch: Partial<State>) => {
  state = { ...state, ...patch };
  for (const l of listeners) l();
};

export function pushSupported() {
  return typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
}

// ---- The admin's choice in this browser ---------------------------------------
// "Turn off" is remembered so signing in again doesn't silently re-subscribe.
const OPT_OUT = (adminId: string | null) => `tc-push-off:${adminId ?? "me"}`;
const readOptOut = (adminId: string | null) => {
  try {
    return localStorage.getItem(OPT_OUT(adminId)) === "1";
  } catch {
    return false;
  }
};
const writeOptOut = (adminId: string | null, off: boolean) => {
  try {
    if (off) localStorage.setItem(OPT_OUT(adminId), "1");
    else localStorage.removeItem(OPT_OUT(adminId));
  } catch {
    // Storage blocked: the choice just won't be remembered.
  }
};
const DISMISSED = "tc-push-prompt-dismissed";
export function promptDismissed() {
  try {
    return localStorage.getItem(DISMISSED) === "1";
  } catch {
    return false;
  }
}
export function dismissPrompt() {
  try {
    localStorage.setItem(DISMISSED, "1");
  } catch {
    // ignore
  }
}

// ---- Browser plumbing ---------------------------------------------------------

/** VAPID keys are base64url; PushManager wants the raw bytes. */
function keyBytes(base64url: string) {
  const b64 = (base64url + "=".repeat((4 - (base64url.length % 4)) % 4)).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(b64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

function sameKey(current: ArrayBuffer | null | undefined, wanted: Uint8Array) {
  if (!current) return false;
  const a = new Uint8Array(current);
  return a.length === wanted.length && a.every((b, i) => b === wanted[i]);
}

/** Registers /sw.js (scope "/"). Safe to call repeatedly. */
export async function registerServiceWorker() {
  if (!pushSupported()) return null;
  try {
    return await navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" });
  } catch (e) {
    console.error("[push] service worker registration failed", e);
    return null;
  }
}

async function currentSubscription() {
  const reg = await navigator.serviceWorker.getRegistration("/");
  return (await reg?.pushManager.getSubscription()) ?? null;
}

/** VAPID key → browser subscription (reused when it already matches) → saved on TalentCona. */
async function subscribe() {
  const reg = (await registerServiceWorker()) && (await navigator.serviceWorker.ready);
  if (!reg) throw new Error("Couldn't start the notification service in this browser.");
  const { publicKey } = await api<{ publicKey: string }>("/notifications/web-push/vapid-public-key");
  const appKey = keyBytes(publicKey);
  let sub = await reg.pushManager.getSubscription();
  // A subscription made with an old server key can't receive pushes: replace it.
  if (sub && !sameKey(sub.options.applicationServerKey, appKey)) {
    await sub.unsubscribe().catch(() => {});
    sub = null;
  }
  sub ??= await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: appKey });
  const json = sub.toJSON();
  await api(PATH, {
    method: "POST",
    body: { endpoint: sub.endpoint, keys: { p256dh: json.keys?.p256dh, auth: json.keys?.auth }, userAgent: navigator.userAgent },
  });
  return sub;
}

/** Removes the subscription on TalentCona, then in the browser. */
async function unsubscribe() {
  const sub = await currentSubscription();
  if (!sub) return;
  try {
    await api(PATH, { method: "DELETE", body: { endpoint: sub.endpoint } });
  } finally {
    await sub.unsubscribe().catch(() => {});
  }
}

/** Browser errors (e.g. private windows, which have no push service) read as such; API errors as the server says. */
const message = (e: unknown) =>
  e instanceof DOMException
    ? "This browser couldn't set up desktop notifications (private windows don't support them)."
    : e instanceof Error
      ? e.message
      : "Something went wrong.";

// ---- What the UI calls ----------------------------------------------------------

/** On app load (signed in): register the worker, read the status, and keep an allowed browser subscribed. */
export async function initPush(adminId: string | null) {
  if (!pushSupported()) return set({ status: "unsupported" });
  await registerServiceWorker();
  const permission = Notification.permission;
  if (permission !== "granted") return set({ status: permission === "denied" ? "denied" : "default" });
  if (readOptOut(adminId)) return set({ status: (await currentSubscription()) ? "on" : "off" });
  // Allowed and not turned off: (re)save so TalentCona has this browser for the admin signed in now.
  set({ busy: true, error: null });
  try {
    await subscribe();
    set({ status: "on", busy: false });
  } catch (e) {
    set({ status: "off", busy: false, error: message(e) });
  }
}

/** "Turn on": asks permission (must run from a click), then subscribes. */
export async function enablePush(adminId: string | null) {
  if (!pushSupported()) return;
  set({ busy: true, error: null });
  try {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") return set({ status: permission === "denied" ? "denied" : "default", busy: false });
    writeOptOut(adminId, false);
    await subscribe();
    set({ status: "on", busy: false });
  } catch (e) {
    set({ status: Notification.permission === "granted" ? "off" : "default", busy: false, error: message(e) });
  }
}

/** "Turn off" (settings): unsubscribes this browser and remembers the choice. */
export async function disablePush(adminId: string | null) {
  set({ busy: true, error: null });
  try {
    await unsubscribe();
    writeOptOut(adminId, true);
    set({ status: "off", busy: false });
  } catch (e) {
    set({ busy: false, error: message(e) });
  }
}

/**
 * Sign-out: stop pushes for the admin leaving (best effort, ≤3 s) so the next
 * person on this browser doesn't get them. Their "on" choice is kept, so the
 * browser re-subscribes when someone signs in again.
 */
export async function forgetPushOnSignOut() {
  if (!pushSupported()) return;
  try {
    await Promise.race([unsubscribe(), new Promise((r) => setTimeout(r, 3000))]);
  } catch {
    // The backend drops subscriptions the browser no longer accepts.
  }
  set({ status: Notification.permission === "granted" ? "off" : state.status });
}

function subscribeStore(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}
const SERVER: State = { status: "unsupported", busy: false, error: null };
export function usePush() {
  return useSyncExternalStore(
    subscribeStore,
    () => state,
    () => SERVER,
  );
}
