"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { CheckIcon } from "@/components/icons";
import styles from "./SuccessModal.module.css";

/**
 * Success dialog. Always rendered (hidden when closed) so it is part of the
 * static markup; `open` toggles visibility.
 */
export default function SuccessModal({
  open,
  title,
  message,
  actionLabel,
  actionHref,
}: {
  open: boolean;
  title: string;
  message: string;
  actionLabel: string;
  actionHref: string;
}) {
  const actionRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    if (open) actionRef.current?.focus();
  }, [open]);

  return (
    <div className={styles.backdrop} hidden={!open} data-success-modal>
      <div className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="success-title">
        <div className={styles.icon}>
          <CheckIcon />
        </div>
        <h2 id="success-title" className={styles.title}>{title}</h2>
        <p className={styles.message}>{message}</p>
        <Link ref={actionRef} className={styles.action} href={actionHref}>
          {actionLabel}
        </Link>
      </div>
    </div>
  );
}
