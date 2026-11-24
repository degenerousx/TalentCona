"use client";

import { useMemo, useState } from "react";
import { Eye, TriangleAlert } from "lucide-react";
import { cn } from "@/lib/cn";
import { PROGRAM_COST, TALENTS, usd, type SponsoredTalent } from "./data";
import { Badge, Bar, Empty, InfoTile, Panel, StatBox, Toolbar, card } from "./ui";

const STATUS = ["All", "Active", "Completed", "Pending"] as const;
const TYPE = ["All", "Full", "Partial"] as const;
const th = "bg-[#f9fafb]/60 px-4 py-3 text-left text-xs leading-4 font-semibold tracking-[0.6px] text-[#6a7282] uppercase";
const td = "px-4 py-3";

export function SponsoredTalentTab() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<(typeof STATUS)[number]>("All");
  const [type, setType] = useState<(typeof TYPE)[number]>("All");
  const [open, setOpen] = useState<SponsoredTalent | null>(null);

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return TALENTS.filter(
      (t) =>
        (status === "All" || t.status === status) &&
        (type === "All" || t.type === type) &&
        (!q || [t.id, t.name, t.email, t.program, t.sponsor].some((v) => v.toLowerCase().includes(q))),
    );
  }, [search, status, type]);

  return (
    <div className="flex flex-col gap-4">
      <Toolbar
        search={search}
        onSearch={setSearch}
        groups={[
          { label: "Filter by status", options: STATUS, value: status, onChange: setStatus },
          { label: "Filter by sponsorship type", options: TYPE, value: type, onChange: setType },
        ]}
      />
      {rows.length === 0 ? (
        <Empty />
      ) : (
        <div className={cn(card, "overflow-x-auto")}>
          <table className="w-full min-w-[960px] text-sm">
            <thead className="border-b border-[#f3f4f6]">
              <tr>
                {["ID", "Student", "Program", "Sponsor", "Type", "Pledged", "Received", "Status"].map((h) => (
                  <th key={h} className={th}>
                    {h}
                  </th>
                ))}
                <th className={th}>
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((t) => (
                <tr key={t.id} className="border-b border-[#f9fafb] last:border-0">
                  <td className={cn(td, "font-mono text-xs text-[#6a7282]")}>{t.id}</td>
                  <td className={td}>
                    <p className="font-medium tracking-[-0.15px] text-[#101828]">{t.name}</p>
                    <p className="text-xs leading-4 text-[#99a1af]">{t.email}</p>
                  </td>
                  <td className={cn(td, "text-[#364153]")}>{t.program}</td>
                  <td className={cn(td, "text-[#4a5565]")}>{t.sponsor}</td>
                  <td className={td}>
                    <Badge>{t.type}</Badge>
                  </td>
                  <td className={cn(td, "font-medium text-[#101828]")}>{usd(t.pledged)}</td>
                  <td className={cn(td, "font-medium text-[#008236]")}>{usd(t.received)}</td>
                  <td className={td}>
                    <Badge>{t.status}</Badge>
                  </td>
                  <td className={td}>
                    <button type="button" aria-label={`View ${t.name}`} onClick={() => setOpen(t)} className="rounded-[8px] p-1.5 text-[#6a7282] hover:bg-slate-100">
                      <Eye className="size-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {open && <TalentPanel t={open} onClose={() => setOpen(null)} />}
    </div>
  );
}

function TalentPanel({ t, onClose }: { t: SponsoredTalent; onClose: () => void }) {
  const funding = t.pledged ? Math.round((t.received / t.pledged) * 100) : 0;
  const outstanding = t.pledged - t.received;
  return (
    <Panel open onClose={onClose} eyebrow={`${t.id} · ${t.cohort}`} title={t.name} badge={<Badge>{t.status}</Badge>}>
      <div className="flex flex-col gap-6">
        <div className="grid grid-cols-3 gap-3">
          <StatBox label="Program Cost" value={usd(PROGRAM_COST[t.program] ?? t.pledged)} />
          <StatBox label="Amount Pledged" value={usd(t.pledged)} />
          <StatBox label="Amount Received" value={usd(t.received)} color="#008236" />
        </div>
        <Bar label="Funding Progress" value={funding} color="#722fff" />
        <Bar label="Learning Progress" value={t.progress} color="#0091ea" />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <InfoTile label="Program">{t.program}</InfoTile>
          <InfoTile label="Sponsor">{t.sponsor}</InfoTile>
          <InfoTile label="Sponsorship Type">{t.type}</InfoTile>
          <InfoTile label="Sponsorship Date">{t.startDate}</InfoTile>
          <InfoTile label="Certifications">{t.certifications}</InfoTile>
          <InfoTile label="Internship">{t.internship}</InfoTile>
        </div>
        {outstanding > 0 && (
          <div role="note" className="flex items-center gap-3 rounded-[12px] border border-[#fee685] bg-[#fffbeb] p-4">
            <TriangleAlert className="size-4 shrink-0 text-[#e17100]" />
            <p className="text-sm">
              <span className="font-semibold text-[#973c00]">Outstanding Balance </span>
              <span className="text-[#bb4d00]">{usd(outstanding)} remaining to be received from sponsor.</span>
            </p>
          </div>
        )}
      </div>
    </Panel>
  );
}
