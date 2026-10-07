import {
  AwardIcon,
  BookOpenIcon,
  CircleCheckIcon,
  FileTextIcon,
  TrendingUpIcon,
} from "@/components/app/icons";
import { average, isCompleted, performanceOf, type Program, type ScoredItem } from "./data";
import styles from "./PerformancePanel.module.css";

type Tone = "blue" | "purple" | "green";

const TONE_COLOR: Record<Tone, string> = { blue: "#155DFC", purple: "#9810FA", green: "#00A63E" };

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
}: {
  title: string;
  icon: React.ReactNode;
  items: ScoredItem[];
  averageScore: number;
  /** Colour for scores below 90; 90+ is always green. */
  tone: Tone;
  scoreAlign: "left" | "right";
  className: string;
}) {
  return (
    <section className={`${styles.breakdown} ${className}`}>
      <h3 className={styles.breakdownHead}>
        {icon}
        <span>{title}</span>
      </h3>
      <div className={styles.breakdownBody}>
        <ul className={styles.items}>
          {items.map((item) => {
            const color = TONE_COLOR[item.score >= 90 ? "green" : tone];
            return (
              <li key={item.title} className={styles.item}>
                <div className={styles.itemText}>
                  <p className={styles.itemTitle}>{item.title}</p>
                  <p className={styles.itemDate}>Submitted: {item.submitted}</p>
                </div>
                <div className={styles.itemScore}>
                  <span className={styles.score} style={{ color, textAlign: scoreAlign }}>
                    {item.score}%
                  </span>
                  <Bar value={item.score} color={color} track="#E5E7EB" />
                </div>
              </li>
            );
          })}
        </ul>
        <div className={styles.average}>
          <span className={styles.averageLabel}>Average Score</span>
          <span className={styles.averageValue} style={{ color: TONE_COLOR[tone] }}>
            {averageScore}%
          </span>
        </div>
      </div>
    </section>
  );
}

export default function PerformancePanel({ program }: { program: Program }) {
  const perf = performanceOf(program);
  const progress = isCompleted(program) ? 100 : program.progress;
  const miniAverage = average(perf.miniProjects.items);
  const { assessments, finalProject } = perf;

  return (
    <div className={styles.panel}>
      <section className={styles.progress} aria-label="Overall program progress">
        <div className={styles.progressHead}>
          <div>
            <h3 className={styles.progressTitle}>Overall Program Progress</h3>
            <p className={styles.progressCohort}>{perf.cohort}</p>
          </div>
          <TrendingUpIcon size={32} color="#0F172A" strokeWidth={2} />
        </div>
        <p className={styles.progressValue}>
          <span className={styles.progressPercent}>{progress}%</span>
          <span className={styles.progressLabel}>Complete</span>
        </p>
        <Bar value={progress} color="#00C853" height={12} />
      </section>

      <div className={styles.stats}>
        <StatCard
          className={styles.statBlue}
          title="Assessments"
          icon={<FileTextIcon size={24} color="#155DFC" />}
          value={`${assessments.done}/${assessments.total}`}
          caption={`Avg: ${assessments.average}%`}
          fill={(assessments.done / assessments.total) * 100}
          color="#155DFC"
        />
        <StatCard
          className={styles.statPurple}
          title="Mini Projects"
          icon={<BookOpenIcon size={24} color="#9810FA" />}
          value={`${perf.miniProjects.items.length}/${perf.miniProjects.total}`}
          caption={`Avg: ${miniAverage}%`}
          fill={(perf.miniProjects.items.length / perf.miniProjects.total) * 100}
          color="#9810FA"
        />
        <StatCard
          className={styles.statGreen}
          title="Final Project"
          icon={<AwardIcon size={24} color="#00A63E" />}
          value={`${finalProject.score}%`}
          caption="Graded"
          fill={finalProject.score}
          color="#00A63E"
        />
        <StatCard
          className={styles.statOrange}
          title="Overall Performance"
          icon={<CircleCheckIcon size={24} color="#F54900" />}
          value={`${perf.overall}%`}
          caption="Across all assessments"
          fill={perf.overall}
          color="#F54900"
        />
      </div>

      <div className={styles.breakdowns}>
        <Breakdown
          className={styles.breakdownAssignments}
          title="Assignment Performance Breakdown"
          icon={<FileTextIcon size={20} color="#155DFC" strokeWidth={1.67} />}
          items={perf.assignments}
          averageScore={assessments.average}
          tone="blue"
          scoreAlign="right"
        />

        <div className={styles.side}>
          <Breakdown
            className={styles.breakdownMini}
            title="Mini Projects Breakdown"
            icon={<BookOpenIcon size={20} color="#9810FA" strokeWidth={1.67} />}
            items={perf.miniProjects.items}
            averageScore={miniAverage}
            tone="purple"
            scoreAlign="left"
          />

          <section className={styles.final} aria-label="Final project score">
            <div className={styles.finalHead}>
              <span className={styles.finalIcon}>
                <AwardIcon size={24} color="#00A63E" />
              </span>
              <div>
                <h3 className={styles.finalTitle}>Final Project Score</h3>
                <p className={styles.finalLabel}>{finalProject.label}</p>
              </div>
            </div>
            <p className={styles.finalScore}>{finalProject.score}%</p>
            <div className={styles.finalBar}>
              <Bar value={finalProject.score} color="#00A63E" height={12} />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
