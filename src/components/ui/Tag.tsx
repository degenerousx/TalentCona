import { Code } from "lucide-react";
import { cn } from "@/lib/cn";

type TagProps = {
  /** "code": small violet chip with a code icon (talent cards).
   *  "soft": larger violet chip (profile modal).
   *  "plain": slate chip (request details). */
  variant?: "code" | "soft" | "plain";
  children: React.ReactNode;
};

/** Skill chip. */
export function Tag({ variant = "code", children }: TagProps) {
  return (
    <li
      className={cn(
        "inline-flex items-center gap-1 font-medium",
        variant === "code" && "rounded bg-purple-100 p-1 text-xs leading-4 text-accent",
        variant === "soft" && "rounded bg-purple-100 px-3 py-1.5 text-sm leading-5 text-accent",
        variant === "plain" && "rounded-lg bg-slate-50 px-3 py-1.5 text-sm leading-5 text-slate-900",
      )}
    >
      {variant === "code" && <Code aria-hidden className="size-3" strokeWidth={1} />}
      {children}
    </li>
  );
}

export function TagList({ label, className, children }: { label: string; className?: string; children: React.ReactNode }) {
  return (
    <ul aria-label={label} className={cn("flex flex-wrap gap-2", className)}>
      {children}
    </ul>
  );
}
