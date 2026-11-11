"use client";

import { useState } from "react";
import { BadgeCheck, ChevronRight, Clock3, Send, Users, Wallet } from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import { Card } from "@/components/ui/Card";
import { monthlyFrom, naira, statsFrom, type PayoutRequest } from "./data";

/** The four headline numbers, all from payout records. */
export function StatCards({ payouts, loading }: { payouts: PayoutRequest[]; loading: boolean }) {
  const s = statsFrom(payouts);
  const show = (v: string) => (loading ? "…" : v);
  const cards = [
    { key: "ambassadors", icon: Users, label: "Ambassadors with payouts", value: show(String(s.ambassadors)), note: `${s.requests} payout ${s.requests === 1 ? "request" : "requests"}`, badge: `${s.requestsThisMonth} this month` },
    { key: "paid", icon: BadgeCheck, label: "Paid out", value: show(naira(s.paidOut)), note: `${s.paidCount} disbursed`, badge: null },
    { key: "review", icon: Clock3, label: "Awaiting review", value: show(naira(s.awaitingReview)), note: `${s.awaitingReviewCount} pending`, badge: null },
    { key: "transfer", icon: Send, label: "Approved, not yet sent", value: show(naira(s.awaitingTransfer)), note: `${s.awaitingTransferCount} awaiting transfer`, badge: null },
  ];
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((c) => (
        <Card key={c.key} tone="hairline" className="flex flex-col gap-3 p-4">
          <div className="flex items-start justify-between">
            <span aria-hidden="true" className="grid size-8 place-items-center rounded-lg bg-primary-soft text-primary">
              <c.icon className="size-4" strokeWidth={1.75} />
            </span>
            {c.badge && !loading && (
              <span className="rounded-full bg-success-soft px-2 py-0.5 text-[11px] leading-4 font-medium text-green-700">{c.badge}</span>
            )}
          </div>
          <div className="flex flex-col gap-0.5">
            <p className="text-sm leading-5 text-slate-600">{c.label}</p>
            <p className="text-2xl leading-8 font-semibold text-slate-900">{c.value}</p>
            <p className="text-xs leading-4 text-slate-500">{loading ? "\u00a0" : c.note}</p>
          </div>
        </Card>
      ))}
    </div>
  );
}

const ranges = [
  { months: 3, label: "Last 3 months" },
  { months: 6, label: "Last 6 months" },
  { months: 12, label: "Last 12 months" },
];

/** Payouts requested vs paid out per month, from payout records. */
export function CommissionChart({ payouts }: { payouts: PayoutRequest[] }) {
  const [months, setMonths] = useState(6);
  const data = monthlyFrom(payouts, months);
  const empty = data.every((d) => d.requested === 0 && d.paid === 0);
  return (
    <Card tone="hairline" className="flex flex-col gap-4 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <h2 className="text-base leading-6 font-semibold text-slate-900">Payout overview</h2>
          <p className="text-xs leading-4 text-slate-500">Requested vs paid out over the last {months} months</p>
        </div>
        <select
          aria-label="Chart period"
          value={months}
          onChange={(e) => setMonths(Number(e.target.value))}
          className="h-9 rounded-lg border border-gray-200 bg-white px-3 text-sm font-medium text-slate-900 focus:border-accent focus:outline-none"
        >
          {ranges.map((r) => (
            <option key={r.months} value={r.months}>
              {r.label}
            </option>
          ))}
        </select>
      </div>
      <div className="relative h-44" role="img" aria-label={`Payouts requested and paid out, last ${months} months`}>
        {empty && <p className="absolute inset-0 grid place-items-center text-sm text-slate-500">No payouts in this period</p>}
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} barGap={4} barCategoryGap="32%" margin={{ top: 4, right: 4, bottom: 0, left: 4 }}>
            <CartesianGrid vertical={false} stroke="#f1f5f9" />
            <XAxis dataKey="month" tickLine={false} axisLine={{ stroke: "#e2e8f0" }} tick={{ fontSize: 12, fill: "#64748b" }} />
            <Tooltip
              cursor={{ fill: "#f8fafc" }}
              formatter={(value, name) => [naira(Number(value)), name === "requested" ? "Requested" : "Paid out"]}
              contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12 }}
            />
            <Bar dataKey="requested" fill="#c9bdf7" radius={[4, 4, 0, 0]} maxBarSize={16} />
            <Bar dataKey="paid" fill="#302a91" radius={[4, 4, 0, 0]} maxBarSize={16} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <ul className="flex gap-5 text-xs leading-4 text-slate-600">
        <li className="flex items-center gap-1.5">
          <span aria-hidden="true" className="size-2 rounded-full bg-[#c9bdf7]" />
          Requested
        </li>
        <li className="flex items-center gap-1.5">
          <span aria-hidden="true" className="size-2 rounded-full bg-primary" />
          Paid out
        </li>
      </ul>
    </Card>
  );
}

/** Live pending payouts (from the withdrawals API) with a shortcut to review them. */
export function PendingPayoutCard({
  count,
  total,
  loading,
  onReview,
}: {
  /** e.g. "3", or "20+" when there are more pages. */
  count: string;
  total: number;
  loading: boolean;
  onReview: () => void;
}) {
  const now = new Date();
  const cycle = new Date(now.getFullYear(), now.getMonth() + 1, 0).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  return (
    <section aria-label="Pending payouts" className="flex flex-col justify-between gap-5 rounded-lg bg-primary p-5 text-white shadow-sm">
      <div className="flex items-start justify-between">
        <span aria-hidden="true" className="grid size-9 place-items-center rounded-lg bg-white/15">
          <Wallet className="size-4" strokeWidth={1.75} />
        </span>
        <span className="rounded-full bg-white px-2.5 py-0.5 text-[11px] leading-4 font-semibold tracking-wide text-primary uppercase">
          {loading ? "…" : `${count} pending`}
        </span>
      </div>
      <div className="flex flex-col gap-1">
        <p className="text-xs leading-4 text-white/75">Pending payout value</p>
        <p className="text-3xl leading-9 font-bold">
          {loading ? "…" : naira(total)}
          {!loading && count.endsWith("+") && <span className="ml-1 text-base font-medium text-white/75">and more</span>}
        </p>
      </div>
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between border-t border-white/20 pt-4 text-xs leading-4">
          <span className="text-white/75">Next payout cycle</span>
          <span className="font-semibold">{cycle}</span>
        </div>
        <button
          type="button"
          onClick={onReview}
          className="flex h-10 items-center justify-center gap-1 rounded-lg bg-white text-sm font-semibold text-primary transition-colors hover:bg-white/90"
        >
          Review payout requests
          <ChevronRight aria-hidden className="size-4" />
        </button>
      </div>
    </section>
  );
}
