"use client";

import { useState } from "react";
import Link from "next/link";
import { LayoutGrid, List, MessageSquare } from "lucide-react";
import { cn } from "@/lib/cn";
import { mentees, type Mentee } from "./data";
import { Avatar, FinalProjectBadge, headerWash } from "./shared";

type Layout = "grid" | "list";

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm leading-5">
      <span className="text-slate-700">{label}</span>
      <span className="font-bold text-slate-900">{children}</span>
    </div>
  );
}

/** Mentee card from Figma 293:34929 (grid) / 293:35245 (list). */
function MenteeCard({ mentee, layout }: { mentee: Mentee; layout: Layout }) {
  return (
    <li className="flex flex-col gap-6 overflow-hidden rounded-[14px] border border-purple-100 bg-white pb-6 shadow-md">
      <div className={cn("flex items-center gap-4 px-6 py-6", headerWash[mentee.theme])}>
        <Avatar mentee={mentee} size="md" />
        <div className="min-w-0">
          <p className="text-base leading-4 text-slate-900">{mentee.name}</p>
          <p className="text-base leading-6 text-slate-700">{mentee.program}</p>
        </div>
      </div>

      <div className="flex flex-col gap-3 px-6">
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between text-sm leading-5">
            <span className="text-slate-700">Course Progress</span>
            <span className="font-bold text-primary">{mentee.progress}%</span>
          </div>
          <div
            role="progressbar"
            aria-label={`${mentee.name} course progress`}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={mentee.progress}
            className="h-2 overflow-hidden rounded-full bg-gray-200"
          >
            <div className="h-full rounded-full bg-success" style={{ width: `${mentee.progress}%` }} />
          </div>
        </div>
        <Row label="Sessions completed:">{mentee.sessionsCompleted}</Row>
        <Row label="Next session:">{mentee.nextSession ?? "Not scheduled"}</Row>
        <div className="flex items-center justify-between gap-3 text-sm leading-5">
          <span className="text-slate-700">Final project:</span>
          <FinalProjectBadge status={mentee.finalProject} />
        </div>

        <div className={cn("mt-1 flex gap-3", layout === "list" && "justify-end")}>
          <Link
            href={`/my-mentees/${mentee.id}/chat`}
            className={cn(
              "flex h-[34px] items-center justify-center gap-3 rounded-lg border border-purple-200 bg-white px-8 text-sm leading-5 text-slate-900 hover:bg-purple-50",
              layout === "grid" && "flex-1",
            )}
          >
            <MessageSquare aria-hidden className="size-4" />
            Chat<span className="sr-only"> with {mentee.name}</span>
          </Link>
          <Link
            href={`/my-mentees/${mentee.id}`}
            className={cn(
              "flex h-9 items-center justify-center rounded-lg bg-primary px-4 text-sm leading-5 text-white hover:bg-primary/90",
              layout === "grid" && "flex-1",
            )}
          >
            View Details<span className="sr-only"> for {mentee.name}</span>
          </Link>
        </div>
      </div>
    </li>
  );
}

export function MenteesView() {
  const [layout, setLayout] = useState<Layout>("grid");

  const toggle = (value: Layout, label: string, Icon: typeof List) => (
    <button
      type="button"
      aria-label={label}
      aria-pressed={layout === value}
      onClick={() => setLayout(value)}
      className={cn(
        "grid size-8 place-items-center rounded text-slate-900",
        layout === value ? "bg-[#a29eda]" : "hover:bg-gray-100",
      )}
    >
      <Icon aria-hidden className="size-5" />
    </button>
  );

  return (
    <div className="flex flex-col gap-8">
      <div className="flex justify-end">
        <div className="flex gap-6 rounded-[10px] bg-white p-3" role="group" aria-label="Layout">
          {toggle("list", "List view", List)}
          {toggle("grid", "Grid view", LayoutGrid)}
        </div>
      </div>

      <ul
        aria-label="Mentees"
        className={cn("grid gap-6", layout === "grid" ? "sm:grid-cols-2 xl:grid-cols-3" : "grid-cols-1")}
      >
        {mentees.map((m) => (
          <MenteeCard key={m.id} mentee={m} layout={layout} />
        ))}
      </ul>
    </div>
  );
}
