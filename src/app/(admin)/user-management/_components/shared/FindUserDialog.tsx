"use client";

import Link from "next/link";
import { useState } from "react";
import { humanize, lookupWhere, useUserLookup } from "../api";
import { applicationStatusLabel } from "../filters";
import { useDebounced } from "../useDebounced";
import { Modal } from "./ActionModals";
import styles from "./ActionModals.module.css";

/**
 * "Where is this person?" — searches every list admins can see by name or
 * email, and explains why someone who signed up might not be in any of them.
 */
export default function FindUserDialog({ onClose, initial = "" }: { onClose: () => void; initial?: string }) {
  const [term, setTerm] = useState(initial);
  const q = useDebounced(term.trim(), 400);
  const lookup = useUserLookup(q);
  const hits = lookup.data ?? [];

  return (
    <Modal title="Find a user" onClose={onClose}>
      <div className={styles.form}>
        <div className={styles.content}>
          <input
            className={`${styles.field} ${styles.subject}`}
            type="search"
            placeholder="Email or name, e.g. jane@example.com"
            aria-label="Email or name"
            value={term}
            onChange={(e) => setTerm(e.target.value)}
          />
          <p className={styles.hint}>Searches Students and every mentor, including not submitted, changes requested and rejected applications.</p>

          <div aria-live="polite" className="flex max-h-[320px] flex-col gap-2 overflow-y-auto">
            {q.length < 3 ? null : lookup.isPending ? (
              <p className={styles.hint}>Searching…</p>
            ) : lookup.isError ? (
              <p className={styles.error} role="alert">
                Couldn&apos;t search: {lookup.error.message}
              </p>
            ) : hits.length ? (
              <ul className="flex flex-col gap-2">
                {hits.map((h) => (
                  <li key={`${h.where}-${h.id}`} className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 px-3 py-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-900">{h.name}</p>
                      <p className="truncate text-xs text-slate-500">{h.email}</p>
                      <p className="text-xs text-slate-700">
                        Found in <strong>{lookupWhere(h.where)}</strong>
                        {h.status ? ` · ${h.where === "student" ? `Account: ${humanize(h.status)}` : `Application: ${applicationStatusLabel(h.status)}`}` : ""}
                      </p>
                    </div>
                    <Link href={h.href} onClick={onClose} className="shrink-0 text-sm font-medium text-primary hover:underline">
                      Open
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-3 text-sm leading-5 text-amber-900" role="status">
                <p className="font-semibold">No student or mentor matching “{q}” is visible to admins.</p>
                <p className="mt-1">
                  Students and mentors are searched in every status, not submitted included, so this person most likely hasn&apos;t verified their email
                  with the sign-up code yet (unverified accounts aren&apos;t listed), or the email is spelled differently.
                </p>
              </div>
            )}
          </div>
        </div>
        <div className={styles.buttons}>
          <button type="button" className={styles.cancel} onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
}
