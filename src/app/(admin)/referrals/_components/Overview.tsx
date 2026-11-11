"use client";

import { useState } from "react";
import { ChartNoAxesColumnIncreasing, ChevronRight, CreditCard, GraduationCap, TrendingUp, Users, Wallet } from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import { Card } from "@/components/ui/Card";
import { naira, sampleCommission, sampleStats } from "./data";

const statIcons = {
  ambassadors: Users,
  students: GraduationCap,
  revenue: ChartNoAxesColumnIncreasing,
  commission: CreditCard,
} as const;

/** The four headline numbers (sample data until the backend has an endpoint). */
export function StatCards() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {sampleStats.map((s) => {
        const Icon = statIcons[s.key];
        return (
          <Card key={s.key} tone="hairline" className="flex flex-col gap-3 p-4">
            <div className="flex items-start justify-between">
              <span aria-hidden="true" className="grid size-8 place-items-center rounded-lg bg-primary-soft text-primary">
                <Icon className="size-4" strokeWidth={1.75} />
              </span>
              <span className="inline-flex items-center gap-0.5 rounded-full bg-success-soft px-2 py-0.5 text-[11px] leading-4 font-medium text-green-700">
                <TrendingUp aria-hidden className="size-3" />
                {s.trend}
              </span>
            </div>
            <div className="flex flex-col gap-0.5">
              <p className="text-sm leading-5 text-slate-600">{s.label}</p>
              <p className="text-2xl leading-8 font-semibold text-slate-900">{s.value}</p>
              <p className="text-xs leading-4 text-slate-500">{s.note}</p>
            </div>
          </Card>
        );
      })}
    </div>
  );
}

const ranges = [
  { months: 3, label: "Last 3 months" },
  { months: 6, label: "Last 6 months" },
  { months: 12, label: "Last 12 months" },
];

/** Earned vs paid out per month (sample data). */
export function CommissionChart() {
  const [months, setMonths] = useState(6);
  const data = sampleCommission.slice(-months);
  return (
    <Card tone="hairline" className="flex flex-col gap-4 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <h2 className="text-base leading-6 font-semibold text-slate-900">Commission overview</h2>
          <p className="text-xs leading-4 text-slate-500">Earned vs paid out over the last {months} months</p>
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
      <div className="h-44" role="img" aria-label={`Commission earned and paid out, last ${months} months`}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} barGap={4} barCategoryGap="32%" margin={{ top: 4, right: 4, bottom: 0, left: 4 }}>
            <CartesianGrid vertical={false} stroke="#f1f5f9" />
            <XAxis dataKey="month" tickLine={false} axisLine={{ stroke: "#e2e8f0" }} tick={{ fontSize: 12, fill: "#64748b" }} />
            <Tooltip
              cursor={{ fill: "#f8fafc" }}
              formatter={(value, name) => [naira(Number(value)), name === "earned" ? "Earned" : "Paid out"]}
              contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12 }}
            />
            <Bar dataKey="earned" fill="#c9bdf7" radius={[4, 4, 0, 0]} maxBarSize={16} />
            <Bar dataKey="paid" fill="#302a91" radius={[4, 4, 0, 0]} maxBarSize={16} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <ul className="flex gap-5 text-xs leading-4 text-slate-600">
        <li className="flex items-center gap-1.5">
          <span aria-hidden="true" className="size-2 rounded-full bg-[#c9bdf7]" />
          Earned
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
