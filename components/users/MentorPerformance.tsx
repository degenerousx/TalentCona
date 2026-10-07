import Link from "next/link";
import { StarIcon } from "@/components/app/icons";
import { STUDENTS } from "./data";
import { DEFAULT_MENTEES, type MentorProfile } from "./mentors";
import styles from "./MentorPerformance.module.css";

/** Mentee names link to their student profile when one exists. */
const studentIdOf = (name: string) => STUDENTS.find((s) => s.name === name)?.id;

export default function MentorPerformance({ mentor }: { mentor: MentorProfile }) {
  const mentees = mentor.mentees ?? DEFAULT_MENTEES;
  const stats = [
    { label: "Sessions Completed", value: String(mentor.sessionsCompleted), tone: styles.blue },
    { label: "Avg Duration", value: mentor.avgSession, tone: styles.purple },
    { label: "Response Time", value: mentor.responseTime, tone: styles.green },
  ];

  return (
    <div className={styles.panel}>
      <div className={styles.stats}>
        {stats.map((s) => (
          <div key={s.label} className={`${styles.stat} ${s.tone}`}>
            <p className={styles.label}>{s.label}</p>
            <p className={styles.value}>{s.value}</p>
          </div>
        ))}
        <div className={`${styles.stat} ${styles.yellow}`}>
          <p className={styles.label}>Satisfaction</p>
          <p className={styles.rating} aria-label={`${mentor.satisfaction} out of 5`}>
            <StarIcon size={24} color="#F0B100" />
            <span>{mentor.satisfaction}</span>
          </p>
        </div>
      </div>

      <h2 className={styles.heading}>Current Mentees</h2>

      <div className={styles.listWrap}>
        {mentees.length > 0 ? (
          <ul className={styles.list}>
            {mentees.map((m) => {
              const id = studentIdOf(m.name);
              return (
                <li key={m.name} className={styles.mentee}>
                  <div className={styles.who}>
                    <span className={styles.avatar} aria-hidden="true">
                      M
                    </span>
                    <div className={styles.text}>
                      {id ? (
                        <Link href={`/user-management/${id}`} className={`${styles.name} ${styles.nameLink}`}>
                          {m.name}
                        </Link>
                      ) : (
                        <span className={styles.name}>{m.name}</span>
                      )}
                      <span className={styles.meta}>Progress: {m.progress}%</span>
                    </div>
                  </div>
                  <span className={styles.meta}>
                    Last session: <time dateTime={m.lastSession}>{m.lastSession}</time>
                  </span>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className={styles.none}>No mentees assigned yet.</p>
        )}
      </div>
    </div>
  );
}
