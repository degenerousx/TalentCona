"use client";

import Link from "next/link";
import MentorHero from "./MentorHero";
import PageState from "../shared/PageState";
import { roleLabel, shortDate, useMentor, type MentorDetail, type MentorProgramLink } from "../api";
import styles from "./MentorProfile.module.css";

function AssignmentCard({ a, href, featured }: { a: MentorProgramLink; href: string; featured?: boolean }) {
  return (
    <Link href={href} className={`${styles.program} ${featured ? styles.programSelected : ""}`}>
      <span className={styles.programTitle}>{a.title}</span>
      <span className={styles.meta}>
        <span>
          Date Assigned: <strong>{shortDate(a.assignedAt) ?? "—"}</strong>
        </span>
        <span>
          Role: <strong>{roleLabel(a)}</strong>
        </span>
        <span>
          Number of Mentees: <strong>{a.mentees}</strong>
        </span>
      </span>
    </Link>
  );
}

function Summary({ mentor }: { mentor: MentorDetail }) {
  return (
    <p className={styles.none}>
      Mentees: <strong>{mentor.maxMentees != null ? `${mentor.mentees}/${mentor.maxMentees}` : mentor.mentees}</strong>
      {" · "}Average rating: <strong>{mentor.ratingCount ? `${mentor.averageRating ?? 0}/5 (${mentor.ratingCount})` : "no ratings yet"}</strong>
    </p>
  );
}

export default function MentorProfile({ mentorId }: { mentorId: string }) {
  const query = useMentor(mentorId);
  const mentor = query.data;
  if (!mentor) return <PageState query={query} noun="mentor" backHref="/user-management#mentors" />;

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
        <Summary mentor={mentor} />

        <div className={`${styles.group} ${styles.groupCurrent}`}>
          <h3 className={styles.groupTitle}>Current Programs ({mentor.programs.length})</h3>
          {mentor.programs.length > 0 ? (
            <div className={styles.programs}>
              {mentor.programs.map((a, i) => (
                <AssignmentCard key={a.programId} a={a} featured={i === 0} href={`/user-management/mentors/${mentor.id}/${a.programId}`} />
              ))}
            </div>
          ) : (
            <p className={styles.none}>No programs assigned yet. Use Assign Mentor above to add one.</p>
          )}
        </div>
      </section>
    </div>
  );
}
