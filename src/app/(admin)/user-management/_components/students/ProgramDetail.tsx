"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ActivityIcon,
  AwardIcon,
  CalendarIcon,
  ClockIcon,
  DollarSignIcon,
  FileTextIcon,
  LaptopIcon,
  MessageSquareIcon,
  UsersIcon,
  VideoIcon,
} from "@/components/icons";
import CampaignPanel from "./CampaignPanel";
import EngagementPanel from "./EngagementPanel";
import LoanPanel from "./LoanPanel";
import PerformancePanel from "./PerformancePanel";
import StudentHero from "./StudentHero";
import PageState from "../shared/PageState";
import { clockTime, humanize, initials, timeAgo, useEnrollment, useStudent, type ActivityItem, type EnrollmentOverview, type PersonRef } from "../api";
import styles from "./ProgramDetail.module.css";

const TABS = ["overview", "performance", "engagement", "loan", "campaign"] as const;
type Tab = (typeof TABS)[number];

/** Icon for each backend activity action. */
const ACTIVITY_ICON: Record<string, React.ReactNode> = {
  PAYMENT_COMPLETED: <DollarSignIcon size={16} color="#00A63E" />,
  WALLET_ENROLLMENT_DEBITED: <DollarSignIcon size={16} color="#00A63E" />,
  MENTORSHIP_SESSION_COMPLETED: <VideoIcon size={16} color="#00A63E" />,
  MINI_PROJECT_SUBMITTED: <FileTextIcon size={16} color="#155DFC" />,
  FINAL_PROJECT_SUBMITTED: <FileTextIcon size={16} color="#155DFC" />,
  MENTORSHIP_CHAT_MESSAGE_SENT: <MessageSquareIcon size={16} color="#155DFC" />,
  MENTOR_MATCHED: <UsersIcon size={16} color="#4F39F6" />,
  CERTIFICATE_ISSUED: <AwardIcon size={16} color="#9810FA" />,
};

function PersonCard({ person, role, tone }: { person: PersonRef | null; role: string; tone: "mentor" | "advisor" }) {
  return (
    <div className={styles.person}>
      <div className={`${styles.photo} ${styles[tone]}`}>
        <span className={styles.photoEmpty} aria-hidden="true">
          {person ? initials(person.name) : "?"}
        </span>
      </div>
      <p className={person ? styles.personName : `${styles.personName} ${styles.unassigned}`}>{person?.name ?? "Unassigned"}</p>
      {person?.email && <p className={styles.personEmail}>{person.email}</p>}
      <span className={`${styles.role} ${styles[`${tone}Role`]}`}>{role}</span>
    </div>
  );
}

function Overview({
  overview,
  activity,
  hasMore,
  loadingMore,
  onMore,
}: {
  overview: EnrollmentOverview;
  activity: ActivityItem[];
  hasMore: boolean;
  loadingMore: boolean;
  onMore: () => void;
}) {
  const funding = [overview.payment, overview.amountPaid].filter(Boolean).join(" · ");
  return (
    <div className={styles.overview}>
      <div className={styles.activity}>
        <h2 className={styles.heading}>Recent Activity</h2>
        {activity.length === 0 ? (
          <p className={styles.emptyNote}>No activity recorded for this program yet.</p>
        ) : (
          <ul className={styles.activityList}>
            {activity.map((a) => (
              <li key={a.id} className={styles.activityItem}>
                <span className={styles.activityIcon}>{ACTIVITY_ICON[a.action] ?? <ActivityIcon size={16} color="#4A5565" />}</span>
                <div className={styles.activityBody}>
                  <p className={styles.activityTitle}>
                    {a.label}
                    {a.detail ? ` - ${a.detail}` : ""}
                  </p>
                  <p className={styles.activityMeta}>
                    <CalendarIcon size={14} color="#4A5565" strokeWidth={1.67} />
                    <time dateTime={a.createdAt}>{a.createdAt.slice(0, 10)}</time>
                    <ClockIcon size={14} color="#4A5565" strokeWidth={1.67} />
                    <span>{clockTime(a.createdAt)}</span>
                  </p>
                </div>
                <span className={styles.status}>completed</span>
              </li>
            ))}
          </ul>
        )}
        {hasMore && (
          <button type="button" className={styles.more} onClick={onMore} disabled={loadingMore}>
            {loadingMore ? "Loading…" : "Load more activity"}
          </button>
        )}
      </div>

      <aside className={styles.side}>
        <div className={styles.people}>
          <PersonCard person={overview.mentor} role="Instructor" tone="mentor" />
          <PersonCard person={overview.advisor} role="Program Advisor" tone="advisor" />
        </div>

        <div className={`${styles.info} ${styles.infoFunding}`}>
          <h3 className={styles.infoTitle}>
            <DollarSignIcon size={18} color="#9810FA" />
            <span>Funding</span>
          </h3>
          <p className={styles.infoText}>{funding || "No payment recorded"}</p>
        </div>

        <div className={`${styles.info} ${styles.infoLaptop}`}>
          <h3 className={styles.infoTitle}>
            <LaptopIcon size={18} color="#00A63E" />
            <span>Laptop</span>
          </h3>
          <p className={styles.infoText}>{overview.laptop ? "Included" : "Not included"}</p>
        </div>

        <div className={`${styles.info} ${styles.infoActive}`}>
          <h3 className={styles.infoTitle}>
            <ActivityIcon size={18} color="#4A5565" strokeWidth={1.5} />
            <span>Last Active</span>
          </h3>
          <p className={styles.infoText}>{timeAgo(overview.lastActiveAt) ?? "No activity yet"}</p>
        </div>
      </aside>
    </div>
  );
}

export default function ProgramDetail({ studentId, enrollmentId }: { studentId: string; enrollmentId: string }) {
  const [tab, setTab] = useState<Tab>("overview");
  // Panels load when first opened, then stay mounted.
  const [seen, setSeen] = useState<Set<Tab>>(() => new Set(["overview"]));
  const studentQuery = useStudent(studentId);
  const enrollment = useEnrollment(studentId, enrollmentId);
  const student = studentQuery.data;
  const backHref = `/user-management/${studentId}`;

  if (!student) return <PageState query={studentQuery} noun="student" backHref="/user-management" />;
  if (!enrollment.overview) return <PageState query={enrollment.query} noun="program enrollment" backHref={backHref} />;
  const overview = enrollment.overview;

  return (
    <div className={styles.page}>
      <div className={styles.backRow}>
        <Link href={backHref} className={styles.back}>
          ← Back
        </Link>
      </div>

      <StudentHero student={student} subtitle={`${overview.title} · ${humanize(overview.status)}`} enrollmentId={enrollmentId} />

      <section className={styles.card} aria-label={`${overview.title} details`}>
        <div className={styles.tabs} role="tablist" aria-label="Program details">
          {TABS.map((t) => (
            <button
              key={t}
              type="button"
              role="tab"
              id={`tab-${t}`}
              aria-selected={tab === t}
              aria-controls={`panel-${t}`}
              className={`${styles.tab} ${styles[`tab_${t}`]}`}
              onClick={() => {
                setTab(t);
                setSeen((s) => new Set(s).add(t));
              }}
            >
              {t}
            </button>
          ))}
        </div>

        {TABS.map((t) => (
          <div key={t} role="tabpanel" id={`panel-${t}`} aria-labelledby={`tab-${t}`} hidden={tab !== t}>
            {!seen.has(t) ? null : t === "overview" ? (
              <Overview
                overview={overview}
                activity={enrollment.activity}
                hasMore={!!enrollment.query.hasNextPage}
                loadingMore={enrollment.query.isFetchingNextPage}
                onMore={() => void enrollment.query.fetchNextPage()}
              />
            ) : t === "performance" ? (
              <PerformancePanel studentId={studentId} enrollmentId={enrollmentId} title={overview.title} />
            ) : t === "engagement" ? (
              <EngagementPanel studentId={studentId} enrollmentId={enrollmentId} name={student.name} />
            ) : t === "loan" ? (
              <LoanPanel studentId={studentId} programId={overview.programId} />
            ) : (
              <CampaignPanel studentId={studentId} enrollmentId={enrollmentId} />
            )}
          </div>
        ))}
      </section>
    </div>
  );
}
