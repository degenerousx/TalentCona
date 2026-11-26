"use client";

import { useMemo, useState } from "react";
import { Building2, Calendar, Globe, Heart, Mail, Pencil, Phone, Plus, User } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/cn";
import { useCurrentAdmin } from "@/lib/currentAdmin";
import { SPONSORS, SPONSOR_UPDATES, usd, type AdminUpdate, type Sponsor } from "./data";
import { Badge, Btn, Empty, InfoTile, Panel, PathChip, StatBox, Tag, Toolbar, card } from "./ui";
import { SubmissionDetails } from "./Submission";
import { AdminUpdates, LastWorked, lastActivity, nowIso } from "./AdminUpdates";
import { EMPTY_SPONSOR, SponsorForm, changedSponsorFields, fromDraft, toDraft } from "./SponsorForm";

let seq = 500;

const TYPE = ["All", "Corporate", "Individual"] as const;

export function SponsorsTab() {
  const [sponsors, setSponsors] = useState<Sponsor[]>(SPONSORS);
  const [updates, setUpdates] = useState<Record<string, AdminUpdate[]>>(SPONSOR_UPDATES);
  const [search, setSearch] = useState("");
  const [type, setType] = useState<(typeof TYPE)[number]>("All");
  const [openId, setOpenId] = useState<string | null>(null);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const open = sponsors.find((s) => s.id === openId) ?? null;
  const company = sponsors.find((s) => s.id === companyId) ?? null;
  const admin = useCurrentAdmin();
  const me = admin.name ?? admin.email ?? "You";

  const log = (id: string, entry: Omit<AdminUpdate, "id" | "at" | "author">) =>
    setUpdates((u) => ({ ...u, [id]: [...(u[id] ?? []), { id: `su-${++seq}`, at: nowIso(), author: me, ...entry }] }));
  const namesExcept = (id?: string) => sponsors.filter((s) => s.id !== id).map((s) => s.name.toLowerCase());

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return sponsors.filter((s) => (type === "All" || s.orgType === type) && (!q || [s.id, s.name, s.contact, s.email, s.country].some((v) => v.toLowerCase().includes(q))));
  }, [sponsors, search, type]);

  return (
    <div className="flex flex-col gap-4">
      <Toolbar search={search} onSearch={setSearch} groups={[{ label: "Filter by sponsor type", options: TYPE, value: type, onChange: setType }]} />
      <Btn className="flex items-center gap-2 self-end px-4 py-2.5" onClick={() => setAdding(true)}>
        <Plus className="size-4" /> Add Sponsor
      </Btn>
      {rows.length === 0 ? (
        <Empty />
      ) : (
        <ul className="flex flex-col gap-3">
          {rows.map((s) => (
            <li key={s.id}>
              <SponsorCard s={s} last={lastActivity(updates[s.id])} onOpen={() => setOpenId(s.id)} onCompany={() => setCompanyId(s.id)} />
            </li>
          ))}
        </ul>
      )}
      {adding && (
        <Panel open onClose={() => setAdding(false)} lead={<SponsorAvatar />} eyebrow="New sponsor" title="Add Sponsor">
          <p className="mb-5 text-xs text-[#6a7282]">Fields marked * are required.</p>
          <SponsorForm
            initial={EMPTY_SPONSOR}
            takenNames={namesExcept()}
            submitLabel="Add Sponsor"
            onCancel={() => setAdding(false)}
            onSave={(d) => {
              const next = Math.max(0, ...sponsors.map((s) => Number(s.id.slice(4)) || 0)) + 1;
              const id = `SPO-${String(next).padStart(3, "0")}`;
              setSponsors((ss) => [fromDraft(d, id), ...ss]);
              log(id, { kind: "edit", text: "Added the sponsor." });
              setAdding(false);
              setOpenId(id);
              toast.success(`${d.name.trim()} added (design preview: nothing is stored)`);
            }}
          />
        </Panel>
      )}
      {open && (
        <SponsorPanel
          s={open}
          me={me}
          updates={updates[open.id] ?? []}
          takenNames={namesExcept(open.id)}
          onClose={() => setOpenId(null)}
          onSave={(d) => {
            const changed = changedSponsorFields(toDraft(open), d);
            if (!changed.length) return toast("No changes to save");
            setSponsors((ss) => ss.map((s) => (s.id === open.id ? fromDraft(d, open.id, open) : s)));
            log(open.id, { kind: "edit", text: `Updated ${changed.join(", ")}.` });
            toast.success("Saved (design preview: nothing is stored)");
          }}
          onAddUpdate={(text) => {
            log(open.id, { kind: "update", text });
            toast.success("Update saved");
          }}
          onEditUpdate={(uid, text) => {
            setUpdates((u) => ({ ...u, [open.id]: (u[open.id] ?? []).map((x) => (x.id === uid ? { ...x, text, editedAt: nowIso() } : x)) }));
            toast.success("Update saved");
          }}
        />
      )}
      {company && (
        <Panel open onClose={() => setCompanyId(null)} eyebrow={`${company.id} · Company Info`} title={company.name} lead={<SponsorAvatar />} badge={<Badge>{company.status}</Badge>}>
          <SubmissionDetails s={company.application} />
        </Panel>
      )}
    </div>
  );
}

function SponsorCard({ s, last, onOpen, onCompany }: { s: Sponsor; last: ReturnType<typeof lastActivity>; onOpen: () => void; onCompany: () => void }) {
  return (
    <article className={cn(card, "relative p-5 transition-colors hover:border-[#d1d5dc]")}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs text-[#99a1af]">{s.id}</span>
            <Badge>{s.status}</Badge>
            <Tag>{s.orgType}</Tag>
            <Badge tone={s.type}>{s.type}</Badge>
          </div>
          <h3 className="pt-1 text-base leading-6 font-bold tracking-[-0.31px] text-[#101828]">
            {/* The whole card opens the sponsor; this button is its accessible name. */}
            <button type="button" onClick={onOpen} className="text-left after:absolute after:inset-0 after:content-[''] focus-visible:outline-none">
              {s.name}
            </button>
          </h3>
          <p className="pt-0.5 text-xs leading-4 text-[#6a7282]">
            {s.contact} · {s.email} · {s.country}
          </p>
          <p className="text-xs leading-4 text-[#6a7282]">
            {s.start} → {s.end}
          </p>
        </div>
        <button type="button" onClick={onCompany} className="relative z-10 text-sm leading-5 font-semibold text-primary underline-offset-4 hover:underline">
          View Company Info
        </button>
      </div>
      <dl className="grid grid-cols-2 gap-3 pt-4 sm:grid-cols-3 lg:grid-cols-5">
        {[
          ["Talents", String(s.talents), "#101828"],
          ["Pledged", usd(s.pledged), "#101828"],
          ["Received", usd(s.received), "#008236"],
          ["Outstanding", usd(s.pledged - s.received), "#bb4d00"],
          ["Active Sponsorships", String(s.activeSponsorships), "#101828"],
        ].map(([k, v, c]) => (
          <div key={k} className="rounded-[8px] bg-[#f9fafb] p-2.5">
            <dt className="text-xs leading-4 text-[#99a1af]">{k}</dt>
            <dd className="pt-0.5 text-sm leading-5 font-bold" style={{ color: c }}>
              {v}
            </dd>
          </div>
        ))}
      </dl>
      <div className="flex flex-wrap items-center justify-between gap-3 pt-3">
        <div className="flex flex-wrap gap-1.5">
          {s.careerPaths.map((p) => (
            <PathChip key={p}>{p}</PathChip>
          ))}
        </div>
        <LastWorked last={last} />
      </div>
    </article>
  );
}

const SponsorAvatar = () => (
  <span className="flex size-10 shrink-0 items-center justify-center rounded-[12px] bg-[#722fff] text-white">
    <Building2 className="size-[18px]" />
  </span>
);
const ic = "size-[11px]";

function SponsorPanel({
  s,
  me,
  updates,
  takenNames,
  onClose,
  onSave,
  onAddUpdate,
  onEditUpdate,
}: {
  s: Sponsor;
  me: string;
  updates: AdminUpdate[];
  takenNames: string[];
  onClose: () => void;
  onSave: (d: ReturnType<typeof toDraft>) => void;
  onAddUpdate: (text: string) => void;
  onEditUpdate: (id: string, text: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  return (
    <Panel open onClose={onClose} lead={<SponsorAvatar />} eyebrow={`${s.orgType} · ${s.id}`} title={s.name} badge={<Badge>{s.status}</Badge>}>
      <div className="mb-5">
        <LastWorked last={lastActivity(updates)} />
      </div>
      {editing ? (
        <div className="flex flex-col gap-4">
          <h3 className="text-base font-bold text-[#101828]">Edit Information</h3>
          <SponsorForm
            initial={toDraft(s)}
            takenNames={takenNames}
            submitLabel="Save"
            onCancel={() => setEditing(false)}
            onSave={(d) => {
              onSave(d);
              setEditing(false);
            }}
          />
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-sm font-semibold text-[#101828]">Sponsor Details</h3>
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="flex items-center gap-1.5 rounded-[8px] border border-[#e5e7eb] px-3 py-1.5 text-xs font-medium text-[#4a5565] hover:border-primary hover:text-primary"
            >
              <Pencil className="size-3.5" /> Edit Information
            </button>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <InfoTile label="Contact" icon={<User className={ic} />}>{s.contact}</InfoTile>
            <InfoTile label="Email" icon={<Mail className={ic} />}>{s.email}</InfoTile>
            <InfoTile label="Phone" icon={<Phone className={ic} />}>{s.application.phone}</InfoTile>
            <InfoTile label="Country" icon={<Globe className={ic} />}>{s.country}</InfoTile>
            <InfoTile label="Sponsor Since" icon={<Calendar className={ic} />}>{s.start}</InfoTile>
            <InfoTile label="Active Sponsorships" icon={<Heart className={ic} />}>{s.activeSponsorships}</InfoTile>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <StatBox big label="Pledged" value={usd(s.pledged)} color="#722fff" />
            <StatBox big label="Received" value={usd(s.received)} color="#008236" />
            <StatBox big label="Outstanding" value={usd(s.pledged - s.received)} color="#bb4d00" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-[#101828]">Sponsorship Arrangements</h3>
            <div className="mt-3 flex items-center justify-between rounded-[12px] border border-[#e5e7eb] p-3">
              <p className="text-xs text-[#99a1af]">
                {s.talents} {s.talents === 1 ? "talent" : "talents"} · {s.start} → {s.end}
              </p>
              <Badge>{s.status}</Badge>
            </div>
          </div>
          <hr className="border-[#f3f4f6]" />
          <AdminUpdates me={me} updates={updates} onAdd={onAddUpdate} onEdit={onEditUpdate} />
        </div>
      )}
    </Panel>
  );
}
