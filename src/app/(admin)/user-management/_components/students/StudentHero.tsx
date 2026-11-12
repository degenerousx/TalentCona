"use client";

import { useCallback, useState } from "react";
import { BanIcon, MailIcon, MapPinIcon, PhoneIcon, SendIcon, SquarePenIcon } from "@/components/icons";
import { AssignMentorModal, NotifyModal, SuspendModal, Toast } from "../shared/ActionModals";
import { errorText, initials, shortDate, useNotify, useReinstate, useSuspend, type StudentDetail } from "../api";
import styles from "./StudentHero.module.css";

/** Purple student header: avatar, name, badges, contact details and actions, all backed by the API. */
export default function StudentHero({
  student,
  subtitle,
  enrollmentId,
}: {
  student: StudentDetail;
  subtitle?: string;
  /** Enrollment the page is showing, preselected in Assign Mentor. */
  enrollmentId?: string;
}) {
  const [modal, setModal] = useState<"assign" | "notify" | "suspend" | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const close = useCallback(() => setModal(null), []);
  const clearToast = useCallback(() => setToast(null), []);
  const notify = useNotify("students", student.id);
  const suspend = useSuspend("students", student.id);
  const reinstate = useReinstate("students", student.id);

  const enrollments = student.current;
  const initialEnrollment = (enrollments.find((e) => e.enrollmentId === enrollmentId) ?? enrollments[0])?.enrollmentId ?? "";
  const suspended = student.status === "Suspended";
  const joined = shortDate(student.joinedAt);

  return (
    <section className={styles.hero} aria-label="Student">
      <div className={styles.avatar} aria-hidden="true">
        {initials(student.name)}
      </div>

      <div className={styles.identity}>
        <h1 className={styles.name}>{student.name}</h1>
        {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
        <div className={styles.badges}>
          <span className={suspended ? `${styles.badgeStatus} ${styles.badgeSuspended}` : styles.badgeStatus} title={student.suspensionReason ?? undefined}>
            {student.status}
          </span>
          {joined && <span className={styles.badgeOutline}>Joined: {joined}</span>}
        </div>
        <ul className={styles.contacts}>
          <li>
            <MailIcon size={16} color="#FFFFFF" strokeWidth={2} />
            <a href={`mailto:${student.email}`}>{student.email}</a>
          </li>
          {student.phone && (
            <li>
              <PhoneIcon size={16} color="#FFFFFF" strokeWidth={2} />
              <a href={`tel:${student.phone.replace(/[^+\d]/g, "")}`}>{student.phone}</a>
            </li>
          )}
          {student.location && (
            <li>
              <MapPinIcon size={16} color="#FFFFFF" strokeWidth={2} />
              <span>{student.location}</span>
            </li>
          )}
        </ul>
      </div>

      <div className={styles.actions}>
        <button
          type="button"
          className={`${styles.action} ${styles.actionAssign}`}
          onClick={() => setModal("assign")}
          disabled={enrollments.length === 0}
          title={enrollments.length ? undefined : "The student has no current program"}
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
            disabled={reinstate.isPending}
            onClick={() =>
              reinstate.mutate(undefined, {
                onSuccess: () => setToast(`${student.name} has been reactivated.`),
                onError: (e) => setToast(`Couldn't reactivate: ${errorText(e)}`),
              })
            }
          >
            <BanIcon size={16} color="#364153" strokeWidth={2} />
            {reinstate.isPending ? "Reactivating…" : "Reactivate"}
          </button>
        ) : (
          <button type="button" className={`${styles.action} ${styles.actionDanger}`} onClick={() => setModal("suspend")} aria-haspopup="dialog">
            <BanIcon size={16} color="#C10007" strokeWidth={2} />
            Suspend
          </button>
        )}
      </div>

      {modal === "suspend" && (
        <SuspendModal
          name={student.name}
          onClose={close}
          onConfirm={async (reason) => {
            await suspend.mutateAsync(reason);
            setModal(null);
            setToast(`${student.name} has been suspended.`);
          }}
        />
      )}
      {modal === "notify" && (
        <NotifyModal
          onClose={close}
          onSend={async (subject, message) => {
            await notify.mutateAsync({ subject, message });
            setModal(null);
            setToast(`Notification sent to ${student.name}.`);
          }}
        />
      )}
      {modal === "assign" && (
        <AssignMentorModal
          studentId={student.id}
          enrollments={enrollments.map((e) => ({ enrollmentId: e.enrollmentId, title: e.title }))}
          initialEnrollment={initialEnrollment}
          onClose={close}
          onSaved={(program) => {
            setModal(null);
            setToast(`Mentor assignment saved for ${program}.`);
          }}
        />
      )}
      {toast && <Toast message={toast} onDone={clearToast} />}
    </section>
  );
}
