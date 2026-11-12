"use client";

import { ActivityIcon, PeopleCommunityIcon, VideoIcon } from "@/components/icons";
import PanelState from "../shared/PanelState";
import { timeAgo, useEngagement } from "../api";
import styles from "./EngagementPanel.module.css";

export default function EngagementPanel({ studentId, enrollmentId, name }: { studentId: string; enrollmentId: string; name: string }) {
  const query = useEngagement(studentId, enrollmentId);
  const e = query.data;
  if (!e) return <PanelState query={query} noun="engagement" />;

  return (
    <div className={styles.panel}>
      <div className={styles.stats}>
        <div className={`${styles.stat} ${styles.statBlue}`}>
          <VideoIcon size={32} color="#155DFC" />
          <p className={styles.value}>{e.sessions}</p>
          <p className={styles.label}>Sessions Completed</p>
        </div>
        <div className={`${styles.stat} ${styles.statPurple}`}>
          <PeopleCommunityIcon size={32} color="#9810FA" />
          <p className={styles.value}>{e.communities}</p>
          <p className={styles.label}>Communities</p>
        </div>
      </div>

      <section className={styles.overview} aria-labelledby="engagement-title">
        <h3 id="engagement-title" className={styles.title}>
          Engagement Overview
        </h3>
        <p className={styles.summary}>
          {name} has completed {e.sessions} mentorship {e.sessions === 1 ? "session" : "sessions"} and is in {e.communities}{" "}
          {e.communities === 1 ? "community" : "communities"}.
        </p>
        {e.overview.length > 0 && (
          <ul className={styles.list}>
            {e.overview.map((o) => (
              <li key={o.key} className={styles.item}>
                <span>
                  <span className={`${styles.dot} ${o.active ? styles.dotOn : ""}`} aria-label={o.active ? "Active" : "Inactive"} />
                  {o.label}
                  {o.facts.length > 0 && <span className={styles.itemMeta}> · {o.facts.join(" · ")}</span>}
                </span>
                <span className={styles.itemMeta}>{o.lastActivityAt ? `Last: ${timeAgo(o.lastActivityAt)}` : "No activity"}</span>
              </li>
            ))}
          </ul>
        )}
        <p className={styles.lastActive}>
          <ActivityIcon size={16} color="#4A5565" strokeWidth={1.67} />
          Last active: {timeAgo(e.lastActiveAt) ?? "no activity yet"}
        </p>
      </section>
    </div>
  );
}
