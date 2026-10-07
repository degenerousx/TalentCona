"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { createPortal, flushSync } from "react-dom";
import { ChevronDownBoldIcon, SearchIcon } from "@/components/app/icons";
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
  tone = "purple",
  disabled,
  onCancel,
}: {
  confirm: string;
  tone?: "purple" | "red";
  disabled?: boolean;
  onCancel: () => void;
}) {
  return (
    <div className={styles.buttons}>
      <button type="button" className={styles.cancel} onClick={onCancel}>
        Cancel
      </button>
      <button type="submit" className={`${styles.confirm} ${tone === "red" ? styles.red : ""}`} disabled={disabled}>
        {confirm}
      </button>
    </div>
  );
}

export function SuspendModal({ name, onClose, onConfirm }: { name: string; onClose: () => void; onConfirm: (reason: string) => void }) {
  const [reason, setReason] = useState("");
  return (
    <Modal title="Suspend User" onClose={onClose}>
      <form
        className={styles.form}
        onSubmit={(e) => {
          e.preventDefault();
          const form = e.currentTarget;
          if (reason.trim()) onConfirm(reason.trim());
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
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </div>
        <Buttons confirm="Suspend" tone="red" onCancel={onClose} />
      </form>
    </Modal>
  );
}

export function NotifyModal({ onClose, onSend }: { onClose: () => void; onSend: (subject: string, message: string) => void }) {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const ready = subject.trim() && message.trim();
  return (
    <Modal title="Send Notification" onClose={onClose}>
      <form
        className={styles.form}
        onSubmit={(e) => {
          e.preventDefault();
          const form = e.currentTarget;
          if (ready) onSend(subject.trim(), message.trim());
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
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
          />
          <textarea
            className={`${styles.field} ${styles.message}`}
            placeholder="Message"
            aria-label="Message"
            required
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
        </div>
        <Buttons confirm="Send" onCancel={onClose} />
      </form>
    </Modal>
  );
}

type SelectProps = {
  label: string;
  placeholder: string;
  options: string[];
  value: string;
  onChange: (v: string) => void;
  open: boolean;
  onToggle: () => void;
  searchPlaceholder?: string;
};

function Select({ label, placeholder, options, value, onChange, open, onToggle, searchPlaceholder }: SelectProps) {
  const id = useId();
  const [search, setSearch] = useState("");
  useEffect(() => {
    if (open) setSearch("");
  }, [open]);
  const q = search.trim().toLowerCase();
  const visible = q ? options.filter((o) => o.toLowerCase().includes(q)) : options;

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
          onClick={onToggle}
        >
          <span id={`${id}-value`} className={styles.value}>
            {value || placeholder}
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
                <li key={o} role="option" aria-selected={o === value}>
                  <button
                    type="button"
                    className={o === value ? `${styles.option} ${styles.optionOn}` : styles.option}
                    onClick={() => {
                      onChange(o);
                      onToggle();
                    }}
                  >
                    {o}
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

export type Assignment = { instructor: string; advisor: string };

export function AssignMentorModal({
  programs,
  initialProgram,
  assignments,
  people,
  onClose,
  onSave,
}: {
  programs: string[];
  initialProgram: string;
  assignments: Record<string, Assignment>;
  people: string[];
  onClose: () => void;
  onSave: (program: string, a: Assignment) => void;
}) {
  const [program, setProgram] = useState(initialProgram);
  const [draft, setDraft] = useState<Record<string, Assignment>>(assignments);
  const [open, setOpen] = useState<"program" | "instructor" | "advisor" | null>(null);
  const current = draft[program] ?? { instructor: "", advisor: "" };
  const update = (patch: Partial<Assignment>) => setDraft((d) => ({ ...d, [program]: { ...current, ...patch } }));
  const toggle = (k: NonNullable<typeof open>) => () => setOpen((o) => (o === k ? null : k));

  const assigned = [
    current.instructor && { name: current.instructor, role: "Instructor" },
    current.advisor && { name: current.advisor, role: "Program Advisor" },
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
          onSave(program, current);
        }}
      >
        <div className={styles.selects}>
          <Select
            label="Program"
            placeholder="Select program"
            options={programs}
            value={program}
            onChange={setProgram}
            open={open === "program"}
            onToggle={toggle("program")}
          />
          <Select
            label="Instructor"
            placeholder="Select instructor"
            options={people}
            value={current.instructor}
            onChange={(v) => update({ instructor: v })}
            open={open === "instructor"}
            onToggle={toggle("instructor")}
            searchPlaceholder="Search program instructors..."
          />
          <Select
            label="Program Advisor"
            placeholder="Select program advisor"
            options={people}
            value={current.advisor}
            onChange={(v) => update({ advisor: v })}
            open={open === "advisor"}
            onToggle={toggle("advisor")}
            searchPlaceholder="Search program advisors..."
          />
        </div>

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

        <Buttons confirm="Save" disabled={!program} onCancel={onClose} />
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
