"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  MessageSquareText,
  Mic,
  MicOff,
  MonitorUp,
  PhoneOff,
  SendHorizontal,
  Video,
  VideoOff,
  Volume2,
  X,
} from "lucide-react";
import { cn } from "@/lib/cn";
import type { Session } from "./data";

/**
 * Live mentor session (Figma 293:36423). The call itself is UI only until a
 * video provider is wired in; the feeds are placeholders for the design photos.
 */

const clock = (s: number) =>
  [Math.floor(s / 3600), Math.floor((s % 3600) / 60), s % 60].map((n) => String(n).padStart(2, "0")).join(":");

function Participant({ initials, name, role }: { initials: string; name: string; role: string }) {
  return (
    <li className="flex items-center gap-2">
      <span aria-hidden className="grid size-9 place-items-center rounded-full bg-[#ececf0] text-xs text-slate-900">
        {initials}
      </span>
      <span className="flex flex-col">
        <span className="text-xs leading-4 text-slate-900">{name}</span>
        <span className="text-[10px] leading-3 text-slate-500">{role}</span>
      </span>
    </li>
  );
}

function Control({
  label,
  pressed,
  onClick,
  children,
  className,
}: {
  label: string;
  pressed?: boolean;
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={pressed}
      title={label}
      onClick={onClick}
      className={cn(
        "grid size-12 place-items-center rounded-full bg-[#5c3d1e]/80 text-white backdrop-blur hover:bg-[#5c3d1e]",
        className,
      )}
    >
      {children}
    </button>
  );
}

export function CallView({ session }: { session: Session }) {
  const router = useRouter();
  const [elapsed, setElapsed] = useState(0);
  const [mic, setMic] = useState(true);
  const [camera, setCamera] = useState(true);
  const [sharing, setSharing] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [volume, setVolume] = useState(70);
  const [messages, setMessages] = useState<string[]>([]);
  const [draft, setDraft] = useState("");

  // Recording timer.
  useEffect(() => {
    const t = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-center justify-between gap-4 rounded-lg bg-white px-4 py-4 sm:px-8">
        <h1 className="text-base leading-6 text-slate-900">Mentor Session: {session.topic}</h1>
        <ul aria-label="Participants" className="flex gap-6">
          <Participant initials={session.initials} name={session.mentee} role="Student" />
          <Participant initials="ME" name="You" role="Mentor" />
        </ul>
      </header>

      <div className="flex flex-col gap-4 lg:flex-row">
        <section
          aria-label={`Video call with ${session.mentee}`}
          className="relative flex h-[calc(100dvh-240px)] min-h-[420px] flex-1 items-center justify-center overflow-hidden rounded-2xl bg-linear-to-br from-[#3b3a44] via-[#5a4a3c] to-[#2c2b33]"
        >
          {/* Student feed placeholder */}
          <span
            aria-hidden
            className="grid size-32 place-items-center rounded-full bg-white/15 text-5xl font-semibold text-white"
          >
            {session.initials}
          </span>

          <p className="absolute top-4 left-4 flex items-center gap-2 rounded-lg bg-black/40 px-3 py-1.5 text-xs leading-4 text-white">
            <span className="size-2.5 animate-pulse rounded-full bg-red-500" />
            REC <span className="tabular-nums">{clock(elapsed)}</span>
          </p>

          {sharing && (
            <p className="absolute top-4 left-1/2 -translate-x-1/2 rounded-lg bg-primary px-3 py-1.5 text-xs leading-4 text-white">
              You are presenting
            </p>
          )}

          {/* Self view */}
          <div className="absolute top-4 right-4 grid size-[89px] place-items-center rounded-lg border-2 border-white/60 bg-[#f5c542] text-sm font-semibold text-slate-900">
            {camera ? "You" : <VideoOff aria-label="Your camera is off" className="size-5" />}
            <span
              className={cn(
                "absolute right-1 bottom-1 grid size-5 place-items-center rounded-full text-white",
                mic ? "bg-success" : "bg-danger",
              )}
            >
              {mic ? <Mic aria-hidden className="size-3" /> : <MicOff aria-label="You are muted" className="size-3" />}
            </span>
          </div>

          {/* Volume */}
          <label className="absolute bottom-4 left-4 flex flex-col items-center gap-2 rounded-lg bg-black/40 px-2 py-3 text-white">
            <span className="sr-only">Call volume</span>
            <input
              type="range"
              min={0}
              max={100}
              value={volume}
              onChange={(e) => setVolume(Number(e.target.value))}
              className="h-20 w-2 accent-white [direction:rtl] [writing-mode:vertical-lr]"
            />
            <Volume2 aria-hidden className="size-4" />
          </label>

          {/* Controls */}
          <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-3 sm:gap-4">
            <Control label={sharing ? "Stop sharing screen" : "Share screen"} pressed={sharing} onClick={() => setSharing(!sharing)}>
              <MonitorUp aria-hidden className="size-5" />
            </Control>
            <Control label={camera ? "Turn camera off" : "Turn camera on"} pressed={!camera} onClick={() => setCamera(!camera)}>
              {camera ? <Video aria-hidden className="size-5" /> : <VideoOff aria-hidden className="size-5" />}
            </Control>
            <Control
              label="Leave session"
              onClick={() => router.push(`/sessions/${session.id}/ended`)}
              className="h-12 w-[72px] rounded-lg bg-[#e0282e] hover:bg-[#c21f25]"
            >
              <PhoneOff aria-hidden className="size-5" />
            </Control>
            <Control label={mic ? "Mute microphone" : "Unmute microphone"} pressed={!mic} onClick={() => setMic(!mic)}>
              {mic ? <Mic aria-hidden className="size-5" /> : <MicOff aria-hidden className="size-5" />}
            </Control>
            <Control label={chatOpen ? "Close chat" : "Open chat"} pressed={chatOpen} onClick={() => setChatOpen(!chatOpen)}>
              <MessageSquareText aria-hidden className="size-5" />
            </Control>
          </div>
        </section>

        {chatOpen && (
          <aside aria-label="In-call chat" className="flex w-full flex-col rounded-2xl bg-white lg:w-80">
            <header className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
              <h2 className="text-sm leading-5 font-semibold text-slate-900">In-call chat</h2>
              <button
                type="button"
                aria-label="Close chat"
                onClick={() => setChatOpen(false)}
                className="grid size-8 place-items-center rounded-lg text-slate-500 hover:bg-gray-100"
              >
                <X aria-hidden className="size-4" />
              </button>
            </header>
            <ul aria-live="polite" className="flex min-h-40 flex-1 flex-col gap-2 overflow-y-auto p-4">
              {messages.length === 0 && <li className="text-sm leading-5 text-slate-500">No messages yet.</li>}
              {messages.map((m, i) => (
                <li key={i} className="self-end rounded-xl rounded-br-none bg-primary px-3 py-2 text-sm leading-5 text-white">
                  {m}
                </li>
              ))}
            </ul>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!draft.trim()) return;
                setMessages([...messages, draft.trim()]);
                setDraft("");
              }}
              className="flex gap-2 border-t border-gray-200 p-3"
            >
              <label htmlFor="call-chat" className="sr-only">
                Message
              </label>
              <input
                id="call-chat"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Write your message..."
                className="min-w-0 flex-1 rounded-lg border border-gray-300 px-3 text-sm leading-5 focus:border-primary focus:outline-none"
              />
              <button
                type="submit"
                aria-label="Send"
                className="grid size-9 place-items-center rounded-full bg-primary text-white hover:bg-primary/90"
              >
                <SendHorizontal aria-hidden className="size-4" />
              </button>
            </form>
          </aside>
        )}
      </div>
    </div>
  );
}
