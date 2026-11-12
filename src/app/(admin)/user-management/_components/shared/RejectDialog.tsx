"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import styles from "./RejectDialog.module.css";

/**
 * Asks for a written reason before a mentorship application is rejected (or
 * sent back for changes). `onSubmit` runs the request; a failure keeps the
 * dialog open with the error.
 */
export default function RejectDialog({
  title = "Reject Application",
  label = "Rejection Feedback",
  placeholder = "Provide constructive feedback for rejection...",
  required = false,
  onClose,
  onSubmit,
}: {
  title?: string;
  label?: string;
  placeholder?: string;
  /** The reason must be filled in (e.g. to tell the mentor what to change). */
  required?: boolean;
  onClose: () => void;
  onSubmit: (feedback: string) => Promise<unknown>;
}) {
  const titleId = useId();
  const fieldId = useId();
  const fieldRef = useRef<HTMLTextAreaElement>(null);
  const [feedback, setFeedback] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    fieldRef.current?.focus();
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  return createPortal(
    <div className={styles.overlay} onMouseDown={(e) => e.target === e.currentTarget && !busy && onClose()}>
      <form
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onSubmit={async (e) => {
          e.preventDefault();
          if (busy || (required && !feedback.trim())) return;
          setBusy(true);
          setError(null);
          try {
            await onSubmit(feedback.trim());
          } catch (err) {
            setError(err instanceof Error && err.message ? err.message : "Something went wrong. Please try again.");
          } finally {
            setBusy(false);
          }
        }}
      >
        <header className={styles.head}>
          <h2 id={titleId} className={styles.title}>
            {title}
          </h2>
          <button type="button" className={styles.close} onClick={onClose} aria-label="Close" disabled={busy}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path d="M15 5 5 15M5 5l10 10" stroke="#3A3A3A" strokeWidth="1.67" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </header>

        <div className={styles.body}>
          <label htmlFor={fieldId} className={styles.label}>
            {label}
          </label>
          <textarea
            ref={fieldRef}
            id={fieldId}
            className={styles.field}
            placeholder={placeholder}
            value={feedback}
            required={required}
            maxLength={2000}
            onChange={(e) => setFeedback(e.target.value)}
          />
          {error && (
            <p className={styles.error} role="alert">
              {error}
            </p>
          )}
        </div>

        <footer className={styles.foot}>
          <button type="button" className={styles.cancel} onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button type="submit" className={styles.submit} disabled={busy || (required && !feedback.trim())}>
            {busy ? "Submitting…" : "Submit"}
          </button>
        </footer>
      </form>
    </div>,
    document.body,
  );
}
