"use client";

import styles from "./ForgotPasswordForm.module.css";

export default function ForgotPasswordForm() {
  return (
    <div className={styles.inner}>
      <header className={styles.header}>
        <h1 className={styles.title}>Forgot Password?</h1>
        <p className={styles.desc}>Enter your email address</p>
      </header>

      <form className={styles.form} noValidate onSubmit={(e) => e.preventDefault()}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="email">Email Address</label>
          <div className={styles.input}>
            <input id="email" name="email" type="email" autoComplete="email" required />
          </div>
        </div>

        <button type="submit" className={styles.primary}>Proceed</button>
      </form>
    </div>
  );
}
