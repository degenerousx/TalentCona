import Link from "next/link";
import { StarIcon } from "@/components/icons";
import { minutesLabel, shortDate, type MentorProgramDetail } from "../api";
import styles from "./MentorPerformance.module.css";

export default function MentorPerformance({ detail }: { detail: MentorProgramDetail }) {
  const stats = [
    { label: "Sessions Completed", value: String(detail.sessionsCompleted), tone: styles.blue },
    { label: "Avg Duration", value: minutesLabel(detail.averageDuration) ?? "—", tone: styles.purple },
    { label: "Response Time", value: minutesLabel(detail.averageResponse) ?? "—", tone: styles.green },
  ];
  const rating = detail.averageRating;

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
          <p className={styles.rating} aria-label={rating != null ? `${rating} out of 5` : "Not rated yet"}>
            <StarIcon size={24} color="#F0B100" />
            <span>{rating != null ? Math.round(rating * 10) / 10 : "—"}</span>
          </p>
        </div>
      </div>

      <h2 className={styles.heading}>Current Mentees</h2>

      <div className={styles.listWrap}>
        {detail.mentees.length > 0 ? (
          <ul className={styles.list}>
            {detail.mentees.map((m, i) => (
              <li key={m.id ?? `${m.name}-${i}`} className={styles.mentee}>
                <div className={styles.who}>
                  <span className={styles.avatar} aria-hidden="true">
                    {m.name.trim().charAt(0).toUpperCase()}
                  </span>
                  <div className={styles.text}>
                    {m.id ? (
                      <Link href={m.enrollmentId ? `/user-management/${m.id}/${m.enrollmentId}` : `/user-management/${m.id}`} className={`${styles.name} ${styles.nameLink}`}>
                        {m.name}
                      </Link>
                    ) : (
                      <span className={styles.name}>{m.name}</span>
                    )}
                    {m.progress != null && <span className={styles.meta}>Progress: {Math.round(m.progress)}%</span>}
                  </div>
                </div>
                <span className={styles.meta}>Last session: {m.lastSessionAt ? <time dateTime={m.lastSessionAt}>{shortDate(m.lastSessionAt)}</time> : "none yet"}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className={styles.none}>No mentees assigned yet.</p>
        )}
      </div>
    </div>
  );
}
