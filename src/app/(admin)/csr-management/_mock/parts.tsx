"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/cn";
import type { CreatedStatus, FundingSource } from "./data";

/** Section card with a title row, matching the portal's cards. */
export function Section({ title, description, action, className, children }: { title: string; description?: string; action?: React.ReactNode; className?: string; children: React.ReactNode }) {
  return (
    <section className={cn("rounded-lg border border-gray-200 bg-white shadow-sm", className)}>
      <header className="flex flex-wrap items-start justify-between gap-3 border-b border-gray-100 px-5 py-4 sm:px-6">
        <div>
          <h2 className="text-lg leading-6 font-semibold text-heading">{title}</h2>
          {description && <p className="mt-1 text-sm leading-5 text-gray-600">{description}</p>}
        </div>
        {action}
      </header>
      <div className="px-5 py-5 sm:px-6">{children}</div>
    </section>
  );
}

/** Numbered steps across the top of a flow. */
export function Stepper({ steps, current }: { steps: string[]; current: number }) {
  return (
    <ol className="flex flex-wrap items-center gap-x-3 gap-y-2" aria-label="Progress">
      {steps.map((s, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <li key={s} className="flex items-center gap-3">
            <span
              className={cn(
                "flex size-7 items-center justify-center rounded-full text-xs font-semibold",
                done && "bg-primary text-white",
                active && "bg-primary-soft text-primary ring-2 ring-primary",
                !done && !active && "bg-gray-100 text-gray-500",
              )}
            >
              {done ? <Check className="size-4" /> : i + 1}
            </span>
            <span className={cn("text-sm leading-5", active ? "font-semibold text-primary" : done ? "text-heading" : "text-gray-500")}>{s}</span>
            {i < steps.length - 1 && <span className="hidden h-px w-10 bg-gray-300 sm:block" aria-hidden />}
          </li>
        );
      })}
    </ol>
  );
}

export function Field({ label, required, hint, error, children, className }: { label: string; required?: boolean; hint?: string; error?: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={cn("flex flex-col gap-1.5", className)}>
      <span className="text-sm leading-5 font-medium text-gray-800">
        {label}
        {required && <span className="text-danger"> *</span>}
      </span>
      {children}
      {error ? <span className="text-xs leading-4 text-danger">{error}</span> : hint ? <span className="text-xs leading-4 text-gray-500">{hint}</span> : null}
    </label>
  );
}

const inputBase = "h-10 w-full rounded-md border bg-white px-3 text-sm text-heading outline-none placeholder:text-gray-400 focus:border-primary focus:ring-2 focus:ring-primary/15";
export function TextInput({ error, prefix, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { error?: boolean; prefix?: string }) {
  if (prefix)
    return (
      <div className={cn("flex h-10 items-center overflow-hidden rounded-md border bg-white focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/15", error ? "border-danger" : "border-gray-300")}>
        <span className="flex h-full items-center border-r border-gray-200 bg-gray-50 px-3 text-sm text-gray-600">{prefix}</span>
        <input {...props} className="h-full min-w-0 flex-1 px-3 text-sm text-heading outline-none placeholder:text-gray-400" />
      </div>
    );
  return <input {...props} className={cn(inputBase, error ? "border-danger" : "border-gray-300")} />;
}
export function SelectInput({ options, error, ...props }: React.SelectHTMLAttributes<HTMLSelectElement> & { options: string[]; error?: boolean }) {
  return (
    <select {...props} className={cn(inputBase, "appearance-none bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2216%22 height=%2216%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%2364748b%22 stroke-width=%222%22><path d=%22m6 9 6 6 6-6%22/></svg>')] bg-[length:16px] bg-[right_12px_center] bg-no-repeat pr-9", error ? "border-danger" : "border-gray-300")}>
      {options.map((o) => (
        <option key={o}>{o}</option>
      ))}
    </select>
  );
}

const STATUS_TONE: Record<CreatedStatus, string> = {
  "Invitation sent": "bg-info-soft text-info",
  Activated: "bg-teal-soft text-teal",
  Onboarding: "bg-warning-soft text-warning",
  Active: "bg-success-soft text-success",
  "Invite expired": "bg-expired text-expired-foreground",
};
export function StatusPill({ status }: { status: CreatedStatus }) {
  return <span className={cn("inline-flex rounded-full px-2.5 py-0.5 text-xs leading-5 font-medium whitespace-nowrap", STATUS_TONE[status])}>{status}</span>;
}

const SOURCE_TONE: Record<FundingSource, string> = {
  CRS: "bg-primary-soft text-primary",
  "Corporate Organisation": "bg-blue-100 text-blue-800",
  Individual: "bg-slate-100 text-slate-700",
  Philanthropy: "bg-role text-role-foreground",
};
export function SourcePill({ source }: { source: FundingSource }) {
  return <span className={cn("inline-flex rounded-full px-2.5 py-0.5 text-xs leading-5 font-medium whitespace-nowrap", SOURCE_TONE[source])}>{source}</span>;
}

/** Label / value rows for review screens. */
export function Facts({ rows }: { rows: [string, React.ReactNode][] }) {
  return (
    <dl className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
      {rows.map(([k, v]) => (
        <div key={k} className="flex flex-col gap-0.5">
          <dt className="text-xs leading-4 tracking-wide text-gray-500 uppercase">{k}</dt>
          <dd className="text-sm leading-5 font-medium break-words text-heading">{v}</dd>
        </div>
      ))}
    </dl>
  );
}

/** "Mock design" marker so nobody mistakes the screens for live data. */
export function MockBanner() {
  return (
    <p className="rounded-md border border-dashed border-accent-light bg-primary-soft px-3 py-2 text-xs leading-4 text-primary">
      <strong>Design preview.</strong> Sample data only: nothing is saved, and no emails are sent.
    </p>
  );
}
