import { cn } from "@/lib/cn";

type ProgressBarProps = {
  /** 0 to 100. */
  value: number;
  /** Accessible name, e.g. "Onboarding progress for John Doe". */
  label: string;
  /** Tailwind background class for the filled part. */
  barClassName?: string;
  className?: string;
};

export function ProgressBar({ value, label, barClassName = "bg-success", className }: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, value));
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={clamped}
      className={cn("h-2 w-full overflow-hidden rounded-full bg-gray-200", className)}
    >
      <div className={cn("h-full rounded-full", barClassName)} style={{ width: `${clamped}%` }} />
    </div>
  );
}
