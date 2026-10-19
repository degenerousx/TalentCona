import { useId } from "react";
import { cn } from "@/lib/cn";

type Size = "sm" | "md" | "lg";

// Rendered size in px, and stroke width in viewBox units (thinner as it grows).
const sizes: Record<Size, { px: number; stroke: number }> = {
  sm: { px: 16, stroke: 3 },
  md: { px: 24, stroke: 2.75 },
  lg: { px: 44, stroke: 2.25 },
};

const R = 10;
const CIRCUMFERENCE = 2 * Math.PI * R;

/**
 * Brand spinner: a faint primary track with an arc that brightens from
 * primary into the accent violet at its rounded head, spinning.
 *
 * Colours come from `text-primary` / `text-accent` via currentColor, so they
 * follow the design tokens (`@theme inline` doesn't expose CSS variables).
 */
export function Spinner({
  size = "md",
  label,
  className,
}: {
  size?: Size;
  /** Accessible name. Omit when a visible "Loading…" text sits next to it. */
  label?: string;
  className?: string;
}) {
  const gradientId = `spinner-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const { px, stroke } = sizes[size];

  return (
    <svg
      viewBox="0 0 24 24"
      width={px}
      height={px}
      fill="none"
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      className={cn("shrink-0 animate-spin [animation-duration:0.9s] motion-reduce:[animation-duration:2.5s]", className)}
    >
      <defs>
        {/* Tail (right) → head (top-left), following the arc's direction. */}
        <linearGradient id={gradientId} x1="1" y1="0.6" x2="0.15" y2="0">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.15" className="text-primary" />
          <stop offset="55%" stopColor="currentColor" className="text-primary" />
          <stop offset="100%" stopColor="currentColor" className="text-accent" />
        </linearGradient>
      </defs>
      {/* Track */}
      <circle cx="12" cy="12" r={R} strokeWidth={stroke} stroke="currentColor" className="text-primary/10" />
      {/* Arc: starts at 3 o'clock, runs ~70% of the way round clockwise. */}
      <circle
        cx="12"
        cy="12"
        r={R}
        strokeWidth={stroke}
        stroke={`url(#${gradientId})`}
        strokeLinecap="round"
        strokeDasharray={`${CIRCUMFERENCE * 0.7} ${CIRCUMFERENCE}`}
      />
    </svg>
  );
}
