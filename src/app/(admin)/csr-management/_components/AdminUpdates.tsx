"use client";

import { useState } from "react";
import { MessageSquareText, Pencil, PencilLine, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/cn";
import type { AdminUpdate } from "./data";
import { Btn, TextArea } from "./ui";

const when = (iso: string) =>
  new Date(iso).toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
const initials = (name: string) =>
  name
    .split(/[\s@.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join("");

/**
 * Admin updates on a sponsorship request: a box to record a new update, and
 * the full history (newest first). Nothing is ever removed; admins can edit
 * the updates they wrote themselves, and an edit is marked as such.
 */
export function AdminUpdates({
  me,
  updates,
  onAdd,
  onEdit,
}: {
  me: string;
  updates: AdminUpdate[];
  onAdd: (text: string) => void;
  onEdit: (id: string, text: string) => void;
}) {
  const [text, setText] = useState("");
  const sorted = [...updates].sort((a, b) => b.at.localeCompare(a.at));

  return (
    <section aria-labelledby="admin-updates" className="flex flex-col gap-4">
      <div>
        <h3 id="admin-updates" className="text-sm font-semibold text-[#101828]">
          Admin Updates
        </h3>
        <p className="text-xs text-[#6a7282]">Record calls, meetings and progress with this sponsor. Every update is kept in the history below.</p>
      </div>
      <form
        className="flex flex-col gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          if (!text.trim()) return;
          onAdd(text.trim());
          setText("");
        }}
      >
        <label className="sr-only" htmlFor="new-update">
          New update
        </label>
        <TextArea id="new-update" value={text} onChange={(e) => setText(e.target.value)} placeholder="e.g. Called the sponsor to confirm the number of talents…" />
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs text-[#99a1af]">Posting as {me}</p>
          <Btn type="submit" disabled={!text.trim()} className="px-4 py-2.5">
            Post Update
          </Btn>
        </div>
      </form>

      <div>
        <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-[#101828]">
          Activity History <span className="rounded-full bg-[#f3f4f6] px-2 py-0.5 text-xs font-medium text-[#4a5565]">{updates.length}</span>
        </h3>
        {sorted.length === 0 ? (
          <p className="rounded-[12px] border border-dashed border-[#e5e7eb] p-4 text-center text-sm text-[#6a7282]">No updates yet. The first one you post will appear here.</p>
        ) : (
          <ol className="relative flex flex-col gap-4 before:absolute before:top-2 before:bottom-2 before:left-4 before:w-px before:bg-[#e5e7eb]">
            {sorted.map((u) => (
              <Entry key={u.id} u={u} mine={u.author === me && u.kind === "update"} onEdit={onEdit} />
            ))}
          </ol>
        )}
      </div>
    </section>
  );
}

function Entry({ u, mine, onEdit }: { u: AdminUpdate; mine: boolean; onEdit: (id: string, text: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(u.text);
  const Icon = u.kind === "edit" ? PencilLine : u.kind === "decision" ? ShieldCheck : MessageSquareText;

  return (
    <li className="relative flex gap-3">
      <span
        aria-hidden
        className={cn(
          "z-10 flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold ring-4 ring-white",
          u.kind === "update" ? "bg-accent-light text-accent-deep" : "bg-[#f3f4f6] text-[#6a7282]",
        )}
      >
        {u.kind === "update" ? initials(u.author) : <Icon className="size-3.5" />}
      </span>
      <article className="min-w-0 flex-1 rounded-[12px] border border-[#e5e7eb] bg-white p-3">
        <header className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
          <p className="text-sm font-semibold text-[#101828]">
            {u.author}
            {u.kind !== "update" && <span className="ml-2 text-xs font-normal text-[#6a7282]">{u.kind === "edit" ? "edited the request" : "decision"}</span>}
          </p>
          <div className="flex items-center gap-2">
            <time dateTime={u.at} className="text-xs text-[#99a1af]">
              {when(u.at)}
            </time>
            {mine && !editing && (
              <button type="button" onClick={() => setEditing(true)} aria-label="Edit this update" className="rounded-[6px] p-1 text-[#6a7282] hover:bg-slate-100 hover:text-primary">
                <Pencil className="size-3.5" />
              </button>
            )}
          </div>
        </header>
        {editing ? (
          <form
            className="mt-2 flex flex-col gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (!text.trim()) return;
              onEdit(u.id, text.trim());
              setEditing(false);
            }}
          >
            <label className="sr-only" htmlFor={`edit-${u.id}`}>
              Edit update
            </label>
            <TextArea id={`edit-${u.id}`} value={text} onChange={(e) => setText(e.target.value)} autoFocus />
            <div className="flex justify-end gap-2">
              <Btn
                variant="outline"
                className="px-4 py-2"
                onClick={() => {
                  setText(u.text);
                  setEditing(false);
                }}
              >
                Cancel
              </Btn>
              <Btn type="submit" className="px-4 py-2" disabled={!text.trim()}>
                Save
              </Btn>
            </div>
          </form>
        ) : (
          <p className="mt-1 text-sm leading-5 whitespace-pre-line text-[#364153]">{u.text}</p>
        )}
        {u.editedAt && !editing && <p className="mt-1 text-xs text-[#99a1af]">Edited {when(u.editedAt)}</p>}
      </article>
    </li>
  );
}
