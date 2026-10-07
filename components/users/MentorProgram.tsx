"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ActivityIcon,
  AwardIcon,
  CalendarIcon,
  ClockIcon,
  FileTextIcon,
  MessageSquareIcon,
  UsersIcon,
  VideoIcon,
} from "@/components/app/icons";
import MentorHero from "./MentorHero";
import { DEFAULT_MENTOR_ACTIVITY, type MentorActivityKind, type MentorAssignment, type MentorProfile } from "./mentors";
import base from "./ProgramDetail.module.css";
import styles from "./MentorProgram.module.css";

const TABS = ["overview", "performance"] as const;
type Tab = (typeof TABS)[number];

const ACTIVITY_ICON: Record<MentorActivityKind, React.ReactNode> = {
  session: <VideoIcon size={16} color="#00A63E" />,
  feedback: <FileTextIcon size={16} color="#9810FA" />,
  meeting: <UsersIcon size={16} color="#4F39F6" />,
  login: <ActivityIcon size={16} color="#4A5565" />,
  submission: <FileTextIcon size={16} color="#155DFC" />,
  message: <MessageSquareIcon size={16} color="#155DFC" />,
};

function Overview({ mentor }: { mentor: MentorProfile }) {
  const activity = mentor.activity ?? DEFAULT_MENTOR_ACTIVITY;
  return (
    <div className={`${base.overview} ${styles.overview}`}>
      <div className={base.activity}>
        <h2 className={base.heading}>Recent Activity</h2>
        <ul className={base.activityList}>
          {activity.map((a) => (
            <li key={`${a.title}-${a.date}-${a.time}`} className={base.activityItem}>
              <span className={base.activityIcon}>{ACTIVITY_ICON[a.kind]}</span>
              <div className={base.activityBody}>
                <p className={base.activityTitle}>{a.title}</p>
                <p className={base.activityMeta}>
                  <CalendarIcon size={14} color="#4A5565" strokeWidth={1.67} />
                  <time dateTime={a.date}>{a.date}</time>
                  <ClockIcon size={14} color="#4A5565" strokeWidth={1.67} />
                  <span>{a.time}</span>
                </p>
              </div>
              <span className={base.status}>{a.status}</span>
            </li>
          ))}
        </ul>
      </div>

      <aside className={base.side}>
        <div className={styles.expertise}>
          <h3 className={base.infoTitle}>
            <AwardIcon size={18} color="#155DFC" strokeWidth={1.5} />
            <span>Expertise</span>
          </h3>
          <ul className={styles.chips}>
            {mentor.expertise.map((e) => (
              <li key={e.skill} className={styles.chip}>
                {e.skill} - {e.years} {e.years === 1 ? "year" : "years"}
              </li>
            ))}
          </ul>
        </div>

        <div className={`${base.info} ${base.infoFunding}`}>
          <h3 className={base.infoTitle}>
            <ClockIcon size={18} color="#9810FA" strokeWidth={1.5} />
            <span>Avg Session</span>
          </h3>
          <p className={base.infoText}>{mentor.avgSession}</p>
        </div>

        <div className={`${base.info} ${base.infoLaptop}`}>
          <h3 className={base.infoTitle}>
            <MessageSquareIcon size={18} color="#00A63E" strokeWidth={1.5} />
            <span>Response Time</span>
          </h3>
          <p className={base.infoText}>{mentor.responseTime}</p>
        </div>

        <div className={`${base.info} ${base.infoActive}`}>
          <h3 className={base.infoTitle}>
            <ActivityIcon size={18} color="#4A5565" strokeWidth={1.5} />
            <span>Last Active</span>
          </h3>
          <p className={base.infoText}>{mentor.lastActive}</p>
        </div>
      </aside>
    </div>
  );
}

export default function MentorProgram({ mentor, assignment }: { mentor: MentorProfile; assignment: MentorAssignment }) {
  const [tab, setTab] = useState<Tab>("overview");

  return (
    <div className={base.page}>
      <div className={base.backRow}>
        <Link href={`/user-management/mentors/${mentor.id}`} className={base.back}>
          ← Back
        </Link>
      </div>

      <MentorHero mentor={mentor} />

      <section className={base.card} aria-label={`${assignment.program} (${assignment.role})`}>
        <div className={base.tabs} role="tablist" aria-label="Mentor program details">
          {TABS.map((t) => (
            <button
              key={t}
              type="button"
              role="tab"
              id={`tab-${t}`}
              aria-selected={tab === t}
              aria-controls={`panel-${t}`}
              className={`${base.tab} ${base[`tab_${t}`]}`}
              onClick={() => setTab(t)}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Every panel is rendered and toggled with `hidden`, so the markup works without JS too. */}
        <div role="tabpanel" id="panel-overview" aria-labelledby="tab-overview" hidden={tab !== "overview"}>
          <Overview mentor={mentor} />
        </div>
        <div role="tabpanel" id="panel-performance" aria-labelledby="tab-performance" hidden={tab !== "performance"}>
          <p className={styles.soon}>
            Performance for {mentor.name} on {assignment.program} is coming soon.
          </p>
        </div>
      </section>
    </div>
  );
}
