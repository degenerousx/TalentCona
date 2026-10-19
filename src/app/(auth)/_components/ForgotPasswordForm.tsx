"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ApiError } from "@/lib/api";
import { requestPasswordReset } from "@/lib/auth";
import { cn } from "@/lib/cn";
import { MailIcon } from "./icons";
import styles from "./ForgotPasswordForm.module.css";

function errorMessage(err: unknown) {
  if (err instanceof ApiError && err.status === 429) return "Too many attempts. Wait a minute and try again.";
  if (err instanceof ApiError && err.status >= 500) return "Something went wrong on our side. Try again.";
  if (err instanceof ApiError) return err.message;
  return "Something went wrong. Please try again.";
}

const textButton =
  "font-semibold text-brand hover:underline disabled:cursor-default disabled:text-muted disabled:no-underline";

/** Seconds between resends — keeps one admin well under the 100 requests/min rate limit. */
const RESEND_COOLDOWN = 30;

/**
 * Shown after the reset email is requested. There is no Figma frame for this
 * state; it follows the auth card's type and the SuccessModal's icon badge.
 * The copy never confirms the account exists — the backend answers the same either way.
 */
function CheckEmail({ email, onChangeEmail }: { email: string; onChangeEmail: () => void }) {
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN);
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setTimeout(() => setCooldown((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [cooldown]);

  return (
    <div className="flex w-full flex-col items-center gap-6 text-center">
      {/* Badge sized and bordered like SuccessModal's, in brand purple. */}
      <div className="grid size-[88px] shrink-0 place-items-center rounded-full border-[7px] border-[#e4e1f7] bg-brand">
        <MailIcon />
      </div>

      <header className="flex w-full flex-col items-center gap-1.5">
        <h1 className="text-2xl leading-[1.3] font-semibold text-heading">Check Your Email</h1>
        <p className="text-base leading-5 text-[#0f172a]">
          If an admin account exists for
          <span className="mt-1 block font-semibold [overflow-wrap:anywhere] text-heading">{email}</span>
          you&apos;ll get a link to reset your password.
        </p>
      </header>

      <p className="w-full rounded-lg bg-table-head px-4 py-3 text-sm leading-5 text-muted-foreground">
        Open the link on this device to choose a new password. Can&apos;t find the email? Check your spam or
        junk folder.
      </p>

      <div className="flex w-full flex-col gap-3">
        <Link
          href="/sign-in"
          className="grid h-12 w-full place-items-center rounded-md bg-brand text-sm leading-5 font-semibold text-white transition-colors hover:bg-[#27227a]"
        >
          Back to Sign In
        </Link>

        <p className="text-sm leading-5 text-[#0f172a]">
          Didn&apos;t receive it?{" "}
          <button
            type="button"
            className={textButton}
            disabled={cooldown > 0 || sending}
            onClick={async () => {
              setSending(true);
              setStatus(null);
              try {
                await requestPasswordReset(email);
                setStatus({ ok: true, text: "We've sent another email." });
                setCooldown(RESEND_COOLDOWN);
              } catch (err) {
                setStatus({ ok: false, text: errorMessage(err) });
              } finally {
                setSending(false);
              }
            }}
          >
            {sending ? "Sending…" : cooldown > 0 ? `Resend in ${cooldown}s` : "Resend email"}
          </button>
          {" · "}
          <button type="button" className={textButton} onClick={onChangeEmail}>
            Use a different email
          </button>
        </p>

        {/* Always rendered so screen readers announce updates; min-h keeps the card from jumping. */}
        <p role="status" className={cn("min-h-5 text-sm leading-5", status?.ok ? "text-success" : "text-danger")}>
          {status?.text}
        </p>
      </div>
    </div>
  );
}

export default function ForgotPasswordForm() {
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (sentTo) {
    return (
      <CheckEmail
        email={sentTo}
        onChangeEmail={() => {
          setSentTo(null);
          setSubmitting(false);
        }}
      />
    );
  }

  return (
    <div className={styles.inner}>
      <header className={styles.header}>
        <h1 className={styles.title}>Forgot Password?</h1>
        <p className={styles.desc}>Enter your email address</p>
      </header>

      <form
        className={styles.form}
        noValidate
        onSubmit={async (e) => {
          e.preventDefault();
          if (!e.currentTarget.reportValidity()) return;
          const email = String(new FormData(e.currentTarget).get("email")).trim();
          setError(null);
          setSubmitting(true);
          try {
            await requestPasswordReset(email);
            setSentTo(email);
          } catch (err) {
            setError(errorMessage(err));
            setSubmitting(false);
          }
        }}
      >
        <div className={styles.field}>
          <label className={styles.label} htmlFor="email">Email Address</label>
          <div className={styles.input}>
            <input id="email" name="email" type="email" autoComplete="email" required />
          </div>
        </div>

        {error && (
          <p role="alert" className="-mt-6 text-sm leading-5 text-danger">
            {error}
          </p>
        )}

        <button type="submit" className={styles.primary} disabled={submitting}>
          {submitting ? "Sending…" : "Proceed"}
        </button>
      </form>
    </div>
  );
}
