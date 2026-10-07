"use client";

import { useCallback, useState } from "react";
import { BanIcon, MailIcon, MapPinIcon, PhoneIcon, SendIcon, SquarePenIcon } from "@/components/app/icons";
import { AssignMentorModal, NotifyModal, SuspendModal, Toast, type Assignment } from "./ActionModals";
import { MENTOR_POOL, initials, type Student, type StudentStatus } from "./data";
import styles from "./StudentHero.module.css";

/** Purple student header: avatar, name, badges, contact details and actions. */
export default function StudentHero({
  student,
  subtitle,
  programId,
}: {
  student: Student;
  subtitle?: string;
  /** Program the page is showing, preselected in Assign Mentor. */
  programId?: string;
}) {
  const [status, setStatus] = useState<StudentStatus>(student.status);
  const [modal, setModal] = useState<"assign" | "notify" | "suspend" | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const close = useCallback(() => setModal(null), []);
  const clearToast = useCallback(() => setToast(null), []);

  const programs = student.currentPrograms;
  const [assignments, setAssignments] = useState<Record<string, Assignment>>(() =>
    Object.fromEntries(programs.map((p) => [p.title, { instructor: p.mentor?.name ?? "", advisor: p.advisor?.name ?? "" }])),
  );
  const people = [...new Set([...MENTOR_POOL, ...Object.values(assignments).flatMap((a) => [a.instructor, a.advisor])])]
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b));
  const initialProgram = (programs.find((p) => p.id === programId) ?? programs[0])?.title ?? "";
  const suspended = status === "Suspended";

  return (
    <section className={styles.hero} aria-label="Student">
      <div className={styles.avatar} aria-hidden="true">
        {initials(student.name)}
      </div>

      <div className={styles.identity}>
        <h1 className={styles.name}>{student.name}</h1>
        {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
        <div className={styles.badges}>
          <span className={suspended ? `${styles.badgeStatus} ${styles.badgeSuspended}` : styles.badgeStatus}>{status}</span>
          <span className={styles.badgeOutline}>Joined: {student.joined}</span>
        </div>
        <ul className={styles.contacts}>
          <li>
            <MailIcon size={16} color="#FFFFFF" strokeWidth={2} />
            <a href={`mailto:${student.email}`}>{student.email}</a>
          </li>
          <li>
            <PhoneIcon size={16} color="#FFFFFF" strokeWidth={2} />
            <a href={`tel:${student.phone.replace(/[^+\d]/g, "")}`}>{student.phone}</a>
          </li>
          <li>
            <MapPinIcon size={16} color="#FFFFFF" strokeWidth={2} />
            <span>{student.location}</span>
          </li>
        </ul>
      </div>

      <div className={styles.actions}>
        <button
          type="button"
          className={`${styles.action} ${styles.actionAssign}`}
          onClick={() => setModal("assign")}
          disabled={programs.length === 0}
          aria-haspopup="dialog"
        >
          <SquarePenIcon size={16} color="#364153" strokeWidth={2} />
          Assign Mentor
        </button>
        <button type="button" className={styles.action} onClick={() => setModal("notify")} aria-haspopup="dialog">
          <SendIcon size={16} color="#364153" strokeWidth={2} />
          Notify
        </button>
        {suspended ? (
          <button
            type="button"
            className={styles.action}
            onClick={() => {
              setStatus("Active");
              setToast(`${student.name} has been reactivated.`);
            }}
          >
            <BanIcon size={16} color="#364153" strokeWidth={2} />
            Reactivate
          </button>
        ) : (
          <button
            type="button"
            className={`${styles.action} ${styles.actionDanger}`}
            onClick={() => setModal("suspend")}
            aria-haspopup="dialog"
          >
            <BanIcon size={16} color="#C10007" strokeWidth={2} />
            Suspend
          </button>
        )}
      </div>

      {modal === "suspend" && (
        <SuspendModal
          name={student.name}
          onClose={close}
          onConfirm={() => {
            setStatus("Suspended");
            setModal(null);
            setToast(`${student.name} has been suspended.`);
          }}
        />
      )}
      {modal === "notify" && (
        <NotifyModal
          onClose={close}
          onSend={() => {
            setModal(null);
            setToast(`Notification sent to ${student.name}.`);
          }}
        />
      )}
      {modal === "assign" && (
        <AssignMentorModal
          programs={programs.map((p) => p.title)}
          initialProgram={initialProgram}
          assignments={assignments}
          people={people}
          onClose={close}
          onSave={(program, a) => {
            setAssignments((prev) => ({ ...prev, [program]: a }));
            setModal(null);
            setToast(`Mentor assignment saved for ${program}.`);
          }}
        />
      )}
      {toast && <Toast message={toast} onDone={clearToast} />}
    </section>
  );
}
