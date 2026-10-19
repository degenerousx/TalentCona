import { cn } from "@/lib/cn";
import type { FinalProjectStatus, Mentee } from "./data";

/** Card header washes from the design (CardHeader gradients). */
export const headerWash: Record<Mentee["theme"], string> = {
  blue: "bg-linear-to-r from-[#eff6ff] to-[#ecfeff]",
  purple: "bg-linear-to-r from-[#faf5ff] to-[#fdf2f8]",
  teal: "bg-linear-to-r from-[#eff6ff] to-[#ecfeff]",
};

const avatarFill: Record<Mentee["theme"], string> = {
  blue: "from-[#51a2ff] to-[#00d3f2]",
  purple: "from-[#c27aff] to-[#fb64b6]",
  teal: "from-[#0a9bad] to-[#46b7c5]",
};

export function Avatar({ mentee, size }: { mentee: Mentee; size: "md" | "lg" }) {
  return (
    <span
      aria-hidden
      className={cn(
        "grid shrink-0 place-items-center rounded-full font-bold text-white",
        size === "md"
          ? cn("size-16 border-[1.6px] border-[#e6fbf7] bg-linear-to-br text-base", avatarFill[mentee.theme])
          : "size-24 bg-primary text-3xl",
      )}
    >
      {mentee.initials}
    </span>
  );
}

export function FinalProjectBadge({ status }: { status: FinalProjectStatus }) {
  return (
    <span
      className={cn(
        "rounded-lg px-2 py-0.5 text-xs leading-4",
        status === "Pending Review"
          ? "bg-[#ffc107] text-white"
          : status === "Not Started"
            ? "border border-gray-300 text-slate-900"
            : "bg-green-100 text-green-800",
      )}
    >
      {status}
    </span>
  );
}
