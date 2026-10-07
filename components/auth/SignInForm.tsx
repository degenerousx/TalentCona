"use client";

import Link from "next/link";
import { useState } from "react";
import { EyeIcon, EyeSlashIcon, GoogleIcon } from "@/components/icons";
import styles from "./SignInForm.module.css";

export default function SignInForm() {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className={styles.inner}>
      <header className={styles.header}>
        <h1 className={styles.title}>Welcome Back</h1>
        <p className={styles.desc}>Sign in to your account to continue your journey with TalentCona.</p>
      </header>

      <form className={styles.auth} noValidate onSubmit={(e) => e.preventDefault()}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="email">Email</label>
          <div className={styles.input}>
            <input id="email" name="email" type="email" placeholder="Enter your email" autoComplete="email" required />
          </div>
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="password">Password</label>
          <div className={`${styles.input} ${styles.inputLg}`}>
            <input
              id="password"
              className={styles.password}
              name="password"
              type={showPassword ? "text" : "password"}
              placeholder="•••••••••"
              autoComplete="current-password"
              required
            />
            <button
              type="button"
              className={styles.trailing}
              aria-label={showPassword ? "Hide password" : "Show password"}
              aria-pressed={showPassword}
              onClick={() => setShowPassword((v) => !v)}
            >
              {showPassword ? <EyeIcon /> : <EyeSlashIcon />}
            </button>
          </div>
        </div>

        <div className={styles.row}>
          <label className={styles.check}>
            <input type="checkbox" name="remember" />
            <span className={styles.checkBox} aria-hidden="true" />
            <span>Remember me</span>
          </label>
          <Link className={styles.linkPlain} href="#">Forgot password?</Link>
        </div>

        <div className={styles.actions}>
          <button type="submit" className={styles.primary}>
            <span>Sign In</span>
          </button>
          <p className={styles.signup}>
            Don’t have an account? <Link href="#">Sign up</Link>
          </p>
        </div>

        <div className={styles.divider}>
          <span className={styles.dividerLine} />
          <span className={styles.dividerText}>Or</span>
          <span className={styles.dividerLine} />
        </div>

        <div className={styles.social}>
          <button type="button" className={styles.google}>
            <GoogleIcon />
            <span>Google</span>
          </button>
        </div>
      </form>
    </div>
  );
}
