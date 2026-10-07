"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, RoleDefinitions } from "./AssignParts";
import { ASSIGNABLE_PROGRAMS, type MentorRole } from "./mentors";
import assign from "./MentorAssign.module.css";
import styles from "./AssignProgramsModal.module.css";

const ROLES: MentorRole[] = ["Instructor", "Program Advisor"];

/** Program id → its role (null while the program is ticked but no role is chosen). */
export type ProgramRoles = Record<string, MentorRole | null>;

/** Confirms which programs a mentor joins, one role per program. */
export default function AssignProgramsModal({
  mentorName,
  initial,
  onCancel,
  onConfirm,
}: {
  mentorName: string;
  initial: ProgramRoles;
  onCancel: () => void;
  onConfirm: (roles: Record<string, MentorRole>) => void;
}) {
  const titleId = useId();
  const ref = useRef<HTMLDivElement>(null);
  const [roles, setRoles] = useState<ProgramRoles>(initial);
  const chosen = ASSIGNABLE_PROGRAMS.filter((p) => p.id in roles);
  const ready = chosen.length > 0 && chosen.every((p) => roles[p.id]);

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

  const toggleProgram = (id: string) => setRoles(({ [id]: current, ...rest }) => (current !== undefined ? rest : { ...rest, [id]: null }));

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
            {ASSIGNABLE_PROGRAMS.map((p) => {
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
                    <div className={assign.roleChoices} role="radiogroup" aria-label={`Role in ${p.title}`}>
                      {ROLES.map((r) => (
                        <label key={r} className={assign.roleChoice}>
                          <input
                            type="radio"
                            name={`${titleId}-${p.id}`}
                            className={styles.radio}
                            checked={roles[p.id] === r}
                            onChange={() => setRoles((s) => ({ ...s, [p.id]: r }))}
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
                  • {p.title} - {roles[p.id] ? <b>{roles[p.id]}</b> : <span className={assign.summaryMissing}>choose a role</span>}
                </li>
              ))}
              {chosen.length === 0 && <li className={assign.summaryEmpty}>No programs selected yet.</li>}
            </ul>
          </div>
        </div>

        <footer className={styles.foot}>
          <button type="button" className={styles.cancel} onClick={onCancel}>
            Cancel
          </button>
          <button
            type="button"
            className={styles.confirm}
            disabled={!ready}
            title={ready ? undefined : "Choose a role for every selected program"}
            onClick={() => onConfirm(Object.fromEntries(chosen.map((p) => [p.id, roles[p.id] as MentorRole])))}
          >
            Confirm Assignment
          </button>
        </footer>
      </div>
    </div>,
    document.body,
  );
}
