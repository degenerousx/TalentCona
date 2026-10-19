import { api, ApiError, refreshAccessToken } from "./api";
import { clearSession, decodeClaims, setAccessToken, type AdminInfo } from "./session";

/**
 * Admin sign-in. MFA is per-admin policy:
 * - MFA not required: login returns a complete session straight away.
 * - MFA required: login returns a token that only permits the MFA step; MFA
 *   verify (or first-time enrolment) returns the complete one.
 * Every access token lasts 15 minutes (pre- and post-MFA, observed on
 * staging); api() refreshes it on 401 using the 7-day HttpOnly refresh cookie.
 */

type LoginResponse = {
  accessToken: string;
  userType: string;
  clientApp: string;
  admin?: Partial<AdminInfo>;
  mfaRequired: boolean;
  mfaChallengeToken?: string;
  /** "verify" when the admin already has an authenticator; anything else means enrol first. */
  mfaChallengePurpose?: string;
};

type MfaCompleteResponse = {
  accessToken: string;
  userType: string;
  clientApp: string;
  admin: AdminInfo;
};

export type MfaChallenge = {
  mode: "verify" | "enroll";
  challengeToken: string;
  /** Pre-MFA expiry (ms since epoch), from the token — after this the admin must sign in again. */
  expiresAt?: number;
};

// The in-progress MFA step, between the sign-in and MFA screens. Memory only:
// a reload sends the admin back to sign in, which is fine for a 15-minute step.
let pendingChallenge: MfaChallenge | null = null;

export function getPendingChallenge() {
  return pendingChallenge;
}

// Set by logout(), cleared by login(). While set, this tab never resumes a
// session from the refresh cookie on its own (sign-in page check, AuthGate on
// reload / Back): if the logout request failed, the cookie may still be valid
// and refreshing would quietly sign the admin back in.
// sessionStorage so it survives a reload of this tab; it holds only a status
// word, no token or personal data.
const SIGNED_OUT_KEY = "tc:signed-out";
type SignOutStatus = "done" | "idle" | "server-unreachable";

function readSignOut(): SignOutStatus | null {
  try {
    return sessionStorage.getItem(SIGNED_OUT_KEY) as SignOutStatus | null;
  } catch {
    return null; // Storage blocked, or running on the server.
  }
}

function writeSignOut(status: SignOutStatus | null) {
  try {
    if (status) sessionStorage.setItem(SIGNED_OUT_KEY, status);
    else sessionStorage.removeItem(SIGNED_OUT_KEY);
  } catch {
    // Storage blocked: the tab can still resume after a reload — acceptable fallback.
  }
}

export function didSignOut() {
  return readSignOut() !== null;
}

/** The last logout in this tab couldn't reach the server, so the refresh cookie may still be valid. */
export function signOutIncomplete() {
  return readSignOut() === "server-unreachable";
}

/** The last logout in this tab was the idle timeout. */
export function signedOutForInactivity() {
  return readSignOut() === "idle";
}

function toAdminInfo(admin: Partial<AdminInfo> | undefined): AdminInfo {
  return { isSuperAdmin: admin?.isSuperAdmin ?? false, privileges: admin?.privileges ?? [] };
}

/**
 * Returns the MFA challenge to complete, or null if the backend already issued
 * a complete session (admins whose policy doesn't require MFA).
 */
export async function login(email: string, password: string, rememberMe: boolean) {
  const data = await api<LoginResponse>("/auth/login", {
    method: "POST",
    body: { email, password, rememberMe },
    auth: false,
  });
  setAccessToken(data.accessToken, toAdminInfo(data.admin));
  writeSignOut(null);

  if (!data.mfaRequired) {
    pendingChallenge = null;
    return null;
  }
  const { exp } = decodeClaims(data.accessToken);
  pendingChallenge = {
    mode: data.mfaChallengePurpose === "verify" ? "verify" : "enroll",
    challengeToken: data.mfaChallengeToken ?? "",
    expiresAt: exp ? exp * 1000 : undefined,
  };
  return pendingChallenge;
}

/** Already enrolled: check the 6-digit code from the authenticator app. */
export async function verifyMfa(code: string) {
  const data = await api<MfaCompleteResponse>("/auth/admin/mfa/verify", { method: "POST", body: { code } });
  setAccessToken(data.accessToken, toAdminInfo(data.admin));
  pendingChallenge = null;
}

/** First sign-in: get the secret to show as a QR code. */
export function beginEnrollment(challengeToken: string) {
  return api<{ secret: string; otpauthUrl: string }>("/auth/admin/mfa/enrollment/begin", {
    method: "POST",
    body: { mfaChallengeToken: challengeToken },
  });
}

/** First sign-in: confirm the first code from the newly added authenticator. */
export async function completeEnrollment(challengeToken: string, code: string) {
  const data = await api<MfaCompleteResponse>("/auth/admin/mfa/enrollment/complete", {
    method: "POST",
    body: { code, mfaChallengeToken: challengeToken },
  });
  setAccessToken(data.accessToken, toAdminInfo(data.admin));
  pendingChallenge = null;
}

/** Re-confirm identity before a sensitive action; re-stamps mfaStepUpAt on the token. */
export async function stepUp(code: string) {
  const data = await api<{ accessToken: string }>("/auth/admin/mfa/step-up", { method: "POST", body: { code } });
  setAccessToken(data.accessToken);
}

/** Emails a reset link. The backend answers 200 whether or not the account exists. */
export async function requestPasswordReset(email: string) {
  await api("/auth/forgot-password", { method: "POST", body: { email }, auth: false });
}

/** `token` comes from the emailed link. Backend rejects passwords under 8 characters or equal to the current one. */
export async function resetPassword(token: string, newPassword: string) {
  await api("/auth/reset-password", { method: "POST", body: { token, newPassword }, auth: false });
}

/**
 * Clears the refresh cookie server-side, then the local session — in this tab
 * and, via a broadcast, in every other open tab. The local session is cleared
 * even if the server can't be reached; the tab then won't resume on its own
 * (see didSignOut), and the sign-in page warns the admin.
 *
 * `idle: true` is the idle timeout (IdleTimeout.tsx); the sign-in page says so.
 */
export async function logout({ idle = false }: { idle?: boolean } = {}) {
  let status: SignOutStatus = idle ? "idle" : "done";
  try {
    await api("/auth/logout", { method: "POST" });
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) {
      // Logout needs a valid access token. If it expired (15 min), renew it once
      // and retry. If renewal fails too, the refresh cookie is already invalid
      // (e.g. another tab logged out first) — there's nothing left to end.
      if (await refreshAccessToken()) {
        const ok = await api("/auth/logout", { method: "POST" }).then(
          () => true,
          () => false,
        );
        if (!ok) status = "server-unreachable";
      }
    } else {
      status = "server-unreachable";
    }
  } finally {
    endLocalSession(status);
    announceSignOut(status);
  }
}

function endLocalSession(status: SignOutStatus) {
  pendingChallenge = null;
  writeSignOut(status);
  clearSession();
}

// ---- Cross-tab sign-out ------------------------------------------------------
// Logging out (by hand or idle timeout) in one tab signs out every other tab
// straight away, instead of leaving their in-memory tokens working for up to
// 15 minutes.

const AUTH_CHANNEL = "tc-admin-auth";
type AuthMessage = { type: "signed-out"; status: SignOutStatus };

function announceSignOut(status: SignOutStatus) {
  if (typeof BroadcastChannel === "undefined") return;
  const channel = new BroadcastChannel(AUTH_CHANNEL);
  channel.postMessage({ type: "signed-out", status } satisfies AuthMessage);
  channel.close();
}

/** Start following sign-outs from other tabs. Returns a cleanup function. */
export function listenForSignOut() {
  if (typeof BroadcastChannel === "undefined") return () => {};
  const channel = new BroadcastChannel(AUTH_CHANNEL);
  channel.onmessage = (e: MessageEvent<AuthMessage>) => {
    // No server call: the tab that logged out already made it.
    if (e.data?.type === "signed-out") endLocalSession(e.data.status);
  };
  return () => channel.close();
}
