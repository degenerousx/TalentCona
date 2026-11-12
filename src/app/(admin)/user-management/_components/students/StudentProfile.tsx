"use client";

import Link from "next/link";
import StudentHero from "./StudentHero";
import PageState from "../shared/PageState";
import { humanize, shortDate, useStudent, type EnrollmentSummary } from "../api";
import styles from "./StudentProfile.module.css";

function ProgramCard({ studentId, p, featured }: { studentId: string; p: EnrollmentSummary; featured: boolean }) {
  return (
    <Link href={`/user-management/${studentId}/${p.enrollmentId}`} className={`${styles.program} ${featured ? styles.programSelected : ""}`}>
      <span className={styles.programHead}>
        <span className={styles.programTitle}>{p.title}</span>
        <span className={`${styles.pill} ${styles.pillActive}`}>{p.status === "Active" ? "Active" : humanize(p.status)}</span>
      </span>
      <span className={styles.metric}>
        Progress:<strong>{p.progress}%</strong>
      </span>
      <span className={styles.track} role="progressbar" aria-valuenow={p.progress} aria-valuemin={0} aria-valuemax={100} aria-label={`${p.title} progress`}>
        <span className={styles.fill} style={{ width: `${p.progress}%` }} />
      </span>
    </Link>
  );
}

function DoneCard({ studentId, p, label }: { studentId: string; p: EnrollmentSummary; label: string }) {
  return (
    <Link href={`/user-management/${studentId}/${p.enrollmentId}`} className={`${styles.program} ${styles.programDone}`}>
      <span className={styles.programHead}>
        <span className={styles.programTitle}>{p.title}</span>
        <span className={`${styles.pill} ${styles.pillDone}`}>{label}</span>
      </span>
      <span className={styles.metric}>
        Score:<strong>{p.finalScore != null ? `${p.finalScore}%` : "—"}</strong>
      </span>
      {p.completedAt && <span className={styles.completedOn}>Completed: {shortDate(p.completedAt)}</span>}
    </Link>
  );
}

export default function StudentProfile({ studentId }: { studentId: string }) {
  const query = useStudent(studentId);
  const student = query.data;
  if (!student) return <PageState query={query} noun="student" backHref="/user-management" />;

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
          <h3 className={styles.groupTitle}>Current Programs ({student.current.length})</h3>
          {student.current.length > 0 ? (
            <div className={styles.programs}>
              {student.current.map((p, i) => (
                <ProgramCard key={p.enrollmentId} studentId={student.id} p={p} featured={i === 0} />
              ))}
            </div>
          ) : (
            <p className={styles.none}>No current programs.</p>
          )}
        </div>

        <div className={styles.group}>
          <h3 className={styles.groupTitle}>Completed Programs ({student.completed.length})</h3>
          {student.completed.length > 0 ? (
            <div className={`${styles.programs} ${styles.completed}`}>
              {student.completed.map((p) => (
                <DoneCard key={p.enrollmentId} studentId={student.id} p={p} label="Completed" />
              ))}
            </div>
          ) : (
            <p className={styles.none}>No completed programs yet.</p>
          )}
        </div>

        {student.closed.length > 0 && (
          <div className={styles.group}>
            <h3 className={styles.groupTitle}>Closed Programs ({student.closed.length})</h3>
            <div className={`${styles.programs} ${styles.completed}`}>
              {student.closed.map((p) => (
                <DoneCard key={p.enrollmentId} studentId={student.id} p={p} label={humanize(p.status) || "Closed"} />
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
