"use client";

import { useMemo, useState } from "react";
import { BookOpen, Calendar, CircleDot, Handshake, Pencil } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/cn";
import { useCurrentAdmin } from "@/lib/currentAdmin";
import { REQUESTS, REQUEST_UPDATES, type AdminUpdate, type RequestStatus, type Submission, type SponsorshipRequest } from "./data";
import { Badge, Btn, Empty, InfoTile, Input, Modal, Panel, Tag, Toolbar, Field, card } from "./ui";
import { Chips, SubmissionDetails } from "./Submission";
import { RequestEditor } from "./RequestEditor";
import { AdminUpdates } from "./AdminUpdates";

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

const STATUS = ["All", "Pending", "Approved", "Rejected"] as const;
const FORM = ["All", "Full Application", "Quick Request"] as const;

export function RequestsTab() {
  const [requests, setRequests] = useState(REQUESTS);
  const [notes, setNotes] = useState<Record<string, string>>({ "REQ-003": "Approved — convert to sponsorship.", "REQ-004": "Approved — convert to sponsorship.", "REQ-006": "Mismatch in program availability for requested path." });
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<(typeof STATUS)[number]>("All");
  const [form, setForm] = useState<(typeof FORM)[number]>("All");
  const [openId, setOpenId] = useState<string | null>(null);
  const [updates, setUpdates] = useState<Record<string, AdminUpdate[]>>(REQUEST_UPDATES);
  const admin = useCurrentAdmin();
  const me = admin.name ?? admin.email ?? "You";
  const log = (id: string, entry: Omit<AdminUpdate, "id" | "at" | "author">) =>
    setUpdates((u) => ({ ...u, [id]: [...(u[id] ?? []), { id: `u-${++seq}`, at: now(), author: me, ...entry }] }));
  const open = requests.find((r) => r.id === openId) ?? null;

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return requests.filter(
      (r) =>
        (status === "All" || r.status === status) &&
        (form === "All" || (form === "Quick Request") === (r.submission.form === "Quick Sponsor Request")) &&
        (!q || [r.id, r.name, r.contact, r.email].some((v) => v.toLowerCase().includes(q))),
    );
  }, [requests, search, status, form]);

  const decide = (id: string, next: RequestStatus, note: string) => {
    setRequests((rs) => rs.map((r) => (r.id === id ? { ...r, status: next } : r)));
    setNotes((n) => ({ ...n, [id]: note || (next === "Approved" ? "Approved — convert to sponsorship." : "Rejected.") }));
    log(id, { kind: "decision", text: `${next === "Approved" ? "Approved" : "Rejected"} the request.` });
    toast.success(`${id} ${next.toLowerCase()} (design preview: nothing was saved)`);
  };

  return (
    <div className="flex flex-col gap-6">
      <Toolbar
        search={search}
        onSearch={setSearch}
        groups={[
          { label: "Filter by status", options: STATUS, value: status, onChange: setStatus },
          { label: "Filter by form", options: FORM, value: form, onChange: setForm },
        ]}
      />
      {rows.length === 0 ? (
        <Empty />
      ) : (
        <ul className="flex flex-col gap-3">
          {rows.map((r) => (
            <li key={r.id}>
              <RequestCard r={r} onOpen={() => setOpenId(r.id)} />
            </li>
          ))}
        </ul>
      )}
      {open && (
        <RequestPanel
          r={open}
          note={notes[open.id]}
          me={me}
          updates={updates[open.id] ?? []}
          onClose={() => setOpenId(null)}
          onDecide={decide}
          onSaveDetails={(next) => {
            const changed = changedFields(open.submission, next);
            setRequests((rs) =>
              rs.map((r) =>
                r.id === open.id ? { ...r, submission: next, email: next.email, contact: next.form === "Full Application" ? next.contactPerson : r.contact } : r,
              ),
            );
            if (changed.length) log(open.id, { kind: "edit", text: `Updated ${changed.join(", ")}.` });
            toast.success(changed.length ? "Request details updated (design preview: nothing was saved)" : "No changes to save");
          }}
          onAddUpdate={(text) => {
            log(open.id, { kind: "update", text });
            toast.success("Update posted");
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

function RequestCard({ r, onOpen }: { r: SponsorshipRequest; onOpen: () => void }) {
  const s = r.submission;
  const full = s.form === "Full Application";
  return (
    <button type="button" onClick={onOpen} className={cn(card, "w-full p-5 text-left transition-colors hover:border-[#d1d5dc]")}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs text-[#99a1af]">{r.id}</span>
            <Badge>{r.status}</Badge>
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
      <div className="flex flex-wrap items-center gap-4 pt-3">
        <span className={meta}>
          <CircleDot className="size-[11px]" /> {r.orgType}
        </span>
        <span className={meta}>
          {full ? <BookOpen className="size-[11px]" /> : <Handshake className="size-[11px]" />} {full ? s.careerPaths.join(", ") : s.areaOfInterest}
        </span>
        <span className={meta}>
          <Calendar className="size-[11px]" /> {s.submittedAt}
        </span>
      </div>
    </button>
  );
}

function RequestPanel({
  r,
  note,
  me,
  updates,
  onClose,
  onDecide,
  onSaveDetails,
  onAddUpdate,
  onEditUpdate,
}: {
  r: SponsorshipRequest;
  note?: string;
  me: string;
  updates: AdminUpdate[];
  onClose: () => void;
  onDecide: (id: string, s: RequestStatus, note: string) => void;
  onSaveDetails: (next: Submission) => void;
  onAddUpdate: (text: string) => void;
  onEditUpdate: (id: string, text: string) => void;
}) {
  const [approving, setApproving] = useState(false);
  const [editing, setEditing] = useState(false);
  const pending = r.status === "Pending";
  const s = r.submission;
  return (
    <>
      <Panel
        open={!approving}
        onClose={onClose}
        eyebrow={`${r.id} · Submitted ${s.submittedAt}`}
        title={r.name}
        badge={<Badge>{r.status}</Badge>}
        footer={
          pending &&
          !editing && (
            <>
              <Btn variant="danger" onClick={() => onDecide(r.id, "Rejected", "")}>
                Reject
              </Btn>
              <Btn onClick={() => setApproving(true)}>Approve</Btn>
            </>
          )
        }
      >
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
              <button type="button" onClick={() => setEditing(true)} className="flex items-center gap-1.5 rounded-[8px] border border-[#e5e7eb] px-3 py-1.5 text-xs font-medium text-[#4a5565] hover:border-primary hover:text-primary">
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
            {!pending && note && (
              <div className="rounded-[12px] border border-[#dbeafe] bg-[#eff6ff] p-4">
                <p className="text-xs font-semibold text-[#193cb8]">Internal Notes</p>
                <p className="pt-1 text-sm text-[#1447e6]">{note}</p>
              </div>
            )}
            <hr className="border-[#f3f4f6]" />
            <AdminUpdates me={me} updates={updates} onAdd={onAddUpdate} onEdit={onEditUpdate} />
          </div>
        )}
      </Panel>
      <Modal
        open={approving}
        onClose={() => setApproving(false)}
        title="Approve Sponsorship"
        footer={
          <>
            <Btn variant="outline" onClick={() => setApproving(false)}>
              Cancel
            </Btn>
            <Btn
              onClick={() => {
                onDecide(r.id, "Approved", "");
                setApproving(false);
              }}
            >
              Approve
            </Btn>
          </>
        }
      >
        <div className="flex flex-col gap-6">
          <Field label="Start Date *">
            <Input type="date" />
          </Field>
          <Field label="End Date *">
            <Input type="date" />
          </Field>
        </div>
      </Modal>
    </>
  );
}
