"use client";

import { AwardIcon, BookOpenIcon, CircleCheckIcon, FileTextIcon, TrendingUpIcon } from "@/components/icons";
import PanelState from "../shared/PanelState";
import { humanize, shortDate, usePerformance, type ScoredItem } from "../api";
import styles from "./PerformancePanel.module.css";

type Tone = "blue" | "purple" | "green";

const TONE_COLOR: Record<Tone, string> = { blue: "#155DFC", purple: "#9810FA", green: "#00A63E" };

const pct = (v: number | null | undefined) => (v == null ? "—" : `${Math.round(v)}%`);
const ratio = (done: number, total: number) => (total > 0 ? (done / total) * 100 : 0);

function Bar({ value, color, track = "#FFFFFF", height = 8 }: { value: number; color: string; track?: string; height?: number }) {
  return (
    <span className={styles.bar} style={{ background: track, height }}>
      <span style={{ width: `${Math.min(100, Math.max(0, value))}%`, background: color }} />
    </span>
  );
}

function StatCard({
  title,
  icon,
  value,
  caption,
  fill,
  color,
  className,
}: {
  title: string;
  icon: React.ReactNode;
  value: string;
  caption: string;
  fill: number;
  color: string;
  className: string;
}) {
  return (
    <div className={`${styles.stat} ${className}`}>
      <div className={styles.statHead}>
        <h4 className={styles.statTitle}>{title}</h4>
        {icon}
      </div>
      <p className={styles.statValue}>{value}</p>
      <p className={styles.statCaption}>{caption}</p>
      <Bar value={fill} color={color} />
    </div>
  );
}

function Breakdown({
  title,
  icon,
  items,
  averageScore,
  tone,
  scoreAlign,
  className,
  empty,
}: {
  title: string;
  icon: React.ReactNode;
  items: ScoredItem[];
  averageScore: number | null;
  /** Colour for scores below 90; 90+ is always green. */
  tone: Tone;
  scoreAlign: "left" | "right";
  className: string;
  empty: string;
}) {
  return (
    <section className={`${styles.breakdown} ${className}`}>
      <h3 className={styles.breakdownHead}>
        {icon}
        <span>{title}</span>
      </h3>
      <div className={styles.breakdownBody}>
        {items.length === 0 ? (
          <p className={styles.noItems}>{empty}</p>
        ) : (
          <ul className={styles.items}>
            {items.map((item) => {
              const color = TONE_COLOR[(item.score ?? 0) >= 90 ? "green" : tone];
              return (
                <li key={item.id} className={styles.item}>
                  <div className={styles.itemText}>
                    <p className={styles.itemTitle}>{item.title}</p>
                    <p className={styles.itemDate}>
                      {item.submittedAt ? `Submitted: ${shortDate(item.submittedAt)}` : item.status ? humanize(item.status) : "Not submitted"}
                    </p>
                  </div>
                  <div className={styles.itemScore}>
                    <span className={styles.score} style={{ color, textAlign: scoreAlign }}>
                      {pct(item.score)}
                    </span>
                    <Bar value={item.score ?? 0} color={color} track="#E5E7EB" />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
        <div className={styles.average}>
          <span className={styles.averageLabel}>Average Score</span>
          <span className={styles.averageValue} style={{ color: TONE_COLOR[tone] }}>
            {pct(averageScore)}
          </span>
        </div>
      </div>
    </section>
  );
}

export default function PerformancePanel({ studentId, enrollmentId, title }: { studentId: string; enrollmentId: string; title: string }) {
  const query = usePerformance(studentId, enrollmentId);
  const perf = query.data;
  if (!perf) return <PanelState query={query} noun="performance" />;
  const { assessments, miniProjects, finalProject, modules } = perf;
  const finalShown = finalProject.display ?? pct(finalProject.score);

  return (
    <div className={styles.panel}>
      <section className={styles.progress} aria-label="Overall program progress">
        <div className={styles.progressHead}>
          <div>
            <h3 className={styles.progressTitle}>Overall Program Progress</h3>
            <p className={styles.progressCohort}>{title}</p>
          </div>
          <TrendingUpIcon size={32} color="#0F172A" strokeWidth={2} />
        </div>
        <p className={styles.progressValue}>
          <span className={styles.progressPercent}>{perf.progress}%</span>
          <span className={styles.progressLabel}>Complete</span>
        </p>
        <Bar value={perf.progress} color="#00C853" height={12} />
      </section>

      <div className={styles.stats}>
        <StatCard
          className={styles.statBlue}
          title="Assessments"
          icon={<FileTextIcon size={24} color="#155DFC" />}
          value={`${assessments.completed}/${assessments.total}`}
          caption={`Avg: ${pct(assessments.average)}`}
          fill={ratio(assessments.completed, assessments.total)}
          color="#155DFC"
        />
        <StatCard
          className={styles.statPurple}
          title="Mini Projects"
          icon={<BookOpenIcon size={24} color="#9810FA" />}
          value={`${miniProjects.completed}/${miniProjects.total}`}
          caption={`Avg: ${pct(miniProjects.average)}`}
          fill={ratio(miniProjects.completed, miniProjects.total)}
          color="#9810FA"
        />
        <StatCard
          className={styles.statGreen}
          title="Final Project"
          icon={<AwardIcon size={24} color="#00A63E" />}
          value={finalShown}
          caption={finalProject.gradedAt ? "Graded" : finalProject.submittedAt ? "Awaiting grade" : humanize(finalProject.status) || "Not submitted"}
          fill={finalProject.score ?? 0}
          color="#00A63E"
        />
        <StatCard
          className={styles.statOrange}
          title="Modules Completed"
          icon={<CircleCheckIcon size={24} color="#F54900" />}
          value={`${modules.completed}/${modules.total}`}
          caption={perf.mcq.percent != null ? `Quiz score: ${pct(perf.mcq.percent)}` : "No quiz attempts yet"}
          fill={modules.rate ?? ratio(modules.completed, modules.total)}
          color="#F54900"
        />
      </div>

      <div className={styles.breakdowns}>
        <Breakdown
          className={styles.breakdownAssignments}
          title="Assessment Performance Breakdown"
          icon={<FileTextIcon size={20} color="#155DFC" strokeWidth={1.67} />}
          items={assessments.items}
          averageScore={assessments.average}
          tone="blue"
          scoreAlign="right"
          empty="No assessments attempted yet."
        />

        <div className={styles.side}>
          <Breakdown
            className={styles.breakdownMini}
            title="Mini Projects Breakdown"
            icon={<BookOpenIcon size={20} color="#9810FA" strokeWidth={1.67} />}
            items={miniProjects.items}
            averageScore={miniProjects.average}
            tone="purple"
            scoreAlign="left"
            empty="No mini projects submitted yet."
          />

          <section className={styles.final} aria-label="Final project score">
            <div className={styles.finalHead}>
              <span className={styles.finalIcon}>
                <AwardIcon size={24} color="#00A63E" />
              </span>
              <div>
                <h3 className={styles.finalTitle}>Final Project Score</h3>
                <p className={styles.finalLabel}>
                  {finalProject.title ?? "Final project"}
                  {finalProject.submittedAt ? ` · submitted ${shortDate(finalProject.submittedAt)}` : ""}
                </p>
              </div>
            </div>
            <p className={styles.finalScore}>{finalShown}</p>
            <div className={styles.finalBar}>
              <Bar value={finalProject.score ?? 0} color="#00A63E" height={12} />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
