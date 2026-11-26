"use client";

import { useMemo, useState } from "react";
import { BookOpen, Calendar, CircleDot, Clock, Handshake, Pencil } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/cn";
import { useCurrentAdmin } from "@/lib/currentAdmin";
import { REQUESTS, REQUEST_UPDATES, type AdminUpdate, type Submission, type SponsorshipRequest } from "./data";
import { Empty, InfoTile, Panel, Tag, Toolbar, card } from "./ui";
import { Chips, SubmissionDetails } from "./Submission";
import { RequestEditor } from "./RequestEditor";
import { AdminUpdates, when } from "./AdminUpdates";

/**
 * Sponsorship requests: what sponsors submitted on the website. Requests stay
 * here (there is no approve / reject): admins edit the details and record
 * their work, and each request shows when it was last worked on and by whom.
 */

const FORM = ["All", "Full Application", "Quick Request"] as const;
const ACTIVITY = ["All", "Worked on", "Not worked on yet"] as const;

/** Field labels, for the "edited the request" history entry. */
const LABELS: Record<string, string> = {
  organizationType: "Organization Type", contactPerson: "Contact Person", email: "Email", country: "Country", phone: "Phone Number",
  stateCity: "State/City", goals: "Sponsorship Goals", preference: "Type of sponsorship", talents: "Number of Talents",
  careerPaths: "Career Path Interest", impactFocus: "Impact Focus", engagement: "Engagement Options", additionalInfo: "Additional information",
};
const changedFields = (a: Submission, b: Submission) =>
  Object.keys(LABELS).filter((k) => k in a && JSON.stringify(a[k as keyof Submission]) !== JSON.stringify(b[k as keyof Submission])).map((k) => LABELS[k]);
let seq = 100;
const now = () => new Date().toISOString().slice(0, 19);

/** The most recent thing an admin did on a request: an update, an edit of one, or a details edit. */
export function lastActivity(updates: AdminUpdate[] = []) {
  let last: { at: string; author: string } | null = null;
  for (const u of updates) {
    const at = u.editedAt && u.editedAt > u.at ? u.editedAt : u.at;
    if (!last || at > last.at) last = { at, author: u.author };
  }
  return last;
}

export function RequestsTab() {
  const [requests, setRequests] = useState(REQUESTS);
  const [updates, setUpdates] = useState<Record<string, AdminUpdate[]>>(REQUEST_UPDATES);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState<(typeof FORM)[number]>("All");
  const [activity, setActivity] = useState<(typeof ACTIVITY)[number]>("All");
  const [openId, setOpenId] = useState<string | null>(null);
  const open = requests.find((r) => r.id === openId) ?? null;
  const admin = useCurrentAdmin();
  const me = admin.name ?? admin.email ?? "You";

  const log = (id: string, entry: Omit<AdminUpdate, "id" | "at" | "author">) =>
    setUpdates((u) => ({ ...u, [id]: [...(u[id] ?? []), { id: `u-${++seq}`, at: now(), author: me, ...entry }] }));

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return requests.filter(
      (r) =>
        (form === "All" || (form === "Quick Request") === (r.submission.form === "Quick Sponsor Request")) &&
        (activity === "All" || (activity === "Worked on") === Boolean(updates[r.id]?.length)) &&
        (!q || [r.id, r.name, r.contact, r.email].some((v) => v.toLowerCase().includes(q))),
    );
  }, [requests, updates, search, form, activity]);

  return (
    <div className="flex flex-col gap-6">
      <Toolbar
        search={search}
        onSearch={setSearch}
        groups={[
          { label: "Filter by form", options: FORM, value: form, onChange: setForm },
          { label: "Filter by activity", options: ACTIVITY, value: activity, onChange: setActivity },
        ]}
      />
      {rows.length === 0 ? (
        <Empty />
      ) : (
        <ul className="flex flex-col gap-3">
          {rows.map((r) => (
            <li key={r.id}>
              <RequestCard r={r} last={lastActivity(updates[r.id])} onOpen={() => setOpenId(r.id)} />
            </li>
          ))}
        </ul>
      )}
      {open && (
        <RequestPanel
          r={open}
          me={me}
          updates={updates[open.id] ?? []}
          onClose={() => setOpenId(null)}
          onSaveDetails={(next) => {
            const changed = changedFields(open.submission, next);
            if (!changed.length) return toast("No changes to save");
            setRequests((rs) =>
              rs.map((r) => (r.id === open.id ? { ...r, submission: next, email: next.email, contact: next.form === "Full Application" ? next.contactPerson : r.contact } : r)),
            );
            log(open.id, { kind: "edit", text: `Updated ${changed.join(", ")}.` });
            toast.success("Saved (design preview: nothing is stored)");
          }}
          onAddUpdate={(text) => {
            log(open.id, { kind: "update", text });
            toast.success("Update saved");
          }}
          onEditUpdate={(uid, text) => {
            setUpdates((u) => ({ ...u, [open.id]: (u[open.id] ?? []).map((x) => (x.id === uid ? { ...x, text, editedAt: now() } : x)) }));
            toast.success("Update saved");
          }}
        />
      )}
    </div>
  );
}

const meta = "flex items-center gap-1 text-xs leading-4 text-[#6a7282]";

/** "Last worked on 4 Oct 2026, 14:40 by Tunde Bello", or a prompt when no one has yet. */
function LastWorked({ last, className }: { last: ReturnType<typeof lastActivity>; className?: string }) {
  return last ? (
    <span className={cn("inline-flex items-center gap-1 text-xs leading-4 text-[#4a5565]", className)}>
      <Clock className="size-3" aria-hidden /> Last worked on {when(last.at)} by <span className="font-medium text-[#101828]">{last.author}</span>
    </span>
  ) : (
    <span className={cn("inline-flex items-center gap-1 rounded-full border border-[#fee685] bg-[#fffbeb] px-2.5 py-0.5 text-xs leading-4 font-medium text-[#bb4d00]", className)}>
      Not worked on yet
    </span>
  );
}

function RequestCard({ r, last, onOpen }: { r: SponsorshipRequest; last: ReturnType<typeof lastActivity>; onOpen: () => void }) {
  const s = r.submission;
  const full = s.form === "Full Application";
  return (
    <button type="button" onClick={onOpen} className={cn(card, "w-full p-5 text-left transition-colors hover:border-[#d1d5dc]")}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs text-[#99a1af]">{r.id}</span>
            <Tag>{full ? "Full Application" : "Quick Request"}</Tag>
          </div>
          <p className="pt-0.5 text-base leading-6 font-bold tracking-[-0.31px] text-[#101828]">{r.name}</p>
          <p className="text-xs leading-4 text-[#6a7282]">
            {r.contact} · {r.email}
          </p>
        </div>
        <div className="text-right">
          <p className="text-lg leading-7 font-bold tracking-[-0.44px] text-[#722fff]">{full ? `${s.talents} ${s.talents === 1 ? "talent" : "talents"}` : "Partner"}</p>
          <p className="text-xs leading-4 text-[#99a1af]">{full ? s.preference : "Quick request"}</p>
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 pt-3">
        <div className="flex flex-wrap items-center gap-4">
          <span className={meta}>
            <CircleDot className="size-[11px]" /> {r.orgType}
          </span>
          <span className={meta}>
            {full ? <BookOpen className="size-[11px]" /> : <Handshake className="size-[11px]" />} {full ? s.careerPaths.join(", ") : s.areaOfInterest}
          </span>
          <span className={meta}>
            <Calendar className="size-[11px]" /> Submitted {s.submittedAt}
          </span>
        </div>
        <LastWorked last={last} />
      </div>
    </button>
  );
}

function RequestPanel({
  r,
  me,
  updates,
  onClose,
  onSaveDetails,
  onAddUpdate,
  onEditUpdate,
}: {
  r: SponsorshipRequest;
  me: string;
  updates: AdminUpdate[];
  onClose: () => void;
  onSaveDetails: (next: Submission) => void;
  onAddUpdate: (text: string) => void;
  onEditUpdate: (id: string, text: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const s = r.submission;
  return (
    <Panel open onClose={onClose} eyebrow={`${r.id} · Submitted ${s.submittedAt}`} title={r.name}>
      <div className="mb-5">
        <LastWorked last={lastActivity(updates)} />
      </div>
      {editing ? (
        <div className="flex flex-col gap-4">
          <div>
            <h3 className="text-base font-bold text-[#101828]">Edit Information</h3>
            <p className="text-xs text-[#6a7282]">Correct the sponsor&apos;s details. The {s.form === "Full Application" ? "organization" : "sponsor"} name can&apos;t be changed.</p>
          </div>
          <RequestEditor
            value={s}
            onCancel={() => setEditing(false)}
            onSave={(next) => {
              onSaveDetails(next);
              setEditing(false);
            }}
          />
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-sm font-semibold text-[#101828]">Request Details</h3>
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="flex items-center gap-1.5 rounded-[8px] border border-[#e5e7eb] px-3 py-1.5 text-xs font-medium text-[#4a5565] hover:border-primary hover:text-primary"
            >
              <Pencil className="size-3.5" /> Edit Information
            </button>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <InfoTile label="Contact">{r.contact}</InfoTile>
            <InfoTile label="Email">{r.email}</InfoTile>
            <InfoTile label="Preference">{r.orgType}</InfoTile>
            <InfoTile label="No. of Talents">{s.form === "Full Application" ? s.talents : "Not stated"}</InfoTile>
          </div>
          {s.form === "Full Application" ? <Chips label="Preferred Career Paths" items={s.careerPaths} /> : <Chips label="Area of Interest" items={[s.areaOfInterest]} />}
          <details className="group rounded-[12px] border border-[#e5e7eb]">
            <summary className="cursor-pointer px-4 py-3 text-sm font-semibold text-[#101828]">Full submission</summary>
            <div className="border-t border-[#e5e7eb] p-4">
              <SubmissionDetails s={s} />
            </div>
          </details>
          <hr className="border-[#f3f4f6]" />
          <AdminUpdates me={me} updates={updates} onAdd={onAddUpdate} onEdit={onEditUpdate} />
        </div>
      )}
    </Panel>
  );
}
