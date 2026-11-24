"use client";

import { useMemo, useState } from "react";
import { BookOpen, Calendar, CircleDot, Handshake } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/cn";
import { REQUESTS, type RequestStatus, type SponsorshipRequest } from "./data";
import { Badge, Btn, Empty, InfoTile, Input, Modal, Panel, Tag, TextArea, Toolbar, Field, card } from "./ui";
import { Chips, SubmissionDetails } from "./Submission";

const STATUS = ["All", "Pending", "Approved", "Rejected"] as const;
const FORM = ["All", "Full Application", "Quick Request"] as const;

export function RequestsTab() {
  const [requests, setRequests] = useState(REQUESTS);
  const [notes, setNotes] = useState<Record<string, string>>({ "REQ-003": "Approved — convert to sponsorship.", "REQ-004": "Approved — convert to sponsorship.", "REQ-006": "Mismatch in program availability for requested path." });
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<(typeof STATUS)[number]>("All");
  const [form, setForm] = useState<(typeof FORM)[number]>("All");
  const [openId, setOpenId] = useState<string | null>(null);
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
      {open && <RequestPanel r={open} note={notes[open.id]} onClose={() => setOpenId(null)} onDecide={decide} />}
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

function RequestPanel({ r, note, onClose, onDecide }: { r: SponsorshipRequest; note?: string; onClose: () => void; onDecide: (id: string, s: RequestStatus, note: string) => void }) {
  const [draft, setDraft] = useState("");
  const [approving, setApproving] = useState(false);
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
          pending && (
            <>
              <Btn variant="danger" onClick={() => onDecide(r.id, "Rejected", draft)}>
                Reject
              </Btn>
              <Btn onClick={() => setApproving(true)}>Approve</Btn>
            </>
          )
        }
      >
        <div className="flex flex-col gap-5">
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
          {pending ? (
            <Field label="Add Note">
              <TextArea value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Add an internal note..." />
            </Field>
          ) : (
            note && (
              <div className="rounded-[12px] border border-[#dbeafe] bg-[#eff6ff] p-4">
                <p className="text-xs font-semibold text-[#193cb8]">Internal Notes</p>
                <p className="pt-1 text-sm text-[#1447e6]">{note}</p>
              </div>
            )
          )}
        </div>
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
                onDecide(r.id, "Approved", draft);
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
