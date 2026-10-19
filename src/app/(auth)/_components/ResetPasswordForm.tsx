"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { ApiError } from "@/lib/api";
import { resetPassword } from "@/lib/auth";
import { EyeOffIcon, EyeOpenIcon } from "./icons";
import SuccessModal from "./SuccessModal";
import styles from "./ResetPasswordForm.module.css";

function PasswordField({ id, label, autoComplete }: { id: string; label: string; autoComplete: string }) {
  const [visible, setVisible] = useState(false);

  return (
    <div className={styles.field}>
      <label className={styles.label} htmlFor={id}>{label}</label>
      <div className={styles.input}>
        <input
          id={id}
          name={id}
          type={visible ? "text" : "password"}
          autoComplete={autoComplete}
          required
          // Backend minimum.
          minLength={8}
          onInput={(e) => {
            const confirm = e.currentTarget.form?.elements.namedItem("confirmPassword");
            if (confirm instanceof HTMLInputElement) confirm.setCustomValidity("");
          }}
        />
        <button
          type="button"
          className={styles.trailing}
          aria-label={visible ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
          aria-pressed={visible}
          onClick={() => setVisible((v) => !v)}
        >
          {visible ? <EyeOpenIcon /> : <EyeOffIcon />}
        </button>
      </div>
    </div>
  );
}

export default function ResetPasswordForm() {
  // The emailed link is /reset-password?token=…
  const token = useSearchParams().get("token");
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<{ message: string; linkExpired: boolean } | null>(null);

  if (!token) {
    return (
      <div className={styles.inner}>
        <header className={styles.header}>
          <h1 className={styles.title}>Reset Password</h1>
          <p className={styles.desc}>
            This reset link is incomplete. Open the link from your email again, or request a new one.
          </p>
        </header>
        <Link href="/forgot-password" className="self-center py-2 text-sm leading-5 text-[#0b1026] hover:underline">
          Request a new link
        </Link>
      </div>
    );
  }

  return (
    <div className={styles.inner}>
      <header className={styles.header}>
        <h1 className={styles.title}>Reset Password</h1>
        <p className={styles.desc}>Enter your new password.</p>
      </header>

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
            await resetPassword(token, password);
            setSuccess(true);
          } catch (err) {
            setError(
              err instanceof ApiError && err.status < 500
                ? // 401 is an invalid or expired token; 400 carries the backend's own message,
                  // e.g. "New password must be different from your current password".
                  { message: err.message, linkExpired: err.status === 401 }
                : err instanceof ApiError
                  ? { message: "Something went wrong on our side. Try again.", linkExpired: false }
                  : { message: "Something went wrong. Please try again.", linkExpired: false },
            );
            setSubmitting(false);
          }
        }}
      >
        <div className={styles.fields}>
          <PasswordField id="newPassword" label="New Password" autoComplete="new-password" />
          <PasswordField id="confirmPassword" label="Confirm Password" autoComplete="new-password" />
        </div>

        {error && (
          <p role="alert" className="-mt-6 text-sm leading-5 text-danger">
            {error.message}
            {error.linkExpired && (
              <>
                {" "}
                <Link href="/forgot-password" className="underline">
                  Request a new link
                </Link>
              </>
            )}
          </p>
        )}

        <button type="submit" className={styles.primary} disabled={submitting}>
          {submitting ? "Saving…" : "Proceed"}
        </button>
      </form>

      <SuccessModal
        open={success}
        title="Congratulations!"
        message="Password Reset Successfully"
        actionLabel="Login"
        actionHref="/sign-in"
      />
    </div>
  );
}
