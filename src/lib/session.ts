"use client";

import { useSyncExternalStore } from "react";

/**
 * The signed-in admin's session, held in memory only — never localStorage,
 * which any script on the page can read. A reload loses it; the admin layout
 * gets a new access token from /auth/refresh (HttpOnly cookie) on start.
 */

/** Claims read from the access token. For UI decisions only — the backend verifies the token. */
export type TokenClaims = {
  sub?: string;
  exp?: number;
  /** "pending_mfa_verify" right after login, "complete" after MFA. */
  adminMfa?: string;
  mfaStepUpAt?: number;
  [claim: string]: unknown;
};

export type AdminInfo = {
  isSuperAdmin: boolean;
  privileges: string[];
};

export type Session = {
  accessToken: string;
  claims: TokenClaims;
  /** From the login, MFA and refresh responses; kept when a response omits it (step-up). */
  admin?: AdminInfo;
};

let session: Session | null = null;
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

export function decodeClaims(token: string): TokenClaims {
  try {
    const payload = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(payload));
  } catch {
    return {};
  }
}

export function getSession() {
  return session;
}

export function getAccessToken() {
  return session?.accessToken ?? null;
}

/** Store a newly issued token. Keeps the known admin info unless the new response carries its own. */
export function setAccessToken(accessToken: string, admin?: AdminInfo) {
  session = { accessToken, claims: decodeClaims(accessToken), admin: admin ?? session?.admin };
  emit();
}

export function clearSession() {
  session = null;
  emit();
}

/** True once MFA is done — the only state admin endpoints accept. */
export function isMfaComplete(s: Session | null) {
  return s?.claims.adminMfa === "complete";
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useSession() {
  return useSyncExternalStore(subscribe, getSession, () => null);
}
