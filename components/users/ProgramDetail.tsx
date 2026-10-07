"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import {
  ActivityIcon,
  CalendarIcon,
  ClockIcon,
  DollarSignIcon,
  FileTextIcon,
  LaptopIcon,
  MessageSquareIcon,
  VideoIcon,
} from "@/components/app/icons";
import StudentHero from "./StudentHero";
import { DEFAULT_ACTIVITY, type ActivityKind, type Person, type Program, type Student } from "./data";
import styles from "./ProgramDetail.module.css";

const TABS = ["overview", "performance", "engagement", "loan", "campaign"] as const;
type Tab = (typeof TABS)[number];

const ACTIVITY_ICON: Record<ActivityKind, React.ReactNode> = {
  submission: <FileTextIcon size={16} color="#155DFC" />,
  session: <VideoIcon size={16} color="#00A63E" />,
  payment: <DollarSignIcon size={16} color="#00A63E" />,
  login: <ActivityIcon size={16} color="#4A5565" />,
  message: <MessageSquareIcon size={16} color="#155DFC" />,
};

function PersonCard({ person, role, tone }: { person: Person | null; role: string; tone: "mentor" | "advisor" }) {
  return (
    <div className={styles.person}>
      <div className={`${styles.photo} ${styles[tone]}`}>
        {person ? (
          <Image
            className={tone === "mentor" ? styles.photoMentor : styles.photoAdvisor}
            src={person.photo}
            alt={person.name}
            width={200}
            height={tone === "mentor" ? 200 : 181}
          />
        ) : (
          <span className={styles.photoEmpty} aria-hidden="true">?</span>
        )}
      </div>
      <p className={person ? styles.personName : `${styles.personName} ${styles.unassigned}`}>{person?.name ?? "Unassigned"}</p>
      <span className={`${styles.role} ${styles[`${tone}Role`]}`}>{role}</span>
    </div>
  );
}

function Overview({ student, program }: { student: Student; program: Program }) {
  const activity = program.activity ?? DEFAULT_ACTIVITY;
  return (
    <div className={styles.overview}>
      <div className={styles.activity}>
        <h2 className={styles.heading}>Recent Activity</h2>
        <ul className={styles.activityList}>
          {activity.map((a) => (
            <li key={`${a.title}-${a.date}-${a.time}`} className={styles.activityItem}>
              <span className={styles.activityIcon}>{ACTIVITY_ICON[a.kind]}</span>
              <div className={styles.activityBody}>
                <p className={styles.activityTitle}>{a.title}</p>
                <p className={styles.activityMeta}>
                  <CalendarIcon size={14} color="#4A5565" strokeWidth={1.67} />
                  <time dateTime={a.date}>{a.date}</time>
                  <ClockIcon size={14} color="#4A5565" strokeWidth={1.67} />
                  <span>{a.time}</span>
                </p>
              </div>
              <span className={styles.status}>{a.status}</span>
            </li>
          ))}
        </ul>
      </div>

      <aside className={styles.side}>
        <div className={styles.people}>
          <PersonCard person={program.mentor} role="Mentor" tone="mentor" />
          <PersonCard person={program.advisor} role="Program Advisor" tone="advisor" />
        </div>

        <div className={`${styles.info} ${styles.infoFunding}`}>
          <h3 className={styles.infoTitle}>
            <DollarSignIcon size={18} color="#9810FA" />
            <span>Funding</span>
          </h3>
          <p className={styles.infoText}>{student.payment}</p>
        </div>

        <div className={`${styles.info} ${styles.infoLaptop}`}>
          <h3 className={styles.infoTitle}>
            <LaptopIcon size={18} color="#00A63E" />
            <span>Laptop</span>
          </h3>
          <p className={styles.infoText}>{student.hasLaptop ? "Provided" : "Not provided"}</p>
        </div>

        <div className={`${styles.info} ${styles.infoActive}`}>
          <h3 className={styles.infoTitle}>
            <ActivityIcon size={18} color="#4A5565" strokeWidth={1.5} />
            <span>Last Active</span>
          </h3>
          <p className={styles.infoText}>{student.lastActive}</p>
        </div>
      </aside>
    </div>
  );
}

export default function ProgramDetail({ student, program }: { student: Student; program: Program }) {
  const [tab, setTab] = useState<Tab>("overview");

  return (
    <div className={styles.page}>
      <div className={styles.backRow}>
        <Link href={`/user-management/${student.id}`} className={styles.back}>
          ← Back
        </Link>
      </div>

      <StudentHero student={student} subtitle={program.programName} />

      <section className={styles.card} aria-label={`${program.title} details`}>
        <div className={styles.tabs} role="tablist" aria-label="Program details">
          {TABS.map((t) => (
            <button
              key={t}
              type="button"
              role="tab"
              id={`tab-${t}`}
              aria-selected={tab === t}
              aria-controls={`panel-${t}`}
              className={`${styles.tab} ${styles[`tab_${t}`]} ${tab === t ? styles.tabActive : ""}`}
              onClick={() => setTab(t)}
            >
              {t}
            </button>
          ))}
        </div>

        <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`}>
          {tab === "overview" ? (
            <Overview student={student} program={program} />
          ) : (
            <p className={styles.soon}>
              The <span className={styles.soonTab}>{tab}</span> view is coming soon.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
