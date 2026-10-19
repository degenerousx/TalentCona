"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import { useEffect, useState } from "react";
import { ApiError } from "@/lib/api";
import { beginEnrollment, completeEnrollment, getPendingChallenge, verifyMfa } from "@/lib/auth";
import { safeNext } from "@/lib/safeNext";

// Same field styling as SignInForm (Figma 412:7781). There is no Figma frame for this screen yet.
const field =
  "flex items-center rounded-md border border-[#f5f5f5] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.05)] transition focus-within:border-[#c9c3f2] focus-within:shadow-[0_1px_2px_rgba(0,0,0,0.05),0_0_0_3px_rgba(48,42,145,0.08)]";
const label = "h-[17px] text-sm leading-[17px] text-[#212121]";

function codeErrorMessage(err: unknown, expired: boolean) {
  if (expired) return "This sign-in has expired. Please sign in again.";
  if (!(err instanceof ApiError)) return "Something went wrong. Please try again.";
  if (err.status === 400 || err.status === 401) return "That code didn't work. Check your authenticator app and try again.";
  if (err.status === 429) return "Too many attempts. Wait a minute and try again.";
  if (err.status >= 500) return "Something went wrong on our side. Try again.";
  return err.message;
}

/**
 * The MFA step after sign-in. Admins who already have an authenticator enter a
 * code; first-time admins scan a QR code, then enter their first code.
 */
export default function MfaForm() {
  const router = useRouter();
  const next = safeNext(useSearchParams().get("next")) ?? "/dashboard";
  // Set by login() just before navigating here; gone after a reload.
  const [challenge] = useState(getPendingChallenge);
  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Set when leaving this screen, so the enrolment query doesn't refetch after
  // its cache entry is removed.
  const [leaving, setLeaving] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!challenge) router.replace("/sign-in");
  }, [challenge, router]);

  // A query rather than an effect so React's double-mount in dev doesn't start
  // enrolment twice and leave the QR code out of step with the server's secret.
  const enrollmentKey = ["mfa-enrollment", challenge?.challengeToken];
  const enrollment = useQuery({
    queryKey: enrollmentKey,
    queryFn: () => beginEnrollment(challenge!.challengeToken),
    enabled: challenge?.mode === "enroll" && !leaving,
    staleTime: Infinity,
    gcTime: Infinity,
    retry: false,
  });

  /** Drop the authenticator secret from memory once it's no longer needed. */
  const forgetSecret = () => {
    setLeaving(true);
    queryClient.removeQueries({ queryKey: enrollmentKey, exact: true });
  };

  if (!challenge) return null;
  const enrolling = challenge.mode === "enroll";

  return (
    <div className="flex w-full flex-col items-center gap-6">
      <header className="flex w-full flex-col items-center gap-1.5 text-center">
        <h1 className="text-2xl leading-[1.3] font-semibold text-[#0b1026]">
          {enrolling ? "Set Up Two-Factor Authentication" : "Verify It's You"}
        </h1>
        <p className="text-base leading-5 text-[#0f172a]">
          {enrolling
            ? "Scan this QR code with an authenticator app (Google Authenticator, Microsoft Authenticator, 1Password), then enter the 6-digit code it shows."
            : "Enter the 6-digit code from your authenticator app."}
        </p>
      </header>

      {enrolling && !leaving && (
        <div className="flex flex-col items-center gap-3">
          {enrollment.isPending && (
            <div role="status" className="grid size-[180px] place-items-center rounded-md bg-page text-sm text-muted-foreground">
              Loading…
            </div>
          )}
          {enrollment.isError && (
            <p role="alert" className="text-center text-sm leading-5 text-danger">
              {codeErrorMessage(enrollment.error, false)}{" "}
              <button type="button" onClick={() => enrollment.refetch()} className="underline">
                Try again
              </button>
            </p>
          )}
          {enrollment.data && (
            <>
              <QRCodeSVG value={enrollment.data.otpauthUrl} size={180} marginSize={2} title="Authenticator QR code" />
              <p className="text-center text-xs leading-5 text-muted-foreground">
                Can&apos;t scan? Enter this key instead:
                <br />
                <code className="font-mono text-sm tracking-wider break-all text-[#0b1026] select-all">
                  {enrollment.data.secret}
                </code>
              </p>
            </>
          )}
        </div>
      )}

      <form
        className="flex w-full flex-col gap-[22px]"
        noValidate
        onSubmit={async (e) => {
          e.preventDefault();
          if (!e.currentTarget.reportValidity()) return;
          setError(null);
          setSubmitting(true);
          try {
            if (enrolling) {
              await completeEnrollment(challenge.challengeToken, code);
              forgetSecret();
            } else {
              await verifyMfa(code);
            }
            router.replace(next);
          } catch (err) {
            const expired = challenge.expiresAt != null && Date.now() > challenge.expiresAt;
            setError(codeErrorMessage(err, expired));
            setSubmitting(false);
          }
        }}
      >
        <div className="flex flex-col gap-[15px]">
          <label className={label} htmlFor="code">
            Authentication code
          </label>
          <div className={`${field} h-[47px]`}>
            <input
              id="code"
              name="code"
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="123456"
              pattern="\d{6}"
              maxLength={6}
              required
              autoFocus
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              className="h-full min-w-0 flex-1 rounded-md bg-transparent px-4 text-center text-lg leading-5 tracking-[0.5em] text-[#0f172a] outline-none placeholder:text-[#0f172a]/30"
            />
          </div>
        </div>

        {error && (
          <p role="alert" className="-mt-1 text-sm leading-5 text-danger">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting || (enrolling && !enrollment.data)}
          className="h-12 w-full rounded-md bg-brand text-sm leading-5 font-semibold text-white transition-colors hover:bg-[#27227a] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {submitting ? "Verifying…" : "Verify"}
        </button>

        <Link
          href="/sign-in"
          onClick={forgetSecret}
          className="self-center py-2 text-sm leading-5 text-[#0b1026] hover:underline"
        >
          Back to sign in
        </Link>
      </form>
    </div>
  );
}
