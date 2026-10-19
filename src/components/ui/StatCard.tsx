import { Card } from "./Card";
import { cn } from "@/lib/cn";

type StatCardProps = {
  label: string;
  value: React.ReactNode;
  /** Colour of the value; defaults to the dark ink used in Figma. */
  valueClassName?: string;
  /** 32px Lucide icon shown on the right. */
  icon: React.ReactNode;
  /** Small line under the value (Reports KPI cards). */
  footnote?: string;
  footnoteClassName?: string;
  tone?: "default" | "hairline";
  labelClassName?: string;
};

/** White KPI card: label and big value on the left, icon on the right. */
export function StatCard({
  label,
  value,
  valueClassName = "text-ink",
  icon,
  footnote,
  footnoteClassName = "text-slate-900",
  tone = "hairline",
  labelClassName = "text-slate-900",
}: StatCardProps) {
  return (
    <Card tone={tone} className="flex flex-col gap-2 p-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex min-w-0 flex-col gap-1">
          <p className={cn("text-sm leading-5", labelClassName)}>{label}</p>
          <p className={cn("text-2xl leading-8 font-bold", valueClassName)}>{value}</p>
        </div>
        <span aria-hidden="true" className="shrink-0 [&_svg]:size-8">
          {icon}
        </span>
      </div>
      {footnote && <p className={cn("text-xs leading-4", footnoteClassName)}>{footnote}</p>}
    </Card>
  );
}
