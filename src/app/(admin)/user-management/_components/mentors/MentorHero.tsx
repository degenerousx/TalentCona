"use client";

import { useCallback, useState } from "react";
import { BanIcon, MailIcon, MapPinIcon, SendIcon, SquarePenIcon } from "@/components/icons";
import { AssignMentorToProgramModal, NotifyModal, SuspendModal, Toast, roleFlags, type MentorRoleOption } from "../shared/ActionModals";
import {
  errorText,
  initials,
  mergePrograms,
  roleLabel,
  shortDate,
  useNotify,
  usePrograms,
  useReinstate,
  useSetMentorPrograms,
  useSuspend,
  type MentorDetail,
} from "../api";
import hero from "../students/StudentHero.module.css";
import styles from "./MentorProfile.module.css";

/** Purple mentor header with Edit Role, Assign Mentor, Notify and Suspend, shared by the mentor pages. */
export default function MentorHero({ mentor }: { mentor: MentorDetail }) {
  const [modal, setModal] = useState<"role" | "assign" | "notify" | "suspend" | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const close = useCallback(() => setModal(null), []);
  const clearToast = useCallback(() => setToast(null), []);
  const notify = useNotify("mentors", mentor.id);
  const suspend = useSuspend("mentors", mentor.id);
  const reinstate = useReinstate("mentors", mentor.id);
  const setPrograms = useSetMentorPrograms(mentor.id);
  const allPrograms = usePrograms();

  // Program id → this mentor's current role there.
  const roles = Object.fromEntries(mentor.programs.map((p) => [p.programId, roleLabel(p) as MentorRoleOption]));
  const currentOptions = mentor.programs.map((p) => ({ value: p.programId, label: p.title }));
  const assignOptions = [
    ...currentOptions,
    ...(allPrograms.data ?? []).filter((p) => !roles[p.id]).map((p) => ({ value: p.id, label: p.title })),
  ].sort((a, b) => a.label.localeCompare(b.label));
  const titleOf = (id: string) => assignOptions.find((p) => p.value === id)?.label ?? "the program";
  const save = async (programId: string, role: MentorRoleOption) => {
    await setPrograms.mutateAsync(mergePrograms(mentor.programs, [{ programId, ...roleFlags(role) }]));
    setModal(null);
    setToast(`${mentor.name} is now ${role} on ${titleOf(programId)}.`);
  };

  const suspended = mentor.status === "Suspended";
  const approved = mentor.application.status === "Approved" ? shortDate(mentor.application.reviewedAt) : null;
  const applied = shortDate(mentor.application.submittedAt);

  return (
    <>
      <section className={`${hero.hero} ${styles.hero}`} aria-label="Mentor">
        <div className={hero.avatar} aria-hidden="true">
          {initials(mentor.name)}
        </div>

        <div className={hero.identity}>
          <h1 className={hero.name}>{mentor.name}</h1>
          <div className={hero.badges}>
            <span className={suspended ? `${hero.badgeStatus} ${hero.badgeSuspended}` : hero.badgeStatus} title={mentor.suspensionReason ?? undefined}>
              {mentor.status}
            </span>
            {approved ? <span className={hero.badgeOutline}>Approved: {approved}</span> : applied && <span className={hero.badgeOutline}>Applied: {applied}</span>}
          </div>
          <ul className={hero.contacts}>
            <li>
              <MailIcon size={16} color="#FFFFFF" strokeWidth={2} />
              <a href={`mailto:${mentor.email}`}>{mentor.email}</a>
            </li>
            {mentor.application.country && (
              <li>
                <MapPinIcon size={16} color="#FFFFFF" strokeWidth={2} />
                <span>{mentor.application.country}</span>
              </li>
            )}
          </ul>
        </div>

        <div className={hero.actions}>
          <button
            type="button"
            className={`${hero.action} ${hero.actionAssign}`}
            onClick={() => setModal("role")}
            disabled={mentor.programs.length === 0}
            title={mentor.programs.length ? undefined : "Assign the mentor to a program first"}
            aria-haspopup="dialog"
          >
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
              disabled={reinstate.isPending}
              onClick={() =>
                reinstate.mutate(undefined, {
                  onSuccess: () => setToast(`${mentor.name} has been reactivated.`),
                  onError: (e) => setToast(`Couldn't reactivate: ${errorText(e)}`),
                })
              }
            >
              <BanIcon size={16} color="#364153" strokeWidth={2} />
              {reinstate.isPending ? "Reactivating…" : "Reactivate"}
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
          onConfirm={async (reason) => {
            await suspend.mutateAsync(reason);
            setModal(null);
            setToast(`${mentor.name} has been suspended.`);
          }}
        />
      )}
      {modal === "notify" && (
        <NotifyModal
          onClose={close}
          onSend={async (subject, message) => {
            await notify.mutateAsync({ subject, message });
            setModal(null);
            setToast(`Notification sent to ${mentor.name}.`);
          }}
        />
      )}
      {modal === "role" && (
        <AssignMentorToProgramModal title="Edit Role" mentorName={mentor.name} programs={currentOptions} current={roles} onClose={close} onSave={save} />
      )}
      {modal === "assign" && (
        <AssignMentorToProgramModal mentorName={mentor.name} programs={assignOptions} current={roles} onClose={close} onSave={save} />
      )}
      {toast && <Toast message={toast} onDone={clearToast} />}
    </>
  );
}
