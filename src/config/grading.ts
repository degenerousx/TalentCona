/**
 * The one grading scale for the whole admin portal.
 *
 * The backend computes every score (mini projects, final projects and the
 * final grade are weighted by each program's rubric; quizzes are auto-marked).
 * The portal never calculates or stores its own grades: it only turns the
 * backend's percent into a letter, a label and stars, the same way everywhere.
 *
 * To change the scale, edit GRADE_BANDS (highest first). Every page that shows
 * a grade (Talent Corner, program rubrics, …) follows automatically.
 */

export type GradeTone = "excellent" | "good" | "fair" | "low";

export type GradeBand = {
  /** Lowest percent (inclusive) for this band. */
  min: number;
  letter: string;
  label: string;
  /** 0–5, shown as stars. */
  stars: number;
  tone: GradeTone;
};

export const GRADE_BANDS: GradeBand[] = [
  { min: 90, letter: "A", label: "Excellent", stars: 5, tone: "excellent" },
  { min: 80, letter: "B", label: "Very Good", stars: 4, tone: "good" },
  { min: 70, letter: "C", label: "Good", stars: 3, tone: "good" },
  { min: 60, letter: "D", label: "Fair", stars: 2, tone: "fair" },
  { min: 0, letter: "F", label: "Needs Improvement", stars: 1, tone: "low" },
];

/** Lowest percent that counts as a pass. */
export const PASS_MARK = 60;

/** Rubric weights in a program must add up to this. */
export const RUBRIC_TOTAL_WEIGHT = 100;

/** Clamp to 0–100 and round to a whole percent. */
export function normalizePercent(percent: number) {
  return Math.round(Math.min(100, Math.max(0, percent)));
}

/** The band a percent falls in, or null when there is no grade. */
export function gradeFor(percent: number | null | undefined): (GradeBand & { percent: number; passed: boolean }) | null {
  if (percent == null || !Number.isFinite(percent)) return null;
  const p = normalizePercent(percent);
  const band = GRADE_BANDS.find((b) => p >= b.min) ?? GRADE_BANDS[GRADE_BANDS.length - 1];
  return { ...band, percent: p, passed: p >= PASS_MARK };
}

/** "Mini project: 61/100" style display, from points and a maximum. */
export function percentOf(points: number, max: number) {
  return max > 0 ? normalizePercent((points / max) * 100) : 0;
}
