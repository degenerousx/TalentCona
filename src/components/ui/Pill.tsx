import { cn } from "@/lib/cn";

export type PillTone =
  | "success"
  | "warning"
  | "info"
  | "pending"
  | "teal"
  | "neutral"
  | "primary"
  | "green"
  | "blue"
  | "orange"
  | "yellow";

const tones: Record<PillTone, string> = {
  success: "bg-success-soft text-success",
  warning: "bg-warning-soft text-warning",
  info: "bg-info-soft text-info",
  pending: "bg-pending text-white",
  teal: "bg-teal-soft text-teal font-normal",
  neutral: "bg-slate-100 text-slate-700",
  primary: "bg-slate-50 text-primary",
  green: "bg-green-100 text-green-800",
  blue: "bg-blue-100 text-blue-800",
  orange: "bg-orange-100 text-orange-800",
  yellow: "bg-yellow-100 text-yellow-800",
};

type PillProps = {
  tone: PillTone;
  size?: "xs" | "sm";
  icon?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
};

/** Rounded status/label pill used for statuses, levels and position counts. */
export function Pill({ tone, size = "xs", icon, className, children }: PillProps) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1 rounded-full font-medium whitespace-nowrap",
        size === "xs" ? "px-2.5 py-0.5 text-xs leading-4" : "px-3 py-1 text-sm leading-5",
        tones[tone],
        className,
      )}
    >
      {icon}
      {children}
    </span>
  );
}
