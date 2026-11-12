"use client";

import { useCallback, useState } from "react";
import { BanIcon, MailIcon, MapPinIcon, PhoneIcon, SendIcon, SquarePenIcon } from "@/components/icons";
import { AssignMentorToProgramModal, NotifyModal, SuspendModal, Toast, type MentorRoleOption } from "../shared/ActionModals";
import { initials } from "../data/students";
import { ASSIGNABLE_PROGRAMS, type MentorProfile } from "../data/mentors";
import hero from "../students/StudentHero.module.css";
import styles from "./MentorProfile.module.css";

/** Purple mentor header with Edit Role, Assign Mentor, Notify and Suspend, shared by the mentor pages. */
export default function MentorHero({ mentor }: { mentor: MentorProfile }) {
  const [status, setStatus] = useState<"Active" | "Suspended">(mentor.status);
  const [modal, setModal] = useState<"assign" | "notify" | "suspend" | null>(null);
  // Program title → this mentor's role there, starting from their current assignments.
  const [roles, setRoles] = useState<Record<string, MentorRoleOption>>(() => {
    const byProgram: Record<string, Set<string>> = {};
    for (const a of mentor.current) (byProgram[a.program] ??= new Set()).add(a.role);
    return Object.fromEntries(
      Object.entries(byProgram).map(([program, set]) => [program, (set.size > 1 ? "Instructor & Program Advisor" : [...set][0]) as MentorRoleOption]),
    );
  });
  const programs = [...new Set([...ASSIGNABLE_PROGRAMS.map((p) => p.title), ...mentor.current.map((a) => a.program)])].sort((a, b) => a.localeCompare(b));
  const [toast, setToast] = useState<string | null>(null);
  const close = useCallback(() => setModal(null), []);
  const clearToast = useCallback(() => setToast(null), []);
  const suspended = status === "Suspended";

  return (
    <>
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
          <button type="button" className={`${hero.action} ${hero.actionAssign}`} onClick={() => setModal("assign")} aria-haspopup="dialog">
            <SquarePenIcon size={16} color="#364153" strokeWidth={2} />
            Assign Mentor
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
      {modal === "assign" && (
        <AssignMentorToProgramModal
          mentorName={mentor.name}
          programs={programs}
          current={roles}
          onClose={close}
          onSave={(program, role) => {
            setRoles((prev) => ({ ...prev, [program]: role }));
            setModal(null);
            setToast(`${mentor.name} assigned to ${program} as ${role}.`);
          }}
        />
      )}
      {toast && <Toast message={toast} onDone={clearToast} />}
    </>
  );
}
