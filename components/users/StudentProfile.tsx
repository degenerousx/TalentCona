"use client";

import Link from "next/link";
import { useState } from "react";
import { BanIcon, MailIcon, MapPinIcon, PhoneIcon, SendIcon, SquarePenIcon } from "@/components/app/icons";
import { initials, type Student } from "./data";
import styles from "./StudentProfile.module.css";

export default function StudentProfile({ student }: { student: Student }) {
  // The first current program starts selected, as in the design.
  const [selected, setSelected] = useState(student.currentPrograms[0]?.title ?? null);

  return (
    <div className={styles.page}>
      <div className={styles.backRow}>
        <Link href="/user-management" className={styles.back}>
          ← Back
        </Link>
      </div>

      <section className={styles.hero} aria-label="Student">
        <div className={styles.avatar} aria-hidden="true">
          {initials(student.name)}
        </div>

        <div className={styles.identity}>
          <h1 className={styles.name}>{student.name}</h1>
          <div className={styles.badges}>
            <span className={styles.badgeStatus}>{student.status}</span>
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
          <button type="button" className={`${styles.action} ${styles.actionAssign}`}>
            <SquarePenIcon size={16} color="#364153" strokeWidth={2} />
            Assign Mentor
          </button>
          <button type="button" className={styles.action}>
            <SendIcon size={16} color="#364153" strokeWidth={2} />
            Notify
          </button>
          <button type="button" className={`${styles.action} ${styles.actionDanger}`}>
            <BanIcon size={16} color="#C10007" strokeWidth={2} />
            Suspend
          </button>
        </div>
      </section>

      <section className={styles.card} aria-labelledby="enrollments-title">
        <h2 id="enrollments-title" className={styles.cardTitle}>
          Program Enrollments
        </h2>

        <div className={`${styles.group} ${styles.groupCurrent}`}>
          <h3 className={styles.groupTitle}>Current Programs ({student.currentPrograms.length})</h3>
          {student.currentPrograms.length > 0 ? (
            <div className={styles.programs}>
              {student.currentPrograms.map((p) => (
                <button
                  key={p.title}
                  type="button"
                  className={`${styles.program} ${selected === p.title ? styles.programSelected : ""}`}
                  aria-pressed={selected === p.title}
                  onClick={() => setSelected(p.title)}
                >
                  <span className={styles.programHead}>
                    <span className={styles.programTitle}>{p.title}</span>
                    <span className={`${styles.pill} ${styles.pillActive}`}>Active</span>
                  </span>
                  <span className={styles.metric}>
                    Progress:<strong>{p.progress}%</strong>
                  </span>
                  <span
                    className={styles.track}
                    role="progressbar"
                    aria-valuenow={p.progress}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`${p.title} progress`}
                  >
                    <span className={styles.fill} style={{ width: `${p.progress}%` }} />
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <p className={styles.none}>No current programs.</p>
          )}
        </div>

        <div className={styles.group}>
          <h3 className={styles.groupTitle}>Completed Programs ({student.completedPrograms.length})</h3>
          {student.completedPrograms.length > 0 ? (
            <div className={`${styles.programs} ${styles.completed}`}>
              {student.completedPrograms.map((p) => (
                <div key={p.title} className={`${styles.program} ${styles.programDone}`}>
                  <span className={styles.programHead}>
                    <span className={styles.programTitle}>{p.title}</span>
                    <span className={`${styles.pill} ${styles.pillDone}`}>Completed</span>
                  </span>
                  <span className={styles.metric}>
                    Score:<strong>{p.score}%</strong>
                  </span>
                  <span className={styles.completedOn}>Completed: {p.completedOn}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className={styles.none}>No completed programs yet.</p>
          )}
        </div>
      </section>
    </div>
  );
}
