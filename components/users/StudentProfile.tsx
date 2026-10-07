import Link from "next/link";
import StudentHero from "./StudentHero";
import type { Student } from "./data";
import styles from "./StudentProfile.module.css";

export default function StudentProfile({ student }: { student: Student }) {
  // The first current program is highlighted, as in the design.
  const featured = student.currentPrograms[0]?.id;
  const programHref = (id: string) => `/user-management/${student.id}/${id}`;

  return (
    <div className={styles.page}>
      <div className={styles.backRow}>
        <Link href="/user-management" className={styles.back}>
          ← Back
        </Link>
      </div>

      <StudentHero student={student} />

      <section className={styles.card} aria-labelledby="enrollments-title">
        <h2 id="enrollments-title" className={styles.cardTitle}>
          Program Enrollments
        </h2>

        <div className={`${styles.group} ${styles.groupCurrent}`}>
          <h3 className={styles.groupTitle}>Current Programs ({student.currentPrograms.length})</h3>
          {student.currentPrograms.length > 0 ? (
            <div className={styles.programs}>
              {student.currentPrograms.map((p) => (
                <Link
                  key={p.id}
                  href={programHref(p.id)}
                  className={`${styles.program} ${featured === p.id ? styles.programSelected : ""}`}
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
                </Link>
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
                <Link key={p.id} href={programHref(p.id)} className={`${styles.program} ${styles.programDone}`}>
                  <span className={styles.programHead}>
                    <span className={styles.programTitle}>{p.title}</span>
                    <span className={`${styles.pill} ${styles.pillDone}`}>Completed</span>
                  </span>
                  <span className={styles.metric}>
                    Score:<strong>{p.score}%</strong>
                  </span>
                  <span className={styles.completedOn}>Completed: {p.completedOn}</span>
                </Link>
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
