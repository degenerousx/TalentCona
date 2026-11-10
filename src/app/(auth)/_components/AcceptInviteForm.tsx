"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";
import { PasswordField } from "./ResetPasswordForm";
import SuccessModal from "./SuccessModal";
import styles from "./ResetPasswordForm.module.css";

/**
 * GET /admin-portal/invitations/preview?token= (no auth). `state` is "ready"
 * with the invitation's details, or expired / unavailable / invalid.
 */
type Preview = {
  state: "ready" | "expired" | "unavailable" | "invalid" | string;
  email?: string;
  fullName?: string | null;
};

const ended: Record<string, string> = {
  expired: "This invitation has expired. Ask the admin who invited you to resend it.",
  unavailable: "This invitation has already been used or was revoked. If you've already set your password, sign in.",
  invalid: "This invitation link isn't valid. Open the link from your email again, or ask for a new invitation.",
};

function Shell({ title, desc, children }: { title: string; desc: React.ReactNode; children?: React.ReactNode }) {
  return (
    <div className={styles.inner}>
      <header className={styles.header}>
        <h1 className={styles.title}>{title}</h1>
        <p className={styles.desc}>{desc}</p>
      </header>
      {children}
    </div>
  );
}

const signInLink = (
  <Link href="/sign-in" className="self-center py-2 text-sm leading-5 text-[#0b1026] hover:underline">
    Go to sign in
  </Link>
);

/**
 * The invited admin sets a password here. Accepting creates the account with
 * the privileges chosen when they were invited (POST /admin-portal/invitations/accept).
 */
export default function AcceptInviteForm() {
  const token = useSearchParams().get("token");
  const [preview, setPreview] = useState<Preview | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) return;
    let live = true;
    api<Preview>("/admin-portal/invitations/preview", { query: { token }, auth: false })
      .then((p) => live && setPreview(p))
      .catch((err) => live && setLoadError(err instanceof ApiError && err.status === 0 ? err.message : "Couldn't check this invitation. Try again."));
    return () => {
      live = false;
    };
  }, [token]);

  if (!token) return <Shell title="Accept Invitation" desc={ended.invalid}>{signInLink}</Shell>;
  if (loadError) return <Shell title="Accept Invitation" desc={loadError} />;
  if (!preview) return <Shell title="Accept Invitation" desc="Checking your invitation…" />;
  if (preview.state !== "ready") {
    return <Shell title="Accept Invitation" desc={ended[preview.state] ?? ended.invalid}>{signInLink}</Shell>;
  }

  const who = preview.fullName ? `${preview.fullName}, you've` : "You've";
  return (
    <Shell
      title="Accept Invitation"
      desc={
        <>
          {who} been invited to the TalentCona admin portal{preview.email ? <> as <strong>{preview.email}</strong></> : null}.
          Choose a password to activate your account.
        </>
      }
    >
      <form
        className={styles.form}
        noValidate
        onSubmit={async (e) => {
          e.preventDefault();
          const form = e.currentTarget;
          const confirm = form.elements.namedItem("confirmPassword") as HTMLInputElement;
          const password = (form.elements.namedItem("newPassword") as HTMLInputElement).value;
          confirm.setCustomValidity(confirm.value && confirm.value !== password ? "Passwords do not match." : "");
          if (!form.reportValidity()) return;
          setError(null);
          setSubmitting(true);
          try {
            await api("/admin-portal/invitations/accept", { method: "POST", body: { token, password }, auth: false });
            setSuccess(true);
          } catch (err) {
            setError(
              err instanceof ApiError && err.status > 0 && err.status < 500
                ? err.message
                : err instanceof ApiError && err.status === 0
                  ? err.message
                  : "Something went wrong on our side. Try again.",
            );
            setSubmitting(false);
          }
        }}
      >
        <div className={styles.fields}>
          <PasswordField id="newPassword" label="Password" autoComplete="new-password" />
          <PasswordField id="confirmPassword" label="Confirm Password" autoComplete="new-password" />
        </div>

        {error && (
          <p role="alert" className="-mt-6 text-sm leading-5 text-danger">
            {error}
          </p>
        )}

        <button type="submit" className={styles.primary} disabled={submitting}>
          {submitting ? "Activating…" : "Activate Account"}
        </button>
      </form>

      <SuccessModal
        open={success}
        title="Welcome aboard!"
        message="Your admin account is ready. Sign in to continue."
        actionLabel="Sign In"
        actionHref="/sign-in"
      />
    </Shell>
  );
}
