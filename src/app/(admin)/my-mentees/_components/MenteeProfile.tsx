import Link from "next/link";
import { Calendar, Clock, MessageSquare } from "lucide-react";
import { cn } from "@/lib/cn";
import type { Mentee } from "./data";
import { Avatar } from "./shared";

/** Mentee details from Figma 293:35562. */

const greenBadge = "rounded-lg bg-linear-to-r from-[#00c950] to-[#009966] px-2 py-0.5 text-xs leading-4 text-white";

function SectionCard({
  title,
  description,
  wash,
  children,
}: {
  title: string;
  description: string;
  wash: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-6 overflow-hidden rounded-[14px] border border-purple-100 bg-white pb-6 shadow-md">
      <header className={cn("flex flex-col gap-1.5 px-6 py-6", wash)}>
        <h2 className="flex items-center gap-2 text-base leading-4 text-slate-900">
          <Calendar aria-hidden className="size-4 text-primary" />
          {title}
        </h2>
        <p className="text-base leading-6 text-slate-700">{description}</p>
      </header>
      <div className="flex flex-col gap-3 px-6">{children}</div>
    </section>
  );
}

export function MenteeProfile({ mentee }: { mentee: Mentee }) {
  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/my-mentees"
        className="self-start rounded text-base leading-6 font-semibold text-slate-900 hover:text-primary"
      >
        <span aria-hidden>← </span>Back<span className="sr-only"> to My Mentees</span>
      </Link>

      <section className="flex flex-wrap items-start gap-6 rounded-[14px] bg-[#a29eda] p-6">
        <Avatar mentee={mentee} size="lg" />
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <h1 className="text-2xl leading-8 text-white">{mentee.name}</h1>
          <p className="text-base leading-6 text-white">{mentee.program} Program</p>
          <p className="flex flex-wrap gap-2">
            <span className={greenBadge}>{mentee.status}</span>
            <span className="rounded-lg border border-white bg-white px-2 py-0.5 text-xs leading-4 text-slate-900">
              Joined: {mentee.joined}
            </span>
          </p>
        </div>
        <Link
          href={`/my-mentees/${mentee.id}/chat`}
          className="flex h-9 items-center gap-2 rounded-lg bg-primary px-3 text-sm leading-5 text-white hover:bg-primary/90"
        >
          <MessageSquare aria-hidden className="size-4" />
          Chat
        </Link>
      </section>

      <SectionCard
        title="Upcoming Sessions"
        description="Your scheduled mentorship sessions"
        wash="bg-linear-to-r from-[#faf5ff] to-[#fdf2f8]"
      >
        {mentee.upcoming.length ? (
          <ul className="flex flex-col gap-3">
            {mentee.upcoming.map((s) => (
              <li
                key={s.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-[10px] border-[1.6px] border-purple-100 px-4 py-4"
              >
                <div className="flex flex-col gap-1">
                  <p className="text-sm leading-5 font-bold text-slate-900">{s.title}</p>
                  <p className="flex items-center gap-1.5 text-sm leading-5 text-slate-900">
                    <Clock aria-hidden className="size-4 text-primary" />
                    {s.when}
                  </p>
                </div>
                <span className={greenBadge}>{s.status}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="py-4 text-center text-sm leading-5 text-slate-500">No upcoming sessions scheduled.</p>
        )}
      </SectionCard>

      <SectionCard
        title="Session History"
        description="Your completed mentorship sessions"
        wash="bg-linear-to-r from-[#eff6ff] to-[#ecfeff]"
      >
        <div className="flex items-center justify-between rounded-[10px] border border-[#e6fbf7] bg-blue-50 p-4">
          <span className="text-sm leading-5 font-bold text-heading">Sessions Completed</span>
          <span className="text-3xl leading-9 font-bold text-primary">{mentee.history.length}</span>
        </div>
        <ul className="flex flex-col gap-3">
          {mentee.history.map((s) => (
            <li
              key={s.id}
              className="flex items-center justify-between gap-3 rounded-[10px] border border-gray-200 px-3 py-3"
            >
              <div className="flex flex-col gap-0.5">
                <p className="text-sm leading-5 font-bold text-slate-900">{s.title}</p>
                <p className="text-xs leading-4 text-muted">{s.when}</p>
              </div>
              <span className="rounded-lg border border-gray-200 bg-[#eceef2] px-2 py-0.5 text-xs leading-4 text-slate-900">
                Completed
              </span>
            </li>
          ))}
        </ul>
      </SectionCard>
    </div>
  );
}
