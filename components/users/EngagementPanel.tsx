import { ActivityIcon, PeopleCommunityIcon, VideoIcon } from "@/components/app/icons";
import type { Student } from "./data";
import styles from "./EngagementPanel.module.css";

export default function EngagementPanel({ student }: { student: Student }) {
  const { sessions, communities } = student.engagement;

  return (
    <div className={styles.panel}>
      <div className={styles.stats}>
        <div className={`${styles.stat} ${styles.statBlue}`}>
          <VideoIcon size={32} color="#155DFC" />
          <p className={styles.value}>{sessions}</p>
          <p className={styles.label}>Total Sessions</p>
        </div>
        <div className={`${styles.stat} ${styles.statPurple}`}>
          <PeopleCommunityIcon size={32} color="#9810FA" />
          <p className={styles.value}>{communities}</p>
          <p className={styles.label}>Communities</p>
        </div>
      </div>

      <section className={styles.overview} aria-labelledby="engagement-title">
        <h3 id="engagement-title" className={styles.title}>
          Engagement Overview
        </h3>
        <p className={styles.summary}>
          {student.name} has been actively participating in the program with {sessions} mentorship sessions and{" "}
          {communities} communities.
        </p>
        <p className={styles.lastActive}>
          <ActivityIcon size={16} color="#4A5565" strokeWidth={1.67} />
          Last active: {student.lastActive}
        </p>
      </section>
    </div>
  );
}
