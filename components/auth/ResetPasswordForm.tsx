"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { EyeOffIcon, EyeOpenIcon } from "@/components/icons";
import styles from "./ResetPasswordForm.module.css";

function PasswordField({ id, label, autoComplete }: { id: string; label: string; autoComplete: string }) {
  const [visible, setVisible] = useState(false);

  return (
    <div className={styles.field}>
      <label className={styles.label} htmlFor={id}>{label}</label>
      <div className={styles.input}>
        <input id={id} name={id} type={visible ? "text" : "password"} autoComplete={autoComplete} required />
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
  const router = useRouter();

  return (
    <div className={styles.inner}>
      <header className={styles.header}>
        <h1 className={styles.title}>Reset Password</h1>
        <p className={styles.desc}>Enter your new password.</p>
      </header>

      <form
        className={styles.form}
        action="/sign-in"
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          router.push("/sign-in");
        }}
      >
        <div className={styles.fields}>
          <PasswordField id="newPassword" label="New Password" autoComplete="new-password" />
          <PasswordField id="confirmPassword" label="Confirm Password" autoComplete="new-password" />
        </div>

        <button type="submit" className={styles.primary}>Proceed</button>
      </form>
    </div>
  );
}
