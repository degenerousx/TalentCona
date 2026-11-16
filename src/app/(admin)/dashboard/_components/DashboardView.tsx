"use client";

import Link from "next/link";
import { WelcomeHeading } from "@/components/layout/CurrentAdmin";
import GrowthChart from "./GrowthChart";
import { useLiveDashboard } from "./LiveDashboard";
import { ago } from "@/components/notifications/api";
import { useCan } from "@/lib/permissions";
import { useRecentAudit } from "./recentAudit";
import type { LogType } from "../../audit-logs/_components/model";
import { GROWTH, PENDING_REVIEWS, PERFORMANCE, STATS, type Stat } from "./data";
import {
  CircleAlertIcon,
  CircleCheckIcon,
  ClockIcon,
  CodementorIcon,
  DollarSignIcon,
  FileTextIcon,
  GraduationCapIcon,
  TrendingUpIcon,
  UserCheckIcon,
  UsersIcon,
} from "@/components/icons";
import styles from "./Dashboard.module.css";

const STAT_ICONS = {
  users: UsersIcon,
  cap: GraduationCapIcon,
  dollar: DollarSignIcon,
  clock: ClockIcon,
  trend: TrendingUpIcon,
};

/** Recent Activity icon by the audit event's type (primaryCategory). */
const ACTIVITY_STYLE: Record<LogType, { bg: string; color: string; Icon: typeof UsersIcon }> = {
  Change: { bg: "#DBEAFE", color: "#155DFC", Icon: FileTextIcon },
  Approval: { bg: "#DCFCE7", color: "#00A63E", Icon: CircleCheckIcon },
  Critical: { bg: "#FFE4E6", color: "#E11D48", Icon: CircleAlertIcon },
  Security: { bg: "#FFEDD4", color: "#F54900", Icon: CircleAlertIcon },
  Access: { bg: "#F3F4F6", color: "#4A5565", Icon: UserCheckIcon },
};

function StatCard({ stat, value, title }: { stat: Stat; value: string; title?: string }) {
  const Icon = STAT_ICONS[stat.icon];
  return (
    <div className={styles.stat}>
      <div className={styles.statTop}>
        <span className={styles.statIcon} style={{ background: stat.iconBg }}>
          <Icon color="#FFFFFF" />
        </span>
        <span className={stat.badgeTone === "warning" ? styles.badgeWarning : styles.badge}>{stat.badge}</span>
      </div>
      <p className={styles.statValue} title={title}>
        {value}
      </p>
      <div className={styles.statBottom}>
        <span className={styles.statLabel}>{stat.label}</span>
        {stat.href && (
          <Link className={styles.viewLink} href={stat.href}>
            View →
          </Link>
        )}
      </div>
    </div>
  );
}

export default function DashboardView() {
  const live = useLiveDashboard();
  // Recent Activity: the newest audit log events (GET /audit/logs).
  const canOpenLog = useCan("VIEW_AUDIT_LOG");
  const feed = useRecentAudit();
  const recent = feed.data ?? [];
  return (
    <div className={styles.dashboard}>
      <header className={styles.welcome}>
        <WelcomeHeading className={styles.welcomeTitle} emojiClassName={styles.emoji} />
        <p className={styles.welcomeText}>Welcome to your TalentCona command center</p>
      </header>

      <section className={styles.stats} aria-label="Key metrics">
        {STATS.map((stat) => (
          <StatCard
            key={stat.label}
            stat={stat}
            value={stat.live ? live.stat[stat.live] : stat.value}
            title={stat.live && !live.allowed ? "Needs the Manage users privilege" : undefined}
          />
        ))}
      </section>

      <div className={styles.row}>
        <section className={`${styles.panel} ${styles.growth}`} aria-labelledby="growth-title">
          <div className={styles.panelHead}>
            <h2 id="growth-title" className={styles.panelTitle}>Platform Growth</h2>
            <ul className={styles.legend}>
              <li><span className={styles.dot} style={{ background: "#2B7FFF" }} />Students</li>
              <li><span className={styles.dot} style={{ background: "#00C950" }} />Revenue ($)</li>
            </ul>
          </div>
          <div className={styles.chart}>
            <GrowthChart data={GROWTH} />
          </div>
        </section>

        <section className={`${styles.panel} ${styles.activity}`} aria-labelledby="activity-title">
          <h2 id="activity-title" className={styles.panelTitle}>Recent Activity</h2>
          <ul className={styles.activityList}>
            {recent.length === 0 && (
              <li className={styles.activityItem}>
                <p className={styles.activityTime}>
                  {!feed.allowed
                    ? "Needs the View audit log privilege."
                    : feed.isPending
                      ? "Loading activity…"
                      : feed.isError
                        ? "Couldn't load recent activity."
                        : "No activity in the last 30 days."}
                </p>
              </li>
            )}
            {recent.map((e) => {
              const { bg, color, Icon } = ACTIVITY_STYLE[e.type];
              const body = (
                <>
                  <span className={styles.activityIcon} style={{ background: bg }}>
                    <Icon size={16} color={color} strokeWidth={2} />
                  </span>
                  <div>
                    <p className={styles.activityText}>
                      {e.actorName}: {e.activity}
                    </p>
                    <p className={styles.activityTime}>
                      {e.at ? ago(e.at) : "—"} · {e.module}
                    </p>
                  </div>
                </>
              );
              return (
                <li key={e.id} className={styles.activityItem}>
                  {canOpenLog ? (
                    <Link href="/audit-logs" style={{ display: "contents" }} title="Open Audit & System Logs">
                      {body}
                    </Link>
                  ) : (
                    body
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      </div>

      <div className={styles.bottomRow}>
        <section className={`${styles.card} ${styles.cardReviews}`} aria-labelledby="reviews-title">
          <div className={styles.cardHead}>
            <FileTextIcon size={20} color="#F54900" strokeWidth={2} />
            <h2 id="reviews-title" className={styles.cardTitle}>Pending Reviews</h2>
          </div>
          <ul className={styles.reviewList}>
            {PENDING_REVIEWS.map((review) => (
              <li key={review.title} className={styles.review}>
                <div className={styles.reviewInfo}>
                  <span className={styles.reviewIcon} style={{ background: review.kind === "mentor" ? "#DBEAFE" : "#F3E8FF" }}>
                    {review.kind === "mentor" ? <CodementorIcon /> : <UsersIcon size={16} color="#9810FA" />}
                  </span>
                  <div>
                    <p className={styles.reviewTitle}>{review.title}</p>
                    <p className={styles.reviewMeta}>
                      {!review.live
                        ? `${review.count} pending`
                        : live.pendingApplications !== undefined
                          ? `${live.pendingApplications} pending`
                          : live.pendingLoading
                            ? "Loading…"
                            : "—"}
                    </p>
                  </div>
                </div>
                <Link href={review.href} className={styles.reviewButton}>
                  Review
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section className={`${styles.card} ${styles.cardPerformance}`} aria-labelledby="performance-title">
          <div className={styles.cardHead}>
            <TrendingUpIcon size={20} color="#009689" strokeWidth={2} />
            <h2 id="performance-title" className={styles.cardTitle}>Performance</h2>
          </div>
          <ul className={styles.metrics}>
            {PERFORMANCE.map((metric) => (
              <li key={metric.label} className={styles.metric}>
                <div className={styles.metricHead}>
                  <span>{metric.label}</span>
                  <span style={{ color: metric.valueColor, fontWeight: metric.valueWeight }}>{metric.value}</span>
                </div>
                <div className={styles.track} role="presentation">
                  <div className={styles.fill} style={{ width: `${metric.fill}%`, background: metric.gradient }} />
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
