"use client";

import { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import styles from "./SuccessDialog.module.css";

/** Centered confirmation with a green check, e.g. after approving or rejecting an application. */
export default function SuccessDialog({ title, onClose }: { title: string; onClose: () => void }) {
  const id = useId();
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    closeRef.current?.focus();
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  return createPortal(
    <div className={styles.overlay} onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal} role="dialog" aria-modal="true" aria-labelledby={id}>
        <button ref={closeRef} type="button" className={styles.close} onClick={onClose} aria-label="Close">
          <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M6.4 19 5 17.6l5.6-5.6L5 6.4 6.4 5l5.6 5.6L17.6 5 19 6.4 13.4 12l5.6 5.6-1.4 1.4-5.6-5.6z" fill="#455A64" />
          </svg>
        </button>
        <span className={styles.icon} aria-hidden="true">
          <svg width="24" height="24" viewBox="0 0 24 24">
            <path d="M21 7 9 19l-5.5-5.5 1.41-1.41L9 16.17 19.59 5.59z" fill="#FFFFFF" />
          </svg>
        </span>
        <h2 id={id} className={styles.title}>
          {title}
        </h2>
      </div>
    </div>,
    document.body,
  );
}
