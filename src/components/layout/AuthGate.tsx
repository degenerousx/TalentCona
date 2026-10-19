"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { Spinner } from "@/components/ui/Spinner";
import { refreshAccessToken, setOnSessionExpired } from "@/lib/api";
import { didSignOut, listenForSignOut } from "@/lib/auth";
import { getSession, isMfaComplete, useSession } from "@/lib/session";

/**
 * Route protection for every admin page: renders the page only with a complete,
 * MFA-verified session.
 *
 * This runs in the browser, not in proxy.ts, because the server can't see the
 * session: the access token lives in memory and the refresh cookie is scoped to
 * Path=/auth/refresh, so it never reaches page requests. The backend rejects
 * every admin call without a valid token anyway — this gate is for UX.
 */
export default function AuthGate({ children }: { children: React.ReactNode }) {
  const session = useSession();
  const router = useRouter();
  const queryClient = useQueryClient();
  const wasSignedIn = useRef(false);
  const ready = isMfaComplete(session);

  // A logout (by hand or idle timeout) in another tab signs this one out too.
  useEffect(() => listenForSignOut(), []);

  useEffect(() => {
    const toSignIn = () => {
      queryClient.clear();
      // Full path incl. query string (e.g. ?tab=mentors), so sign-in returns to the same view.
      // Read from window rather than useSearchParams, which would force a Suspense boundary
      // around every admin page.
      const here = window.location.pathname + window.location.search;
      router.replace(`/sign-in?next=${encodeURIComponent(here)}`);
    };
    setOnSessionExpired(toSignIn);

    if (ready) {
      wasSignedIn.current = true;
      return;
    }
    // Signed out or expired mid-session: straight to sign-in.
    if (wasSignedIn.current) return toSignIn();
    // This tab logged out (then Back, or a reload): don't resume from the refresh
    // cookie — it may still be valid if the logout request never reached the server.
    if (didSignOut()) return toSignIn();

    // First load (or a reload): no token in memory yet — try the refresh cookie.
    let cancelled = false;
    refreshAccessToken().then(() => {
      if (!cancelled && !isMfaComplete(getSession())) toSignIn();
    });
    return () => {
      cancelled = true;
    };
  }, [ready, router, queryClient]);

  if (!ready) {
    return (
      <div role="status" className="flex h-dvh flex-col items-center justify-center gap-3 bg-page">
        <Spinner size="lg" />
        <p className="text-sm leading-5 text-muted-foreground">Loading…</p>
      </div>
    );
  }
  return children;
}
