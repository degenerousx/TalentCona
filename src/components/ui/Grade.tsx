import { Star, StarHalf } from "lucide-react";
import { GRADE_BANDS, gradeFor, PASS_MARK, type GradeTone } from "@/config/grading";
import { cn } from "@/lib/cn";

/**
 * Grade display used everywhere a score appears. Scale and colours come from
 * `src/config/grading.ts`; scores always come from the backend.
 */

const tones: Record<GradeTone, string> = {
  excellent: "bg-success-soft text-success",
  good: "bg-info-soft text-info",
  fair: "bg-warning-soft text-warning",
  low: "bg-red-50 text-danger",
};

type GradeBadgeProps = {
  percent: number | null | undefined;
  /** "circle" = the round badge on cards; "pill" = inline. */
  variant?: "circle" | "pill";
  /** Caption under the circle, e.g. "Final Grade". */
  caption?: string;
  className?: string;
};

/** "92% · A" with the band's colour; nothing when there is no grade. */
export function GradeBadge({ percent, variant = "pill", caption, className }: GradeBadgeProps) {
  const g = gradeFor(percent);
  if (!g) return null;
  const title = `${g.percent}% — ${g.letter} (${g.label})${g.passed ? "" : `, below the ${PASS_MARK}% pass mark`}`;
  if (variant === "circle") {
    return (
      <div className={cn("flex shrink-0 flex-col items-center", className)} title={title}>
        <span className={cn("grid size-14 place-items-center rounded-full text-center leading-tight font-bold", tones[g.tone])}>
          <span className="text-lg">{g.percent}%</span>
        </span>
        <span className="mt-0.5 text-xs leading-4 text-slate-700">
          {caption ? `${caption} · ` : ""}
          <span className="font-semibold">{g.letter}</span>
        </span>
        <span className="sr-only">{title}</span>
      </div>
    );
  }
  return (
    <span title={title} className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs leading-4 font-semibold", tones[g.tone], className)}>
      {g.percent}% · {g.letter}
      <span className="sr-only"> ({g.label})</span>
    </span>
  );
}

/** The grade band's stars (A = 5 … F = 1), with its label. */
export function StarRating({ percent, showLabel = true }: { percent: number | null | undefined; showLabel?: boolean }) {
  const g = gradeFor(percent);
  if (!g) return null;
  const rating = g.stars;
  return (
    <span role="img" aria-label={`Rated ${rating} out of 5 (${g.label})`} className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => {
        const Icon = rating < i && rating >= i - 0.5 ? StarHalf : Star;
        return (
          <Icon
            key={i}
            aria-hidden
            className={cn("size-4", rating >= i - 0.5 ? "fill-warning text-warning" : "text-slate-300")}
            strokeWidth={1.33}
          />
        );
      })}
      {showLabel && (
        <span aria-hidden="true" className="ml-1 text-sm leading-5 font-medium text-ink">
          {g.label}
        </span>
      )}
    </span>
  );
}

/** The scale itself, for pages that explain how grades are given. */
export function GradeScaleTable() {
  return (
    <table className="w-full border-collapse text-left text-sm">
      <thead className="text-xs text-slate-500 uppercase">
        <tr>
          <th className="py-2 pr-4 font-medium">Score</th>
          <th className="py-2 pr-4 font-medium">Grade</th>
          <th className="py-2 pr-4 font-medium">Rating</th>
        </tr>
      </thead>
      <tbody>
        {GRADE_BANDS.map((b, i) => {
          const max = i === 0 ? 100 : GRADE_BANDS[i - 1].min - 1;
          return (
            <tr key={b.letter} className="border-t border-slate-100">
              <td className="py-2 pr-4 text-slate-700">
                {b.min}–{max}%
              </td>
              <td className="py-2 pr-4">
                <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-semibold", tones[b.tone])}>
                  {b.letter} · {b.label}
                </span>
              </td>
              <td className="py-2 pr-4">
                <StarRating percent={b.min} showLabel={false} />
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
