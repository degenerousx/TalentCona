"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useSyncExternalStore } from "react";
import { ApiError, refreshAccessToken } from "@/lib/api";
import { didSignOut, login, signedOutForInactivity, signOutIncomplete } from "@/lib/auth";
import { safeNext } from "@/lib/safeNext";
import { getSession, isMfaComplete } from "@/lib/session";
import { EyeIcon, EyeSlashIcon } from "./icons";

// Values from the Figma frame (412:7781).
const field =
  "flex items-center rounded-md border border-[#f5f5f5] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.05)] transition focus-within:border-[#c9c3f2] focus-within:shadow-[0_1px_2px_rgba(0,0,0,0.05),0_0_0_3px_rgba(48,42,145,0.08)]";
const input =
  "h-full min-w-0 flex-1 rounded-md bg-transparent px-4 text-[15px] leading-5 text-[#0f172a] outline-none placeholder:text-[#0f172a]/60";
const label = "h-[17px] text-sm leading-[17px] text-[#212121]";

// The sign-out status only changes on navigation, so nothing to subscribe to.
const noSubscribe = () => () => {};

function signInErrorMessage(err: unknown) {
  if (!(err instanceof ApiError)) return "Something went wrong. Please try again.";
  // 400 is the backend's input validation (e.g. password under 8 characters).
  if (err.status === 400 || err.status === 401) return "Incorrect email or password.";
  if (err.status === 429) return "Too many attempts. Wait a minute and try again.";
  // Never show raw server errors on the sign-in screen.
  if (err.status >= 500) return "Something went wrong on our side. Try again.";
  return err.message;
}

export default function SignInForm() {
  const router = useRouter();
  const next = safeNext(useSearchParams().get("next"));
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Read from sessionStorage, which the server can't see — false there, real value in the browser.
  const logoutIncomplete = useSyncExternalStore(noSubscribe, signOutIncomplete, () => false);
  const idleSignOut = useSyncExternalStore(noSubscribe, signedOutForInactivity, () => false);

  // Already signed in (e.g. this page opened in a new tab)? Go straight on.
  // The form stays usable meanwhile — the refresh can take seconds on a cold backend.
  useEffect(() => {
    const goOn = () => router.replace(next ?? "/dashboard");
    if (isMfaComplete(getSession())) return goOn();
    if (didSignOut()) return;
    let cancelled = false;
    refreshAccessToken().then(() => {
      if (!cancelled && isMfaComplete(getSession())) goOn();
    });
    return () => {
      cancelled = true;
    };
  }, [next, router]);

  return (
    <div className="flex w-full flex-col items-center gap-6">
      {logoutIncomplete && (
        <p role="status" className="w-full rounded-md bg-warning-soft px-4 py-3 text-sm leading-5 text-[#0f172a]">
          You&apos;re signed out on this tab, but we couldn&apos;t reach the server to end your session everywhere.
          On a shared computer, close all browser windows.
        </p>
      )}
      {idleSignOut && (
        <p role="status" className="w-full rounded-md bg-info-soft px-4 py-3 text-sm leading-5 text-[#0f172a]">
          You were signed out after 15 minutes of inactivity. Sign in to continue where you left off.
        </p>
      )}
      <header className="flex w-full flex-col items-center gap-1.5 text-center">
        <h1 className="text-2xl leading-[1.3] font-semibold text-[#0b1026]">Welcome Back</h1>
        <p className="text-base leading-5 text-[#0f172a]">
          Sign in to your account to continue your journey with TalentCona.
        </p>
      </header>

      <form
        className="flex w-full flex-col gap-[22px] [@media(max-height:720px)]:gap-4"
        noValidate
        onSubmit={async (e) => {
          e.preventDefault();
          // Both fields are required and the email must be valid; the browser shows what's missing.
          if (!e.currentTarget.reportValidity()) return;
          const form = new FormData(e.currentTarget);
          setError(null);
          setSubmitting(true);
          try {
            const challenge = await login(
              String(form.get("email")).trim(),
              String(form.get("password")),
              form.get("remember") === "on",
            );
            // Admins always get an MFA step; the MFA screen sends them on to `next`.
            router.push(challenge ? `/verify-identity${next ? `?next=${encodeURIComponent(next)}` : ""}` : next ?? "/dashboard");
          } catch (err) {
            setError(signInErrorMessage(err));
            setSubmitting(false);
          }
        }}
      >
        <div className="flex flex-col gap-[15px]">
          <label className={label} htmlFor="email">
            Email
          </label>
          <div className={`${field} h-[47px]`}>
            <input
              id="email"
              name="email"
              type="email"
              placeholder="Enter your email"
              autoComplete="email"
              required
              className={input}
            />
          </div>
        </div>

        <div className="flex flex-col gap-[15px]">
          <label className={label} htmlFor="password">
            Password
          </label>
          <div className={`${field} h-[52px]`}>
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              autoComplete="current-password"
              required
              className={`${input} font-[Segoe_UI,var(--font-outfit),sans-serif] text-base font-semibold tracking-[0.2em] text-[#616161] placeholder:text-[#616161]`}
            />
            <button
              type="button"
              aria-label={showPassword ? "Hide password" : "Show password"}
              aria-pressed={showPassword}
              onClick={() => setShowPassword((v) => !v)}
              className="grid h-11 w-12 shrink-0 place-items-center text-[#616161]"
            >
              {showPassword ? <EyeIcon /> : <EyeSlashIcon />}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <label className="inline-flex cursor-pointer items-center gap-2 text-sm leading-5 text-[#0b1026] select-none">
            <input type="checkbox" name="remember" className="peer sr-only" />
            <span
              aria-hidden
              className="grid size-4 place-items-center rounded-[4px] border border-[#f1f5f9] bg-[#f8fafc] shadow-[0_1px_2px_rgba(0,0,0,0.05)] peer-checked:border-brand peer-checked:bg-brand peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-brand after:hidden after:h-1 after:w-2 after:-translate-y-px after:rotate-[-45deg] after:border-0 after:border-b-[1.6px] after:border-l-[1.6px] after:border-solid after:border-white after:content-[''] peer-checked:after:block"
            />
            Remember me
          </label>
          <Link href="/forgot-password" className="py-2 text-sm leading-5 text-[#0b1026] hover:underline">
            Forgot password?
          </Link>
        </div>

        {error && (
          <p role="alert" className="-mt-1 text-sm leading-5 text-danger">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="h-12 w-full rounded-md bg-brand text-sm leading-5 font-semibold text-white transition-colors hover:bg-[#27227a] disabled:cursor-wait"
        >
          <span className="opacity-60">{submitting ? "Signing in…" : "Sign In"}</span>
        </button>
      </form>
    </div>
  );
}
