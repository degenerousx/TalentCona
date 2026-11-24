"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { ChevronDown, Download, Search, X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/cn";

/** Status pill (Figma "StatusBadge"). */
const BADGE: Record<string, string> = {
  Active: "bg-[#f0fdf4] border-[#b9f8cf] text-[#008236]",
  Approved: "bg-[#f0fdf4] border-[#b9f8cf] text-[#008236]",
  Confirmed: "bg-[#f0fdf4] border-[#b9f8cf] text-[#008236]",
  Completed: "bg-[#eff6ff] border-[#bedbff] text-[#1447e6]",
  Pending: "bg-[#fffbeb] border-[#fee685] text-[#bb4d00]",
  Rejected: "bg-[#fef2f2] border-[#ffc9c9] text-[#c10007]",
  Full: "bg-[#faf5ff] border-[#e9d4ff] text-[#8200db]",
  Partial: "bg-[#fff7ed] border-[#ffd6a8] text-[#ca3500]",
};
export function Badge({ children, tone, className }: { children: React.ReactNode; tone?: string; className?: string }) {
  return (
    <span className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs leading-4 font-medium whitespace-nowrap", BADGE[tone ?? String(children)] ?? "border-transparent bg-[#f3f4f6] text-[#4a5565]", className)}>
      {children}
    </span>
  );
}
/** Grey tag (Corporate / Individual). */
export function Tag({ children }: { children: React.ReactNode }) {
  return <span className="rounded-full bg-[#f3f4f6] px-2 py-0.5 text-xs leading-4 text-[#4a5565]">{children}</span>;
}
/** Purple career-path chip. */
export function PathChip({ children, strong }: { children: React.ReactNode; strong?: boolean }) {
  return strong ? (
    <span className="rounded-full border border-[#f3e8ff] bg-[#faf5ff] px-3 py-1 text-xs leading-4 font-medium text-[#8200db]">{children}</span>
  ) : (
    <span className="rounded-full border border-[#302a91]/10 bg-[#faf5ff] px-2 py-0.5 text-xs leading-4 text-[#302a91]">{children}</span>
  );
}

export const card = "rounded-[12px] border border-[#e5e7eb] bg-white";

/** Search + filter pills + Export, as in every list tab. */
/** One row of filter pills. onChange takes the group's own option type. */
type FilterGroup = { label: string; options: readonly string[]; value: string; onChange: (v: never) => void };

export function Toolbar({ search, onSearch, groups }: { search: string; onSearch: (v: string) => void; groups: FilterGroup[] }) {
  return (
    <div className={cn(card, "flex flex-col gap-4 p-4 lg:flex-row lg:items-center")}>
      <label className="relative min-w-0 flex-1">
        <span className="sr-only">Search</span>
        <Search className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-[#99a1af]" />
        <input
          type="search"
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          placeholder="Search"
          className="h-[38px] w-full rounded-[8px] border border-[#e5e7eb] pr-4 pl-9 text-sm tracking-[-0.15px] text-ink outline-none placeholder:text-ink/50 focus:border-primary"
        />
      </label>
      <div className="flex flex-wrap items-center gap-4">
        {groups.map((g) => (
          <div key={g.label} role="group" aria-label={g.label} className="flex flex-wrap gap-2">
            {g.options.map((o) => (
              <button
                key={o}
                type="button"
                aria-pressed={g.value === o}
                onClick={() => g.onChange(o as never)}
                className={cn("rounded-[8px] px-3 py-1.5 text-xs leading-4 font-medium", g.value === o ? "bg-[linear-gradient(144deg,#722fff_0%,#491a99_100%)] text-white" : "bg-[#f3f4f6] text-[#4a5565] hover:bg-[#e5e7eb]")}
              >
                {o}
              </button>
            ))}
          </div>
        ))}
        <button type="button" onClick={mockToast} className="flex items-center gap-1.5 rounded-[8px] border border-[#e5e7eb] px-3 py-1.5 text-xs leading-4 font-medium text-[#4a5565] hover:bg-slate-50">
          <Download className="size-3.5" /> Export
        </button>
      </div>
    </div>
  );
}

export const mockToast = () => toast("Design preview: sample data only, nothing is exported or saved.");

/** Empty list message. */
export function Empty({ children = "No records match your search." }: { children?: React.ReactNode }) {
  return <p className={cn(card, "px-6 py-12 text-center text-sm text-[#6a7282]")}>{children}</p>;
}

/** Right-hand detail panel (Figma detail containers, 672px wide). */
export function Panel({
  open,
  onClose,
  title,
  eyebrow,
  lead,
  badge,
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  eyebrow?: React.ReactNode;
  lead?: React.ReactNode;
  badge?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={(o) => !o && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40" />
        <Dialog.Content className="fixed inset-y-0 right-0 z-50 flex w-full max-w-[672px] flex-col bg-white shadow-2xl outline-none">
          <header className="flex items-center justify-between gap-4 border-b border-[#f3f4f6] px-6 py-4">
            <div className="flex min-w-0 items-center gap-3">
              {lead}
              <div className="min-w-0">
                {eyebrow && <p className="text-xs leading-4 text-[#6a7282]">{eyebrow}</p>}
                <Dialog.Title className="truncate text-lg leading-7 font-bold text-[#101828]">{title}</Dialog.Title>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {badge}
              <Dialog.Close aria-label="Close" className="rounded-[8px] p-2 text-[#6a7282] hover:bg-slate-100">
                <X className="size-4" />
              </Dialog.Close>
            </div>
          </header>
          <Dialog.Description className="sr-only">{title} details</Dialog.Description>
          <div className="flex-1 overflow-y-auto p-6">{children}</div>
          {footer && <footer className="flex justify-end gap-3 border-t border-[#e5e7eb] px-6 py-6">{footer}</footer>}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

/** Centred dialog (Approve Sponsorship, Record Payment). */
export function Modal({ open, onClose, title, children, footer, divided }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode; footer: React.ReactNode; divided?: boolean }) {
  return (
    <Dialog.Root open={open} onOpenChange={(o) => !o && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40" />
        <Dialog.Content className="fixed top-1/2 left-1/2 z-50 max-h-[90vh] w-[calc(100%-32px)] max-w-[672px] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-[16px] bg-white shadow-2xl outline-none">
          <header className={cn("flex items-center justify-between p-6", divided ? "border-b border-[#f3f4f6]" : "pb-0")}>
            <Dialog.Title className={cn("font-bold text-[#101828]", divided ? "text-lg leading-7" : "text-2xl leading-8")}>{title}</Dialog.Title>
            <Dialog.Close aria-label="Close" className="rounded-[8px] p-2 text-[#364153] hover:bg-slate-100">
              <X className={divided ? "size-4" : "size-5"} />
            </Dialog.Close>
          </header>
          <Dialog.Description className="sr-only">{title}</Dialog.Description>
          <div className="p-6">{children}</div>
          <footer className="mx-6 flex justify-end gap-3 border-t border-[#e5e7eb] pt-6 pb-6">{footer}</footer>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export function Btn({ variant = "primary", className, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "outline" | "danger" }) {
  return (
    <button
      type="button"
      {...props}
      className={cn(
        "rounded-[8px] px-6 py-3 text-sm leading-5 font-semibold disabled:opacity-50",
        variant === "primary" && "bg-primary text-white hover:bg-primary/90",
        variant === "outline" && "border border-[#d1d5dc] bg-white text-[#364153] hover:bg-slate-50",
        variant === "danger" && "border border-[#e7000b] bg-white text-[#e7000b] hover:bg-red-50",
        className,
      )}
    />
  );
}

/** Grey label/value tile (detail panels). */
export function InfoTile({ label, icon, children }: { label: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rounded-[12px] bg-[#f9fafb] p-3">
      <p className="flex items-center gap-1.5 text-xs leading-4 text-[#6a7282]">
        {icon}
        {label}
      </p>
      <div className="pt-0.5 text-sm leading-5 font-semibold break-words text-[#101828]">{children}</div>
    </div>
  );
}
/** Centred number box (detail panels). */
export function StatBox({ label, value, color = "#101828", big }: { label: string; value: string; color?: string; big?: boolean }) {
  return (
    <div className={cn("rounded-[12px] bg-[#f9fafb] text-center", big ? "p-4" : "p-3")}>
      <p className="text-xs leading-4 text-[#6a7282]">{label}</p>
      <p className={cn("pt-1 font-bold", big ? "text-xl leading-7" : "text-lg leading-7")} style={{ color }}>
        {value}
      </p>
    </div>
  );
}
export function Bar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div>
      <p className="text-xs leading-4 text-[#6a7282]">{label}</p>
      <div className="mt-1.5 flex items-center gap-2">
        <div className="h-1.5 flex-1 rounded-full bg-[#f3f4f6]">
          <div className="h-1.5 rounded-full" style={{ width: `${value}%`, background: color }} />
        </div>
        <span className="w-8 text-right text-xs font-medium text-[#4a5565]">{value}%</span>
      </div>
    </div>
  );
}

const field = "w-full rounded-[8px] border border-[#d1d5dc] bg-white px-3 py-2.5 text-sm text-[#3a3a3a] outline-none placeholder:text-[#3a3a3a]/50 focus:border-primary";
export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm leading-5 font-medium text-[#364153]">{label}</span>
      {children}
    </label>
  );
}
export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={field} />;
}
export function Select({ options, ...props }: React.SelectHTMLAttributes<HTMLSelectElement> & { options: string[] }) {
  return (
    <span className="relative">
      <select {...props} className={cn(field, "appearance-none pr-9")}>
        {options.map((o) => (
          <option key={o}>{o}</option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-[#3a3a3a]" />
    </span>
  );
}
export function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={cn(field, "min-h-[83px] rounded-[12px]")} />;
}
