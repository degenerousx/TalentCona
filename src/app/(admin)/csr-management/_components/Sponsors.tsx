"use client";

import { useMemo, useState } from "react";
import { Building2, Calendar, Globe, Heart, Mail, Phone, User } from "lucide-react";
import { cn } from "@/lib/cn";
import { SPONSORS, usd, type Sponsor } from "./data";
import { Badge, Empty, InfoTile, Panel, PathChip, StatBox, Tag, Toolbar, card } from "./ui";
import { SubmissionDetails } from "./Submission";

const TYPE = ["All", "Corporate", "Individual"] as const;

export function SponsorsTab() {
  const [search, setSearch] = useState("");
  const [type, setType] = useState<(typeof TYPE)[number]>("All");
  const [open, setOpen] = useState<Sponsor | null>(null);
  const [company, setCompany] = useState<Sponsor | null>(null);

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return SPONSORS.filter((s) => (type === "All" || s.orgType === type) && (!q || [s.id, s.name, s.contact, s.email, s.country].some((v) => v.toLowerCase().includes(q))));
  }, [search, type]);

  return (
    <div className="flex flex-col gap-4">
      <Toolbar search={search} onSearch={setSearch} groups={[{ label: "Filter by sponsor type", options: TYPE, value: type, onChange: setType }]} />
      {rows.length === 0 ? (
        <Empty />
      ) : (
        <ul className="flex flex-col gap-3">
          {rows.map((s) => (
            <li key={s.id}>
              <SponsorCard s={s} onOpen={() => setOpen(s)} onCompany={() => setCompany(s)} />
            </li>
          ))}
        </ul>
      )}
      {open && <SponsorPanel s={open} onClose={() => setOpen(null)} />}
      {company && (
        <Panel open onClose={() => setCompany(null)} eyebrow={`${company.id} · ${company.application.form}`} title={company.name} lead={<SponsorAvatar />} badge={<Badge>{company.status}</Badge>}>
          <SubmissionDetails s={company.application} />
        </Panel>
      )}
    </div>
  );
}

function SponsorCard({ s, onOpen, onCompany }: { s: Sponsor; onOpen: () => void; onCompany: () => void }) {
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
      <div className="flex flex-wrap gap-1.5 pt-3">
        {s.careerPaths.map((p) => (
          <PathChip key={p}>{p}</PathChip>
        ))}
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

function SponsorPanel({ s, onClose }: { s: Sponsor; onClose: () => void }) {
  return (
    <Panel open onClose={onClose} lead={<SponsorAvatar />} eyebrow={`${s.orgType} · ${s.id}`} title={s.name} badge={<Badge>{s.status}</Badge>}>
      <div className="flex flex-col gap-5">
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
      </div>
    </Panel>
  );
}
