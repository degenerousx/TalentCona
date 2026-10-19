import { cn } from "@/lib/cn";

export type MetricTone = "green" | "blue" | "purple" | "orange" | "red";

/* Gradient, border and three text shades per tone, exactly as in Figma. */
const tones: Record<MetricTone, { box: string; label: string; value: string; caption: string }> = {
  green: {
    box: "from-green-50 to-green-100 border-green-200",
    label: "text-green-800",
    value: "text-green-900",
    caption: "text-green-700",
  },
  blue: {
    box: "from-blue-50 to-blue-100 border-blue-200",
    label: "text-blue-800",
    value: "text-blue-900",
    caption: "text-blue-700",
  },
  purple: {
    box: "from-purple-50 to-purple-100 border-purple-200",
    label: "text-purple-800",
    value: "text-purple-900",
    caption: "text-purple-700",
  },
  orange: {
    box: "from-orange-50 to-orange-100 border-orange-200",
    label: "text-orange-800",
    value: "text-orange-900",
    caption: "text-orange-700",
  },
  red: {
    box: "from-red-50 to-red-100 border-red-200",
    label: "text-red-800",
    value: "text-red-900",
    caption: "text-red-700",
  },
};

type MetricTileProps = {
  tone: MetricTone;
  icon: React.ReactNode;
  label: string;
  value: string;
  caption: string;
};

/** Tinted gradient tile used in the Reports & Insights breakdowns. */
export function MetricTile({ tone, icon, label, value, caption }: MetricTileProps) {
  const t = tones[tone];
  return (
    <div className={cn("flex flex-col gap-1.5 rounded-lg border bg-linear-to-br p-6", t.box)}>
      <p className={cn("flex items-center gap-2 text-xs leading-4 font-medium", t.label)}>
        <span aria-hidden="true" className="[&_svg]:size-5">
          {icon}
        </span>
        {label}
      </p>
      <p className={cn("text-2xl leading-8 font-bold", t.value)}>{value}</p>
      <p className={cn("text-xs leading-4", t.caption)}>{caption}</p>
    </div>
  );
}
