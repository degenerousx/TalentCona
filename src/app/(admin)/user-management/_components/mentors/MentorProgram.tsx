"use client";

import Link from "next/link";
import { useState } from "react";
import { AwardIcon, CalendarIcon, ClockIcon, FileTextIcon, MessageSquareIcon, UsersIcon, VideoIcon } from "@/components/icons";
import MentorHero from "./MentorHero";
import MentorPerformance from "./MentorPerformance";
import PageState from "../shared/PageState";
import PanelState from "../shared/PanelState";
import { clockTime, minutesLabel, roleLabel, useMentor, useMentorProgram, type MentorDetail, type MentorProgramDetail } from "../api";
import base from "../students/ProgramDetail.module.css";
import styles from "./MentorProgram.module.css";

const TABS = ["overview", "performance"] as const;
type Tab = (typeof TABS)[number];

function Overview({ mentor, detail }: { mentor: MentorDetail; detail: MentorProgramDetail }) {
  return (
    <div className={`${base.overview} ${styles.overview}`}>
      <div className={base.activity}>
        <h2 className={base.heading}>Recent Activity</h2>
        {detail.activity.length === 0 ? (
          <p className={base.emptyNote}>No sessions or feedback in this program yet.</p>
        ) : (
          <ul className={base.activityList}>
            {detail.activity.map((a) => (
              <li key={a.id} className={base.activityItem}>
                <span className={base.activityIcon}>
                  {a.kind === "session" ? <VideoIcon size={16} color="#00A63E" /> : <FileTextIcon size={16} color="#9810FA" />}
                </span>
                <div className={base.activityBody}>
                  <p className={base.activityTitle}>{a.title}</p>
                  {a.at && (
                    <p className={base.activityMeta}>
                      <CalendarIcon size={14} color="#4A5565" strokeWidth={1.67} />
                      <time dateTime={a.at}>{a.at.slice(0, 10)}</time>
                      <ClockIcon size={14} color="#4A5565" strokeWidth={1.67} />
                      <span>{clockTime(a.at)}</span>
                    </p>
                  )}
                </div>
                {a.status && <span className={base.status}>{a.status}</span>}
              </li>
            ))}
          </ul>
        )}
      </div>

      <aside className={base.side}>
        <div className={styles.expertise}>
          <h3 className={base.infoTitle}>
            <AwardIcon size={18} color="#155DFC" strokeWidth={1.5} />
            <span>Expertise</span>
          </h3>
          <ul className={styles.chips}>
            {mentor.application.expertise.length === 0 && <li className={styles.chip}>Not provided</li>}
            {mentor.application.expertise.map((e) => (
              <li key={e.label} className={styles.chip}>
                {e.label}
                {e.years ? ` - ${e.years} ${e.years === 1 ? "year" : "years"}` : ""}
              </li>
            ))}
          </ul>
        </div>

        <div className={`${base.info} ${base.infoFunding}`}>
          <h3 className={base.infoTitle}>
            <ClockIcon size={18} color="#9810FA" strokeWidth={1.5} />
            <span>Avg Session</span>
          </h3>
          <p className={base.infoText}>{minutesLabel(detail.averageDuration) ?? "No sessions yet"}</p>
        </div>

        <div className={`${base.info} ${base.infoLaptop}`}>
          <h3 className={base.infoTitle}>
            <MessageSquareIcon size={18} color="#00A63E" strokeWidth={1.5} />
            <span>Response Time</span>
          </h3>
          <p className={base.infoText}>{minutesLabel(detail.averageResponse) ?? "Not measured yet"}</p>
        </div>

        <div className={`${base.info} ${base.infoActive}`}>
          <h3 className={base.infoTitle}>
            <UsersIcon size={18} color="#4A5565" strokeWidth={1.5} />
            <span>Mentees</span>
          </h3>
          <p className={base.infoText}>{detail.mentees.length}</p>
        </div>
      </aside>
    </div>
  );
}

export default function MentorProgram({ mentorId, programId }: { mentorId: string; programId: string }) {
  const [tab, setTab] = useState<Tab>("overview");
  const mentorQuery = useMentor(mentorId);
  const programQuery = useMentorProgram(mentorId, programId);
  const mentor = mentorQuery.data;
  const backHref = `/user-management/mentors/${mentorId}`;
  if (!mentor) return <PageState query={mentorQuery} noun="mentor" backHref="/user-management#mentors" />;
  const link = mentor.programs.find((p) => p.programId === programId);
  const detail = programQuery.data;

  return (
    <div className={base.page}>
      <div className={base.backRow}>
        <Link href={backHref} className={base.back}>
          ← Back
        </Link>
      </div>

      <MentorHero mentor={mentor} />

      <section className={base.card} aria-label={link ? `${link.title} (${roleLabel(link)})` : "Program"}>
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

        {!detail ? (
          <PanelState query={programQuery} noun="this program" />
        ) : (
          <>
            <div role="tabpanel" id="panel-overview" aria-labelledby="tab-overview" hidden={tab !== "overview"}>
              <Overview mentor={mentor} detail={detail} />
            </div>
            <div role="tabpanel" id="panel-performance" aria-labelledby="tab-performance" hidden={tab !== "performance"}>
              <MentorPerformance detail={detail} />
            </div>
          </>
        )}
      </section>
    </div>
  );
}
