"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import styles from "./RejectDialog.module.css";

/** Asks for rejection feedback before a mentorship application is rejected. */
export default function RejectDialog({
  initial = "",
  onClose,
  onSubmit,
}: {
  initial?: string;
  onClose: () => void;
  onSubmit: (feedback: string) => void;
}) {
  const titleId = useId();
  const fieldId = useId();
  const fieldRef = useRef<HTMLTextAreaElement>(null);
  const [feedback, setFeedback] = useState(initial);

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
    <div className={styles.overlay} onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <form
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit(feedback.trim());
        }}
      >
        <header className={styles.head}>
          <h2 id={titleId} className={styles.title}>
            Reject Application
          </h2>
          <button type="button" className={styles.close} onClick={onClose} aria-label="Close">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path d="M15 5 5 15M5 5l10 10" stroke="#3A3A3A" strokeWidth="1.67" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </header>

        <div className={styles.body}>
          <label htmlFor={fieldId} className={styles.label}>
            Rejection Feedback
          </label>
          <textarea
            ref={fieldRef}
            id={fieldId}
            className={styles.field}
            placeholder="Provide constructive feedback for rejection..."
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
          />
        </div>

        <footer className={styles.foot}>
          <button type="button" className={styles.cancel} onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className={styles.submit}>
            Submit
          </button>
        </footer>
      </form>
    </div>,
    document.body,
  );
}
