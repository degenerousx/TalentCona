"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { createPortal, flushSync } from "react-dom";
import { ChevronDownBoldIcon, SearchIcon } from "@/components/icons";
import { useAssignment, useAssignmentOptions, useUpdateAssignment, type PersonRef } from "../api";
import styles from "./ActionModals.module.css";

/** Centered dialog shell shared by the Suspend, Notify and Assign Mentor actions. */
export function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  const id = useId();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !e.defaultPrevented) onClose();
    };
    document.addEventListener("keydown", onKey);
    const first = ref.current?.querySelector<HTMLElement>("input, textarea, button");
    first?.focus();
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  return createPortal(
    <div className={styles.overlay} onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div ref={ref} className={styles.dialog} role="dialog" aria-modal="true" aria-labelledby={id}>
        <h3 id={id} className={styles.title}>
          {title}
        </h3>
        {children}
      </div>
    </div>,
    document.body,
  );
}

function Buttons({
  confirm,
  busyLabel,
  tone = "purple",
  disabled,
  busy,
  error,
  onCancel,
}: {
  confirm: string;
  busyLabel?: string;
  tone?: "purple" | "red";
  disabled?: boolean;
  busy?: boolean;
  error?: string | null;
  onCancel: () => void;
}) {
  return (
    <>
      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}
      <div className={styles.buttons}>
        <button type="button" className={styles.cancel} onClick={onCancel} disabled={busy}>
          Cancel
        </button>
        <button type="submit" className={`${styles.confirm} ${tone === "red" ? styles.red : ""}`} disabled={disabled || busy} aria-busy={busy}>
          {busy ? (busyLabel ?? `${confirm}…`) : confirm}
        </button>
      </div>
    </>
  );
}

/** Runs an async action, keeping the dialog open with the error if it fails. */
function useSubmit() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const run = async (action: () => Promise<unknown>) => {
    setBusy(true);
    setError(null);
    try {
      await action();
    } catch (e) {
      setError(e instanceof Error && e.message ? e.message : "Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  };
  return { busy, error, run };
}

export function SuspendModal({ name, onClose, onConfirm }: { name: string; onClose: () => void; onConfirm: (reason: string) => Promise<unknown> }) {
  const [reason, setReason] = useState("");
  const { busy, error, run } = useSubmit();
  return (
    <Modal title="Suspend User" onClose={onClose}>
      <form
        className={styles.form}
        onSubmit={(e) => {
          e.preventDefault();
          const form = e.currentTarget;
          if (busy) return;
          if (reason.trim()) void run(() => onConfirm(reason.trim()));
          else {
            // Whitespace only: clear it so the browser's required check kicks in.
            flushSync(() => setReason(""));
            form.reportValidity();
          }
        }}
      >
        <div className={`${styles.content} ${styles.suspendContent}`}>
          <p className={styles.text}>
            Are you sure you want to suspend {name}? They will lose access to the platform.
          </p>
          <textarea
            className={`${styles.field} ${styles.reason}`}
            placeholder="Reason for suspension (required)"
            aria-label="Reason for suspension"
            required
            maxLength={2000}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </div>
        <Buttons confirm="Suspend" busyLabel="Suspending…" tone="red" busy={busy} error={error} onCancel={onClose} />
      </form>
    </Modal>
  );
}

export function NotifyModal({ onClose, onSend }: { onClose: () => void; onSend: (subject: string, message: string) => Promise<unknown> }) {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const { busy, error, run } = useSubmit();
  const ready = subject.trim() && message.trim();
  return (
    <Modal title="Send Notification" onClose={onClose}>
      <form
        className={styles.form}
        onSubmit={(e) => {
          e.preventDefault();
          const form = e.currentTarget;
          if (busy) return;
          if (ready) void run(() => onSend(subject.trim(), message.trim()));
          else {
            // Whitespace only: clear it so the browser's required check kicks in.
            flushSync(() => {
              setSubject((v) => v.trim());
              setMessage((v) => v.trim());
            });
            form.reportValidity();
          }
        }}
      >
        <div className={`${styles.content} ${styles.notifyContent}`}>
          <input
            className={`${styles.field} ${styles.subject}`}
            placeholder="Subject"
            aria-label="Subject"
            required
            maxLength={200}
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
          />
          <textarea
            className={`${styles.field} ${styles.message}`}
            placeholder="Message"
            aria-label="Message"
            required
            maxLength={5000}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
        </div>
        <Buttons confirm="Send" busyLabel="Sending…" busy={busy} error={error} onCancel={onClose} />
      </form>
    </Modal>
  );
}

export type Option = { value: string; label: string };

type SelectProps = {
  label: string;
  placeholder: string;
  options: Option[];
  value: string;
  onChange: (v: string) => void;
  open: boolean;
  onToggle: () => void;
  searchPlaceholder?: string;
  disabled?: boolean;
};

function Select({ label, placeholder, options, value, onChange, open, onToggle, searchPlaceholder, disabled }: SelectProps) {
  const id = useId();
  const [search, setSearch] = useState("");
  const q = search.trim().toLowerCase();
  const visible = q ? options.filter((o) => o.label.toLowerCase().includes(q)) : options;
  const current = options.find((o) => o.value === value)?.label;

  return (
    <div className={styles.selectField}>
      <span id={`${id}-label`} className={styles.label}>
        {label}
      </span>
      <div className={styles.selectWrap}>
        <button
          type="button"
          className={styles.dropdown}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-labelledby={`${id}-label ${id}-value`}
          disabled={disabled}
          onClick={() => {
            // Each opening starts with an empty search.
            if (!open) setSearch("");
            onToggle();
          }}
        >
          <span id={`${id}-value`} className={styles.value}>
            {current || placeholder}
          </span>
          <span className={styles.chevron}>
            <ChevronDownBoldIcon />
          </span>
        </button>
        {open && (
          <div
            className={styles.popover}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                e.preventDefault();
                onToggle();
              }
            }}
          >
            {searchPlaceholder && (
              <label className={styles.popSearch}>
                <span className={styles.popSearchIcon}>
                  <SearchIcon size={20} />
                </span>
                <input
                  type="text"
                  placeholder={searchPlaceholder}
                  aria-label={searchPlaceholder.replace("...", "")}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  autoFocus
                />
              </label>
            )}
            <ul className={styles.options} role="listbox" aria-labelledby={`${id}-label`}>
              {visible.map((o) => (
                <li key={o.value} role="option" aria-selected={o.value === value}>
                  <button
                    type="button"
                    className={styles.option}
                    onClick={() => {
                      onChange(o.value);
                      onToggle();
                    }}
                  >
                    {o.label}
                  </button>
                </li>
              ))}
              {visible.length === 0 && <li className={styles.noMatch}>No matches</li>}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

/** People as options; same-name people get their email added so they can be told apart. */
const peopleOptions = (people: PersonRef[]): Option[] => {
  const counts = new Map<string, number>();
  for (const p of people) counts.set(p.name, (counts.get(p.name) ?? 0) + 1);
  return people.map((p) => ({ value: p.id, label: (counts.get(p.name) ?? 0) > 1 && p.email ? `${p.name} (${p.email})` : p.name }));
};

/**
 * Student Assign Mentor: pick one of the student's current enrollments, then
 * its instructor and program advisor from the backend's options for it.
 * Saves with PATCH …/enrollments/:id/assignment.
 */
export function AssignMentorModal({
  studentId,
  enrollments,
  initialEnrollment,
  onClose,
  onSaved,
}: {
  studentId: string;
  enrollments: { enrollmentId: string; title: string }[];
  initialEnrollment: string;
  onClose: () => void;
  onSaved: (programTitle: string) => void;
}) {
  const [enrollmentId, setEnrollmentId] = useState(initialEnrollment);
  const [picked, setPicked] = useState<Record<string, { mentorId?: string; advisorId?: string }>>({});
  const [open, setOpen] = useState<"program" | "instructor" | "advisor" | null>(null);
  const toggle = (k: NonNullable<typeof open>) => () => setOpen((o) => (o === k ? null : k));
  const assignment = useAssignment(studentId, enrollmentId || null);
  const options = useAssignmentOptions(studentId, enrollmentId || null);
  const update = useUpdateAssignment(studentId);
  const { busy, error, run } = useSubmit();

  const draft = picked[enrollmentId] ?? {};
  const mentorId = draft.mentorId ?? assignment.data?.mentor?.id ?? "";
  const advisorId = draft.advisorId ?? assignment.data?.advisor?.id ?? "";
  // Keep the current people selectable even if the options list leaves them out.
  const withCurrent = (list: PersonRef[] | undefined, current: PersonRef | null | undefined) =>
    current && !list?.some((p) => p.id === current.id) ? [current, ...(list ?? [])] : (list ?? []);
  const mentors = withCurrent(options.data?.mentors, assignment.data?.mentor);
  const advisors = withCurrent(options.data?.advisors, assignment.data?.advisor);
  const program = enrollments.find((e) => e.enrollmentId === enrollmentId)?.title ?? "";
  const changes = {
    ...(draft.mentorId && draft.mentorId !== assignment.data?.mentor?.id ? { mentorId: draft.mentorId } : {}),
    ...(draft.advisorId && draft.advisorId !== assignment.data?.advisor?.id ? { advisorId: draft.advisorId } : {}),
  };
  const loading = assignment.isPending || options.isPending;
  const loadError = assignment.error ?? options.error;

  const assigned = [
    mentorId && { name: mentors.find((p) => p.id === mentorId)?.name ?? "", role: "Instructor" },
    advisorId && { name: advisors.find((p) => p.id === advisorId)?.name ?? "", role: "Program Advisor" },
  ].filter(Boolean) as { name: string; role: string }[];

  return (
    <Modal title="Assign Mentor" onClose={onClose}>
      <form
        className={`${styles.form} ${styles.assignForm}`}
        onMouseDown={(e) => {
          if (open && !(e.target as HTMLElement).closest(`.${styles.selectWrap}`)) setOpen(null);
        }}
        onSubmit={(e) => {
          e.preventDefault();
          if (busy || !Object.keys(changes).length) return;
          void run(async () => {
            await update.mutateAsync({ enrollmentId, ...changes });
            onSaved(program);
          });
        }}
      >
        <div className={styles.selects}>
          <Select
            label="Program"
            placeholder="Select program"
            options={enrollments.map((e) => ({ value: e.enrollmentId, label: e.title }))}
            value={enrollmentId}
            onChange={setEnrollmentId}
            open={open === "program"}
            onToggle={toggle("program")}
          />
          <Select
            label="Instructor"
            placeholder={loading ? "Loading…" : mentors.length ? "Select instructor" : "No instructors available"}
            options={peopleOptions(mentors)}
            value={mentorId}
            onChange={(v) => setPicked((p) => ({ ...p, [enrollmentId]: { ...p[enrollmentId], mentorId: v } }))}
            open={open === "instructor"}
            onToggle={toggle("instructor")}
            searchPlaceholder="Search program instructors..."
            disabled={!enrollmentId || loading}
          />
          <Select
            label="Program Advisor"
            placeholder={loading ? "Loading…" : advisors.length ? "Select program advisor" : "No program advisors available"}
            options={peopleOptions(advisors)}
            value={advisorId}
            onChange={(v) => setPicked((p) => ({ ...p, [enrollmentId]: { ...p[enrollmentId], advisorId: v } }))}
            open={open === "advisor"}
            onToggle={toggle("advisor")}
            searchPlaceholder="Search program advisors..."
            disabled={!enrollmentId || loading}
          />
        </div>

        {loadError ? <p className={styles.error} role="alert">Couldn&apos;t load mentors for this program: {loadError.message}</p> : null}

        {assigned.length > 0 && (
          <div className={styles.summary}>
            <h4 className={styles.summaryTitle}>Assign Mentor(s):</h4>
            <ul className={styles.summaryList}>
              {assigned.map((a) => (
                <li key={a.role}>
                  <span className={styles.summaryName}>{a.name}</span>
                  <span className={styles.summaryMeta}>
                    {program} - <strong>{a.role}</strong>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <Buttons confirm="Save" busyLabel="Saving…" busy={busy} error={error} disabled={!enrollmentId || !Object.keys(changes).length} onCancel={onClose} />
      </form>
    </Modal>
  );
}

/** A mentor's role(s) in one program: "Instructor", "Program Advisor" or both. */
export const MENTOR_ROLE_OPTIONS = ["Instructor", "Program Advisor", "Instructor & Program Advisor"] as const;
export type MentorRoleOption = (typeof MENTOR_ROLE_OPTIONS)[number];

export const roleFlags = (role: MentorRoleOption) => ({ mentor: role !== "Program Advisor", advisor: role !== "Instructor" });

/**
 * Mentor version of Assign Mentor (also Edit Role, limited to the mentor's
 * current programs): pick a program, then this mentor's role in it.
 */
export function AssignMentorToProgramModal({
  title = "Assign Mentor to a Program",
  mentorName,
  programs,
  current,
  onClose,
  onSave,
}: {
  title?: string;
  mentorName: string;
  programs: Option[];
  /** Program id → the mentor's existing role there, to preselect. */
  current: Record<string, MentorRoleOption>;
  onClose: () => void;
  onSave: (programId: string, role: MentorRoleOption) => Promise<unknown>;
}) {
  const [program, setProgram] = useState(programs.length === 1 ? programs[0].value : "");
  const [role, setRole] = useState<MentorRoleOption | "">(programs.length === 1 ? (current[programs[0].value] ?? "") : "");
  const [open, setOpen] = useState<"program" | "role" | null>(null);
  const toggle = (k: NonNullable<typeof open>) => () => setOpen((o) => (o === k ? null : k));
  const { busy, error, run } = useSubmit();
  const existing = program ? current[program] : undefined;
  const programTitle = programs.find((p) => p.value === program)?.label ?? "";
  const roles = role === "Instructor & Program Advisor" ? ["Instructor", "Program Advisor"] : role ? [role] : [];

  return (
    <Modal title={title} onClose={onClose}>
      <form
        className={`${styles.form} ${styles.assignForm}`}
        onMouseDown={(e) => {
          if (open && !(e.target as HTMLElement).closest(`.${styles.selectWrap}`)) setOpen(null);
        }}
        onSubmit={(e) => {
          e.preventDefault();
          if (!busy && program && role) void run(() => onSave(program, role));
        }}
      >
        <div className={styles.selects}>
          <Select
            label="Program"
            placeholder={programs.length ? "Select program" : "No programs available"}
            options={programs}
            value={program}
            onChange={(v) => {
              setProgram(v);
              setRole(current[v] ?? "");
            }}
            open={open === "program"}
            onToggle={toggle("program")}
            searchPlaceholder="Search programs..."
          />
          <Select
            label="Role"
            placeholder="Select role"
            options={MENTOR_ROLE_OPTIONS.map((r) => ({ value: r, label: r }))}
            value={role}
            onChange={(v) => setRole(v as MentorRoleOption)}
            open={open === "role"}
            onToggle={toggle("role")}
          />
        </div>

        {program && roles.length > 0 && (
          <div className={styles.summary}>
            <h4 className={styles.summaryTitle}>Assign Mentor:</h4>
            <ul className={styles.summaryList}>
              {roles.map((r) => (
                <li key={r}>
                  <span className={styles.summaryName}>{mentorName}</span>
                  <span className={styles.summaryMeta}>
                    {programTitle} - <strong>{r}</strong>
                  </span>
                </li>
              ))}
            </ul>
            {existing && existing !== role && <p className={styles.summaryMeta}>Currently: {existing}</p>}
          </div>
        )}

        <Buttons confirm="Save" busyLabel="Saving…" busy={busy} error={error} disabled={!program || !role || existing === role} onCancel={onClose} />
      </form>
    </Modal>
  );
}

/** Short confirmation shown after an action completes. */
export function Toast({ message, onDone }: { message: string; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 3500);
    return () => clearTimeout(t);
  }, [message, onDone]);
  return createPortal(
    <div className={styles.toast} role="status">
      {message}
    </div>,
    document.body,
  );
}
