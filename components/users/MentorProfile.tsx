import Link from "next/link";
import MentorHero from "./MentorHero";
import { programSlug, type MentorAssignment, type MentorProfile as Mentor } from "./mentors";
import styles from "./MentorProfile.module.css";

function AssignmentCard({
  a,
  href,
  featured,
}: {
  a: MentorAssignment;
  /** Current programs link to the mentor's program page; history cards are static. */
  href?: string;
  featured?: boolean;
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

  return href ? (
    <Link href={href} className={`${styles.program} ${featured ? styles.programSelected : ""}`}>
      {body}
    </Link>
  ) : (
    <div className={styles.program}>{body}</div>
  );
}

export default function MentorProfile({ mentor }: { mentor: Mentor }) {
  // The first current program is highlighted, as in the design.

  return (
    <div className={styles.page}>
      <div className={styles.backRow}>
        <Link href="/user-management#mentors" className={styles.back}>
          ← Back
        </Link>
      </div>

      <MentorHero mentor={mentor} />

      <section className={styles.card} aria-labelledby="programs-assigned">
        <h2 id="programs-assigned" className={styles.cardTitle}>
          Programs Assigned
        </h2>

        <div className={`${styles.group} ${styles.groupCurrent}`}>
          <h3 className={styles.groupTitle}>Current Programs ({mentor.current.length})</h3>
          {mentor.current.length > 0 ? (
            <div className={styles.programs}>
              {mentor.current.map((a, i) => (
                <AssignmentCard
                  key={`${a.program}-${a.role}`}
                  a={a}
                  featured={i === 0}
                  href={`/user-management/mentors/${mentor.id}/${programSlug(a.program)}`}
                />
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

    </div>
  );
}
