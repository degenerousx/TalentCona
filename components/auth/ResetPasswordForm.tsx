"use client";

import { useState } from "react";
import { EyeOffIcon, EyeOpenIcon } from "@/components/icons";
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
  const [success, setSuccess] = useState(false);

  return (
    <div className={styles.inner}>
      <header className={styles.header}>
        <h1 className={styles.title}>Reset Password</h1>
        <p className={styles.desc}>Enter your new password.</p>
      </header>

      <form
        className={styles.form}
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          const form = e.currentTarget;
          const confirm = form.elements.namedItem("confirmPassword") as HTMLInputElement;
          const password = (form.elements.namedItem("newPassword") as HTMLInputElement).value;
          confirm.setCustomValidity(confirm.value && confirm.value !== password ? "Passwords do not match." : "");
          if (!form.reportValidity()) return;
          // Until the reset API exists, every valid submit succeeds.
          setSuccess(true);
        }}
      >
        <div className={styles.fields}>
          <PasswordField id="newPassword" label="New Password" autoComplete="new-password" />
          <PasswordField id="confirmPassword" label="Confirm Password" autoComplete="new-password" />
        </div>

        <button type="submit" className={styles.primary}>Proceed</button>
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
