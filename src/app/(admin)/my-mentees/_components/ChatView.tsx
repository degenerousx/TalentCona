"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ImageIcon, Link2, SendHorizontal, Smile } from "lucide-react";
import { cn } from "@/lib/cn";
import { sampleChat, type ChatMessage, type Mentee } from "./data";

/**
 * Chat with a mentee (Figma 293:36203). Messages live in local state until a
 * chat backend exists; the mentee's reply is simulated with the typing dots.
 */

const now = () => new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });

function Photo({ src, alt, online }: { src: string; alt: string; online?: boolean }) {
  return (
    <span className="relative size-10 shrink-0">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={alt} width={40} height={40} className="size-10 rounded-full object-cover" />
      {online && (
        <span className="absolute right-0 bottom-0 size-2.5 rounded-full border-2 border-white bg-success" />
      )}
    </span>
  );
}

function Bubble({ message, menteeName }: { message: ChatMessage; menteeName: string }) {
  const mine = message.from === "me";
  return (
    <li className={cn("flex items-end gap-3", mine && "flex-row-reverse")}>
      <Photo
        src={mine ? "/my-mentees/avatar-me.png" : "/my-mentees/avatar-mentee.png"}
        alt={mine ? "You" : menteeName}
      />
      <div
        className={cn(
          "flex max-w-[75%] flex-col gap-2 rounded-xl px-3 py-2",
          mine
            ? "rounded-br-none bg-linear-to-r from-[#722fff] to-[#8509e4] text-xs leading-[19px] font-medium text-white"
            : "rounded-bl-none bg-white text-sm leading-[22px] text-slate-900",
        )}
      >
        {message.text && <p className="break-words">{message.text}</p>}
        {message.images && (
          <div className="flex flex-wrap gap-2">
            {message.images.map((src, i) =>
              src ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={i}
                  src={src}
                  alt={`Attachment ${i + 1}`}
                  className="size-[72px] rounded-xl bg-[#c4c4c4] object-cover"
                />
              ) : (
                <span
                  key={i}
                  role="img"
                  aria-label={`Attachment ${i + 1}`}
                  className="grid size-[72px] place-items-center rounded-xl bg-[#c4c4c4] text-white"
                >
                  <ImageIcon aria-hidden className="size-6" />
                </span>
              ),
            )}
          </div>
        )}
      </div>
      <time className="shrink-0 pb-1 text-xs leading-[19px] text-slate-500">{message.time}</time>
    </li>
  );
}

export function ChatView({ mentee }: { mentee: Mentee }) {
  const firstName = mentee.name.split(" ")[0];
  const [messages, setMessages] = useState(() => sampleChat(firstName));
  const [draft, setDraft] = useState("");
  const [typing, setTyping] = useState(false);
  const listRef = useRef<HTMLUListElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Keep the newest message in view.
  useEffect(() => {
    const list = listRef.current;
    if (list) list.scrollTop = list.scrollHeight;
  }, [messages, typing]);

  // Show the mentee "typing" for a moment after each message you send.
  useEffect(() => {
    if (!typing) return;
    const t = setTimeout(() => setTyping(false), 2500);
    return () => clearTimeout(t);
  }, [typing]);

  const send = (message: Omit<ChatMessage, "id" | "from" | "time">) => {
    setMessages((list) => [...list, { id: crypto.randomUUID(), from: "me", time: now(), ...message }]);
    setTyping(true);
  };

  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/my-mentees"
        className="self-start rounded text-base leading-6 font-semibold text-slate-900 hover:text-primary"
      >
        <span aria-hidden>← </span>Back<span className="sr-only"> to My Mentees</span>
      </Link>

      <section aria-label={`Chat with ${mentee.name}`} className="flex flex-col gap-4 rounded-xl bg-white p-4 sm:p-8">
        <header className="flex items-center gap-3">
          <Photo src="/my-mentees/avatar-mentee.png" alt="" online />
          <div>
            <h1 className="text-sm leading-[22px] text-slate-900">{mentee.name}</h1>
            <p className="text-xs leading-[19px] text-slate-700">Online</p>
          </div>
        </header>

        <div className="flex flex-col gap-4 rounded-xl bg-[#fafafa] p-3 sm:p-4">
          <ul
            ref={listRef}
            aria-live="polite"
            className="flex max-h-[60dvh] min-h-[400px] flex-col gap-6 overflow-y-auto pr-1"
          >
            <li aria-hidden className="flex items-center gap-4">
              <span className="h-0.5 flex-1 rounded bg-blue-200" />
              <span className="text-xs leading-[19px] font-medium text-slate-500">Today</span>
              <span className="h-0.5 flex-1 rounded bg-blue-200" />
            </li>
            {messages.map((m) => (
              <Bubble key={m.id} message={m} menteeName={mentee.name} />
            ))}
            {typing && (
              <li className="flex items-end gap-3">
                <Photo src="/my-mentees/avatar-mentee.png" alt={mentee.name} />
                <span className="flex gap-1.5 rounded-xl rounded-bl-none bg-white px-4 py-5" aria-label={`${firstName} is typing`}>
                  {[0, 1, 2, 3].map((i) => (
                    <span
                      key={i}
                      className="size-1.5 animate-bounce rounded-full bg-primary"
                      style={{ animationDelay: `${i * 120}ms` }}
                    />
                  ))}
                </span>
              </li>
            )}
          </ul>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!draft.trim()) return;
              send({ text: draft.trim() });
              setDraft("");
            }}
            className="flex items-center gap-3 rounded-xl bg-white py-2.5 pr-3 pl-4"
          >
            <label htmlFor="chat-input" className="sr-only">
              Message {mentee.name}
            </label>
            <input
              id="chat-input"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Write your message..."
              autoComplete="off"
              className="min-w-0 flex-1 bg-transparent text-sm leading-[22px] text-slate-900 placeholder:text-slate-500 focus:outline-none"
            />
            <button
              type="button"
              aria-label="Add emoji"
              onClick={() => setDraft((d) => `${d}🙂`)}
              className="grid size-8 place-items-center rounded-full text-slate-500 hover:bg-gray-100"
            >
              <Smile aria-hidden className="size-5" />
            </button>
            <button
              type="button"
              aria-label="Attach images"
              onClick={() => fileRef.current?.click()}
              className="grid size-8 place-items-center rounded-full text-slate-500 hover:bg-gray-100"
            >
              <Link2 aria-hidden className="size-5" />
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              multiple
              className="sr-only"
              tabIndex={-1}
              onChange={(e) => {
                const files = [...(e.target.files ?? [])];
                if (files.length) send({ images: files.map((f) => URL.createObjectURL(f)) });
                e.target.value = "";
              }}
            />
            <button
              type="submit"
              aria-label="Send message"
              className="grid size-9 shrink-0 place-items-center rounded-full bg-primary text-white hover:bg-primary/90"
            >
              <SendHorizontal aria-hidden className="size-4" />
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
