"use client";

import { useCallback, useState } from "react";
import { BanIcon, MailIcon, MapPinIcon, PhoneIcon, SendIcon, SquarePenIcon } from "@/components/app/icons";
import { NotifyModal, SuspendModal, Toast } from "./ActionModals";
import { initials } from "./data";
import type { MentorProfile } from "./mentors";
import hero from "./StudentHero.module.css";
import styles from "./MentorProfile.module.css";

/** Purple mentor header with Edit Role, Notify and Suspend, shared by the mentor pages. */
export default function MentorHero({ mentor }: { mentor: MentorProfile }) {
  const [status, setStatus] = useState<"Active" | "Suspended">(mentor.status);
  const [modal, setModal] = useState<"notify" | "suspend" | null>(null);
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
      {toast && <Toast message={toast} onDone={clearToast} />}
    </>
  );
}
