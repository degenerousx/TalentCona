"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CircleCheck, Clock, ShieldCheck, Star, Video } from "lucide-react";
import { cn } from "@/lib/cn";
import { sampleSummary, type Session } from "./data";

/**
 * "You left the mentor session" (Figma 293:36544). Counts down back to the
 * sessions list; any interaction with the page stops the countdown.
 */

const COUNTDOWN = 5;

export function SessionEnded({ session }: { session: Session }) {
  const router = useRouter();
  const [left, setLeft] = useState(COUNTDOWN);
  const [paused, setPaused] = useState(false);
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);

  useEffect(() => {
    if (paused) return;
    if (left <= 0) {
      router.push("/sessions");
      return;
    }
    const t = setTimeout(() => setLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [left, paused, router]);

  const tiles = [
    { label: "Topic", value: session.topic, className: "bg-blue-50" },
    { label: "Duration", value: sampleSummary.duration, className: "bg-[#e6fbf7]" },
    { label: "Start Time", value: sampleSummary.start, className: "bg-[#faf5ff]" },
    { label: "End Time", value: sampleSummary.end, className: "bg-amber-50" },
  ];
  const shown = hover || rating;

  return (
    <div className="flex flex-col items-center gap-8" onPointerDown={() => setPaused(true)} onKeyDown={() => setPaused(true)}>
      <p className="flex items-center gap-3 self-start text-sm leading-5 text-slate-900" aria-live="polite">
        <span className="grid size-9 place-items-center rounded-full bg-white shadow">
          <Clock aria-hidden className="size-4 text-primary" />
        </span>
        {paused ? "Automatic return paused" : `Returning to home screen in ${left}s`}
      </p>

      <div className="flex flex-col items-center gap-3 text-center">
        <span className="grid size-16 place-items-center rounded-full bg-[#e6fbf7]">
          <CircleCheck aria-hidden className="size-8 text-success" />
        </span>
        <h1 className="text-3xl leading-9 text-heading">You left the mentor session</h1>
        <p className="text-base leading-6 text-slate-700">Session with {session.mentee}</p>
        <div className="mt-3 flex gap-4">
          <Link
            href={`/sessions/${session.id}/call`}
            className="flex h-10 items-center rounded-lg border border-gray-200 bg-white px-8 text-sm leading-5 text-slate-900 hover:bg-gray-50"
          >
            Rejoin
          </Link>
          <Link
            href="/sessions"
            className="flex h-10 items-center rounded-lg bg-primary px-8 text-sm leading-5 text-white hover:bg-primary/90"
          >
            Return to home screen
          </Link>
        </div>
      </div>

      <section className="w-full max-w-[768px] rounded-[14px] border border-gray-200 bg-white p-6 shadow-md">
        <h2 className="mb-4 flex items-center gap-2 text-lg leading-7 text-heading">
          <Video aria-hidden className="size-5 text-primary" />
          Session Summary
        </h2>
        <dl className="grid gap-3 sm:grid-cols-2">
          {tiles.map((t) => (
            <div key={t.label} className={cn("flex flex-col gap-1 rounded-[10px] p-4", t.className)}>
              <dt className="text-sm leading-5 text-slate-600">{t.label}</dt>
              <dd className="text-base leading-6 text-heading">{t.value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="w-full max-w-[768px] rounded-[14px] border border-gray-200 bg-white p-6 text-center shadow-md">
        <fieldset>
          <legend className="mx-auto mb-4 text-lg leading-7 text-heading">How was the audio and video?</legend>
          <div className="flex justify-center gap-3" onMouseLeave={() => setHover(0)}>
            {[1, 2, 3, 4, 5].map((n) => (
              <label key={n} className="cursor-pointer" onMouseEnter={() => setHover(n)}>
                <input
                  type="radio"
                  name="call-quality"
                  value={n}
                  checked={rating === n}
                  onChange={() => setRating(n)}
                  className="peer sr-only"
                />
                <Star
                  aria-hidden
                  className={cn(
                    "size-9 rounded peer-focus-visible:ring-2 peer-focus-visible:ring-primary",
                    n <= shown ? "fill-amber-400 text-amber-400" : "text-gray-300",
                  )}
                />
                <span className="sr-only">
                  {n} {n === 1 ? "star" : "stars"}
                </span>
              </label>
            ))}
          </div>
          <div className="mt-3 flex justify-between text-xs leading-4 text-slate-600">
            <span>Very bad</span>
            <span>Very good</span>
          </div>
          {rating > 0 && (
            <p role="status" className="mt-3 text-sm leading-5 text-success">
              Thanks for your feedback!
            </p>
          )}
        </fieldset>
      </section>

      <section className="flex w-full max-w-[768px] gap-4 rounded-[14px] border border-[#e6fbf7] bg-blue-50 p-6 shadow-md">
        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-primary text-white">
          <ShieldCheck aria-hidden className="size-5" />
        </span>
        <div className="flex flex-col gap-1">
          <h2 className="text-base leading-6 text-heading">Your session was secure</h2>
          <p className="text-sm leading-5 text-slate-700">
            All mentor sessions are encrypted and monitored for quality assurance. Only authorized participants can
            join sessions.
          </p>
        </div>
      </section>
    </div>
  );
}
