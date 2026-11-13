"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, RoleDefinitions } from "./AssignParts";
export type MentorRole = "Instructor" | "Program Advisor";
export type AssignableProgram = { id: string; title: string; track: string };
import assign from "./MentorAssign.module.css";
import styles from "./AssignProgramsModal.module.css";

const ROLES: MentorRole[] = ["Instructor", "Program Advisor"];

/** Program id → its role (null while the program is ticked but no role is chosen). */
/** Program id → its roles (empty while the program is ticked but no role is chosen yet). */
export type ProgramRoles = Record<string, MentorRole[]>;

/** Confirms which programs a mentor joins, one role per program. */
export default function AssignProgramsModal({
  mentorName,
  programs,
  initial,
  onCancel,
  onConfirm,
}: {
  mentorName: string;
  programs: AssignableProgram[];
  initial: ProgramRoles;
  onCancel: () => void;
  /** Runs the request; a failure keeps the modal open with the error. */
  onConfirm: (roles: Record<string, MentorRole[]>) => Promise<unknown>;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const titleId = useId();
  const ref = useRef<HTMLDivElement>(null);
  const [roles, setRoles] = useState<ProgramRoles>(initial);
  const chosen = programs.filter((p) => p.id in roles);
  const ready = chosen.length > 0 && chosen.every((p) => roles[p.id].length > 0);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onCancel();
    document.addEventListener("keydown", onKey);
    ref.current?.focus();
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onCancel]);

  const toggleProgram = (id: string) => setRoles(({ [id]: current, ...rest }) => (current !== undefined ? rest : { ...rest, [id]: [] }));

  return createPortal(
    <div className={styles.overlay} onMouseDown={(e) => e.target === e.currentTarget && onCancel()}>
      <div ref={ref} className={styles.modal} role="dialog" aria-modal="true" aria-labelledby={titleId} tabIndex={-1}>
        <header className={styles.head}>
          <h2 id={titleId} className={styles.title}>
            Assign Programs
          </h2>
          <p className={styles.subtitle}>Select programs and assign roles for {mentorName}</p>
        </header>

        <div className={styles.body}>
          <RoleDefinitions />

          <ul className={assign.programs} aria-label="Programs">
            {programs.filter((p) => p.id in initial).map((p) => {
              const on = p.id in roles;
              return (
                <li key={p.id} className={`${assign.program} ${on ? assign.programOn : ""}`}>
                  <label className={assign.programHead}>
                    <Check checked={on} onChange={() => toggleProgram(p.id)} label={`Assign to ${p.title}`} />
                    <span className={assign.programText}>
                      <span className={assign.programTitle}>{p.title}</span>
                      <span className={assign.programTrack}>{p.track}</span>
                    </span>
                  </label>
                  {on && (
                    <div className={assign.roleChoices} role="group" aria-label={`Role in ${p.title}`}>
                      {ROLES.map((r) => (
                        <label key={r} className={assign.roleChoice}>
                          <Check
                            checked={roles[p.id].includes(r)}
                            label={`${r} in ${p.title}`}
                            onChange={() =>
                              setRoles((s) => ({
                                ...s,
                                [p.id]: s[p.id].includes(r) ? s[p.id].filter((x) => x !== r) : ROLES.filter((x) => x === r || s[p.id].includes(x)),
                              }))
                            }
                          />
                          <span>{r}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>

          <div className={assign.summary} aria-live="polite">
            <h3 className={assign.summaryTitle}>Selected Assignments:</h3>
            <ul className={assign.summaryList}>
              {chosen.map((p) => (
                <li key={p.id}>
                  • {p.title} - {roles[p.id]?.length ? <b>{roles[p.id].join(" & ")}</b> : <span className={assign.summaryMissing}>choose a role</span>}
                </li>
              ))}
              {chosen.length === 0 && <li className={assign.summaryEmpty}>No programs selected yet.</li>}
            </ul>
          </div>
        </div>

        {error && (
          <p role="alert" className={styles.error}>
            {error}
          </p>
        )}
        <footer className={styles.foot}>
          <button type="button" className={styles.cancel} onClick={onCancel} disabled={busy}>
            Cancel
          </button>
          <button
            type="button"
            className={styles.confirm}
            disabled={!ready || busy}
            title={ready ? undefined : "Choose a role for every selected program"}
            onClick={async () => {
              setBusy(true);
              setError(null);
              try {
                await onConfirm(Object.fromEntries(chosen.map((p) => [p.id, roles[p.id]])));
              } catch (e) {
                setError(e instanceof Error && e.message ? e.message : "Something went wrong. Please try again.");
              } finally {
                setBusy(false);
              }
            }}
          >
            {busy ? "Assigning…" : "Confirm Assignment"}
          </button>
        </footer>
      </div>
    </div>,
    document.body,
  );
}
