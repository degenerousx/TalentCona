"use client";

import { ArrowUpRight, Award, Banknote, CircleCheck, Clock, DollarSign, Target, Timer, Users } from "lucide-react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { cn } from "@/lib/cn";
import { BY_CAREER_PATH, CONTRIBUTIONS, PAYMENTS, REQUESTS, REQUEST_UPDATES, SPONSORS, STATUS_SPLIT, usd, usdK, type SponsoredTalent } from "./data";
import { card } from "./ui";
import type { CsrTab } from "./CsrView";

const pledged = SPONSORS.reduce((t, s) => t + s.pledged, 0);
const received = PAYMENTS.filter((p) => p.status === "Confirmed").reduce((t, p) => t + p.amount, 0);

const h2 = "text-sm leading-5 font-bold tracking-[-0.15px] text-[#101828]";
const link = "flex items-center gap-1 text-xs leading-4 font-medium text-primary hover:underline";
const axis = { fontSize: 11, fill: "#6a7282" };

/** Key figures, counted from the live student list so added students are included. */
const kpis = (talents: SponsoredTalent[]) => {
  const count = (f: (t: SponsoredTalent) => boolean) => talents.filter(f).length;
  return [
    { label: "Total Sponsored", value: String(talents.length), note: "all statuses", icon: Users, tint: "rgba(114,47,255,0.09)", color: "#722fff" },
    { label: "Fully Sponsored", value: String(count((t) => t.type === "Full")), icon: CircleCheck, tint: "rgba(0,200,83,0.09)", color: "#00c853" },
    { label: "Partially Sponsored", value: String(count((t) => t.type === "Partial")), icon: Target, tint: "rgba(255,143,0,0.09)", color: "#ff8f00" },
    { label: "Total Funds Pledged", value: usdK(pledged), note: "across all sponsors", icon: DollarSign, tint: "rgba(0,145,234,0.09)", color: "#0091ea" },
    { label: "Funds Received", value: usdK(received), note: "verified only", icon: Banknote, tint: "rgba(0,200,83,0.09)", color: "#00c853" },
    { label: "Pending", value: String(count((t) => t.status === "Pending")), note: "awaiting activation", icon: Clock, tint: "rgba(255,107,53,0.09)", color: "#ff6b35" },
    { label: "Ongoing", value: String(count((t) => t.status === "Active")), note: "Students in programs", icon: Timer, tint: "rgba(255,107,53,0.09)", color: "#ff6b35" },
    { label: "Completed", value: String(count((t) => t.status === "Completed")), note: "graduated & funded", icon: Award, tint: "rgba(114,47,255,0.09)", color: "#722fff" },
  ];
};

export function Overview({ onOpen, talents }: { onOpen: (tab: CsrTab) => void; talents: SponsoredTalent[] }) {
  const KPIS = kpis(talents);
  const top = [...SPONSORS].sort((a, b) => b.pledged - a.pledged).slice(0, 4);
  const recent = PAYMENTS.filter((p) => p.status === "Confirmed").slice(0, 4);
  const pendingPayments = PAYMENTS.filter((p) => p.status === "Pending").length;
  const pendingRequests = REQUESTS.filter((r) => !REQUEST_UPDATES[r.id]?.length).length;

  return (
    <div className="flex flex-col gap-6">
      <section aria-label="Key figures" className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {KPIS.map((k) => (
          <article key={k.label} className={cn(card, "flex flex-col p-5")}>
            <div className="flex items-start justify-between">
              <p className="text-xs leading-[15px] font-medium text-[#6a7282]">{k.label}</p>
              <span className="flex size-9 items-center justify-center rounded-[8px]" style={{ background: k.tint, color: k.color }}>
                <k.icon className="size-[18px]" />
              </span>
            </div>
            <p className="pt-3 text-2xl leading-8 font-bold text-[#101828]">{k.value}</p>
            <p className="min-h-5 pt-1 text-xs leading-4 text-[#6a7282]">{k.note ?? ""}</p>
          </article>
        ))}
      </section>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <section className={cn(card, "p-5 xl:col-span-2")}>
          <h2 className={h2}>Sponsorship Contributions Over Time</h2>
          <div className="mt-4 h-[240px]">
            <ResponsiveContainer>
              <AreaChart data={CONTRIBUTIONS} margin={{ left: -8, right: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="month" tick={axis} />
                <YAxis tick={axis} tickFormatter={(v: number) => usdK(v)} domain={[0, 100000]} ticks={[0, 25000, 50000, 75000, 100000]} />
                <Tooltip formatter={(v) => usd(Number(v))} />
                <Legend iconType="plainline" />
                <Area type="monotone" dataKey="pledged" name="Pledged" stroke="#302a91" strokeWidth={2} fill="#722fff" fillOpacity={0.08} />
                <Area type="monotone" dataKey="received" name="Received" stroke="#00c853" strokeWidth={2} fill="#0091ea" fillOpacity={0.06} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>
        <section className={cn(card, "p-5")}>
          <h2 className={h2}>Sponsorship Status</h2>
          <div className="mt-2 h-[170px]">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={STATUS_SPLIT} dataKey="value" nameKey="name" innerRadius={48} outerRadius={70} paddingAngle={2} stroke="none">
                  {STATUS_SPLIT.map((s) => (
                    <Cell key={s.name} fill={s.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => `${v}%`} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <ul className="mt-3 flex flex-col gap-2">
            {STATUS_SPLIT.map((s) => (
              <li key={s.name} className="flex items-center gap-2 text-xs text-[#4a5565]">
                <span className="size-2.5 rounded-full" style={{ background: s.color }} />
                {s.name}
              </li>
            ))}
          </ul>
        </section>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <section className={cn(card, "p-5")}>
          <h2 className={h2}>Talents by Career Path</h2>
          <div className="mt-4 h-[190px]">
            <ResponsiveContainer>
              <BarChart data={BY_CAREER_PATH} layout="vertical" margin={{ left: 8, right: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" horizontal={false} />
                <XAxis type="number" tick={axis} domain={[0, 40]} ticks={[0, 10, 20, 30, 40]} />
                <YAxis type="category" dataKey="path" tick={axis} width={92} />
                <Tooltip />
                <Bar dataKey="talents" name="Talents" fill="#302a91" radius={[0, 4, 4, 0]} barSize={18} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
        <section className={cn(card, "p-5")}>
          <div className="flex items-center justify-between">
            <h2 className={h2}>Top Sponsors</h2>
            <button type="button" className={link} onClick={() => onOpen("sponsors")}>
              View all <ArrowUpRight className="size-3" />
            </button>
          </div>
          <ol className="mt-4 flex flex-col gap-4">
            {top.map((s, i) => (
              <li key={s.id} className="flex items-center gap-3">
                <span className="flex size-6 items-center justify-center rounded-full bg-[#f3f4f6] text-xs font-medium text-[#6a7282]">{i + 1}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm leading-[17.5px] font-medium tracking-[-0.15px] text-[#101828]">{s.name}</p>
                  <p className="text-xs leading-4 text-[#99a1af]">
                    {s.talents} {s.talents === 1 ? "talent" : "talents"}
                  </p>
                </div>
                <p className="text-sm leading-5 font-bold text-primary">{usd(s.pledged)}</p>
              </li>
            ))}
          </ol>
        </section>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <section className={cn(card, "p-5")}>
          <div className="flex items-center justify-between">
            <h2 className={h2}>Recent Sponsorship Activity</h2>
            <button type="button" className={link} onClick={() => onOpen("payments")}>
              View payments <ArrowUpRight className="size-3" />
            </button>
          </div>
          <ul className="mt-4 divide-y divide-[#f3f4f6]">
            {recent.map((p) => (
              <li key={p.reference} className="flex items-center gap-3 py-3.5">
                <span className="flex size-8 items-center justify-center rounded-full bg-[#f0fdf4] text-[#00c853]">
                  <CircleCheck className="size-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm leading-5 font-medium text-[#101828]">{p.sponsor}</p>
                  <p className="text-xs leading-4 text-[#99a1af]">
                    {p.reference} · {p.date}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <p className="text-sm leading-5 font-bold text-[#101828]">{usd(p.amount)}</p>
                  <span className="rounded-full border border-[#b9f8cf] bg-[#f0fdf4] px-2.5 py-0.5 text-xs leading-4 font-medium text-[#008236]">{p.status}</span>
                </div>
              </li>
            ))}
          </ul>
        </section>
        <section className={cn(card, "self-start p-5")}>
          <h2 className={h2}>Pending Actions</h2>
          <ul className="mt-4 flex flex-col gap-3">
            {[
              { label: "Payment pending verification", n: pendingPayments, tab: "payments" as const },
              { label: "Sponsorship requests not worked on yet", n: pendingRequests, tab: "requests" as const },
            ].map((a) => (
              <li key={a.label}>
                <button type="button" onClick={() => onOpen(a.tab)} className="flex w-full items-center justify-between rounded-[12px] border border-[#fee685] bg-[#fffbeb] px-3 py-3.5 text-left text-xs text-[#973c00] hover:bg-[#fef3c7]">
                  {a.label}
                  <span className="flex size-5 items-center justify-center rounded-full bg-[#fee685] text-xs font-semibold text-[#973c00]">{a.n}</span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
