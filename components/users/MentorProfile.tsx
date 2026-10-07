"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { BanIcon, MailIcon, MapPinIcon, PhoneIcon, SendIcon, SquarePenIcon } from "@/components/app/icons";
import { NotifyModal, SuspendModal, Toast } from "./ActionModals";
import { initials } from "./data";
import type { MentorAssignment, MentorProfile as Mentor } from "./mentors";
import hero from "./StudentHero.module.css";
import styles from "./MentorProfile.module.css";

function AssignmentCard({
  a,
  selected,
  onSelect,
}: {
  a: MentorAssignment;
  selected?: boolean;
  onSelect?: () => void;
}) {
  const body = (
    <>
      <span className={styles.programTitle}>{a.program}</span>
      <span className={styles.meta}>
        <span>
          Date Assigned: <strong>{a.dateAssigned}</strong>
        </span>
        <span>
          Role: <strong>{a.role}</strong>
        </span>
        <span>
          Number of Mentees: <strong>{a.mentees}</strong>
        </span>
        {a.dateUnassigned && (
          <span>
            Date Unassigned: <strong>{a.dateUnassigned}</strong>
          </span>
        )}
      </span>
    </>
  );

  return onSelect ? (
    <button type="button" className={`${styles.program} ${selected ? styles.programSelected : ""}`} aria-pressed={selected} onClick={onSelect}>
      {body}
    </button>
  ) : (
    <div className={styles.program}>{body}</div>
  );
}

export default function MentorProfile({ mentor }: { mentor: Mentor }) {
  const [selected, setSelected] = useState(0);
  const [status, setStatus] = useState<"Active" | "Suspended">(mentor.status);
  const [modal, setModal] = useState<"notify" | "suspend" | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const close = useCallback(() => setModal(null), []);
  const clearToast = useCallback(() => setToast(null), []);
  const suspended = status === "Suspended";

  return (
    <div className={styles.page}>
      <div className={styles.backRow}>
        <Link href="/user-management#mentors" className={styles.back}>
          ← Back
        </Link>
      </div>

      <section className={`${hero.hero} ${styles.hero}`} aria-label="Mentor">
        <div className={hero.avatar} aria-hidden="true">
          {initials(mentor.name)}
        </div>

        <div className={hero.identity}>
          <h1 className={hero.name}>{mentor.name}</h1>
          <div className={hero.badges}>
            <span className={suspended ? `${hero.badgeStatus} ${hero.badgeSuspended}` : hero.badgeStatus}>{status}</span>
            <span className={hero.badgeOutline}>Joined: {mentor.joined}</span>
          </div>
          <ul className={hero.contacts}>
            <li>
              <MailIcon size={16} color="#FFFFFF" strokeWidth={2} />
              <a href={`mailto:${mentor.email}`}>{mentor.email}</a>
            </li>
            <li>
              <PhoneIcon size={16} color="#FFFFFF" strokeWidth={2} />
              <a href={`tel:${mentor.phone.replace(/[^+\d]/g, "")}`}>{mentor.phone}</a>
            </li>
            <li>
              <MapPinIcon size={16} color="#FFFFFF" strokeWidth={2} />
              <span>{mentor.location}</span>
            </li>
          </ul>
        </div>

        <div className={hero.actions}>
          <button type="button" className={`${hero.action} ${hero.actionAssign}`} onClick={() => setToast("Editing mentor roles is coming soon.")}>
            <SquarePenIcon size={16} color="#364153" strokeWidth={2} />
            Edit Role
          </button>
          <button type="button" className={hero.action} onClick={() => setModal("notify")} aria-haspopup="dialog">
            <SendIcon size={16} color="#364153" strokeWidth={2} />
            Notify
          </button>
          {suspended ? (
            <button
              type="button"
              className={hero.action}
              onClick={() => {
                setStatus("Active");
                setToast(`${mentor.name} has been reactivated.`);
              }}
            >
              <BanIcon size={16} color="#364153" strokeWidth={2} />
              Reactivate
            </button>
          ) : (
            <button type="button" className={`${hero.action} ${hero.actionDanger}`} onClick={() => setModal("suspend")} aria-haspopup="dialog">
              <BanIcon size={16} color="#C10007" strokeWidth={2} />
              Suspend
            </button>
          )}
        </div>
      </section>

      <section className={styles.card} aria-labelledby="programs-assigned">
        <h2 id="programs-assigned" className={styles.cardTitle}>
          Programs Assigned
        </h2>

        <div className={`${styles.group} ${styles.groupCurrent}`}>
          <h3 className={styles.groupTitle}>Current Programs ({mentor.current.length})</h3>
          {mentor.current.length > 0 ? (
            <div className={styles.programs}>
              {mentor.current.map((a, i) => (
                <AssignmentCard key={`${a.program}-${a.role}`} a={a} selected={selected === i} onSelect={() => setSelected(i)} />
              ))}
            </div>
          ) : (
            <p className={styles.none}>No programs assigned yet.</p>
          )}
        </div>

        <div className={`${styles.group} ${styles.groupHistory}`}>
          <h3 className={styles.groupTitle}>Assignment History ({mentor.history.length})</h3>
          {mentor.history.length > 0 ? (
            <div className={styles.programs}>
              {mentor.history.map((a) => (
                <AssignmentCard key={`${a.program}-${a.role}-${a.dateUnassigned}`} a={a} />
              ))}
            </div>
          ) : (
            <p className={styles.none}>No past assignments.</p>
          )}
        </div>
      </section>

      {modal === "suspend" && (
        <SuspendModal
          name={mentor.name}
          onClose={close}
          onConfirm={() => {
            setStatus("Suspended");
            setModal(null);
            setToast(`${mentor.name} has been suspended.`);
          }}
        />
      )}
      {modal === "notify" && (
        <NotifyModal
          onClose={close}
          onSend={() => {
            setModal(null);
            setToast(`Notification sent to ${mentor.name}.`);
          }}
        />
      )}
      {toast && <Toast message={toast} onDone={clearToast} />}
    </div>
  );
}
