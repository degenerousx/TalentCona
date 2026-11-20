"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  ArrowLeft, Award, CheckCircle2, ChevronRight, CircleX, Clock3, Copy, DollarSign, Download, Eye, Link2, RefreshCcw, Search, TrendingUp, Users, WalletCards,
} from "lucide-react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { toast } from "sonner";

import { Button } from "@/components/shadcn/button";
import { Checkbox } from "@/components/shadcn/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/shadcn/dialog";
import { Input } from "@/components/shadcn/input";
import { Label } from "@/components/shadcn/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/shadcn/popover";
import { Toaster } from "@/components/shadcn/sonner";
import { describeError } from "@/components/ui/States";
import { useHashTab } from "@/lib/useHashTab";
import {
  LEDGER_STATUSES, compactMoney, day, dayTime, exportLeaderboard, exportLedger, exportReferrer, money, useLedger, useOverview, usePayoutSummary, usePrograms,
  useReferralSettings, useReferrer, useReferrerHistory, useReferrerPerformance, useResetCode, useSaveReferralSettings, useUserWithdrawals, useViralGrowth,
  useWithdrawal, useWithdrawalAction, useWithdrawalCounts, useWithdrawalQueue,
  type GrowthPoint, type LedgerEntry, type LedgerFilters, type LedgerStatus, type TopReferrer, type Withdrawal,
} from "./api";

/** Tabs, in the URL hash so a link can open one (e.g. /referrals#queue). */
const TABS = ["overview", "ledger", "queue", "settings"] as const;

const rankColors = ["bg-yellow-500", "bg-slate-400", "bg-orange-600", "bg-brand", "bg-brand"];

const errorText = (e: unknown) => (e instanceof Error ? e.message : "Something went wrong. Please try again.");
const initialsOf = (name: string) =>
  name.replace(/^Dr\.?\s+/i, "").split(/\s+/).filter(Boolean).map((n) => n[0]).join("").slice(0, 2).toUpperCase() || "?";
const masked = (account: string | null | undefined) => (account ? `****${account.replace(/\D/g, "").slice(-4) || account.slice(-4)}` : "—");
const monthShort = (period: string) => {
  const [y, m] = period.split("-").map(Number);
  return y && m ? new Date(y, m - 1, 1).toLocaleDateString("en-US", { month: "short" }) : period;
};
const growthRows = (points: GrowthPoint[] | undefined) => (points ?? []).map((p) => ({ m: monthShort(p.period), label: p.periodLabel, a: p.referredSignups, b: p.paidConversions }));

/** Loading / error / empty line, in the page's card style. */
function Notice({ children, tone = "muted" }: { children: ReactNode; tone?: "muted" | "error" }) {
  return <p role={tone === "error" ? "alert" : undefined} className={`px-6 py-10 text-center text-sm ${tone === "error" ? "text-red-600" : "text-muted-foreground"}`}>{children}</p>;
}
function QueryNotice({ query, label }: { query: { isPending: boolean; isError: boolean; error: unknown; refetch: () => unknown }; label: string }) {
  if (query.isPending) return <Notice>Loading {label}…</Notice>;
  if (!query.isError) return null;
  const { title, message } = describeError(query.error);
  return (
    <Notice tone="error">
      {title}: {message}{" "}
      <button type="button" className="font-medium text-primary underline" onClick={() => void query.refetch()}>Try again</button>
    </Notice>
  );
}

export default function ReferralsContent() {
  const [tab, setTab] = useHashTab(TABS);
  const [selected, setSelected] = useState<string | null>(null);
  const counts = useWithdrawalCounts();
  const c = counts.data;
  const queueCount = c ? c.pending + c.approved + c.disbursing + c.failed : null;
  // The layout's <main> is the scroll box; open/close the detail view at its top.
  const showReferrer = (userId: string | null) => { setSelected(userId); document.querySelector("main")?.scrollTo({ top: 0 }); };

  return (
    <div className="text-foreground">
        <div className="mx-auto max-w-[1280px]">
          {selected ? <ReferrerDetail userId={selected} onBack={() => showReferrer(null)} /> : (
            <>
              <header className="mb-8"><h1 className="text-[28px] leading-9 font-normal text-heading sm:text-[32px]">Referral &amp; Commission Engine</h1><p className="text-base text-slate-600">Manage viral growth and track referral earnings</p></header>
              <div className="mb-8 flex gap-8 overflow-x-auto border-b border-border px-6" role="tablist">
                {([["overview", "Overview Dashboard"], ["ledger", "Referral Ledger"], ["queue", "Withdrawal Queue"], ["settings", "Commission Settings"]] as const).map(([id, label]) => (
                  <Button key={id} variant="ghost" role="tab" aria-selected={tab === id} onClick={() => setTab(id)} className={`relative h-[58px] shrink-0 gap-2 rounded-none px-1.5 text-base shadow-none hover:bg-transparent ${tab === id ? "font-medium text-primary after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:bg-primary" : "font-medium text-heading"}`}>
                    {label}{id === "queue" && queueCount !== null && <span className="grid min-w-5 place-items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs font-normal text-slate-600">{queueCount}</span>}
                  </Button>
                ))}
              </div>
              {tab === "overview" && <Overview onView={showReferrer} />}
              {tab === "ledger" && <Ledger />}
              {tab === "queue" && <Queue />}
              {tab === "settings" && <Settings />}
            </>
          )}
        </div>
      <Toaster />
    </div>
  );
}

function Stat({ label, value, note, icon, noteClass = "text-muted-foreground" }: { label: string; value: string; note: string; icon: ReactNode; noteClass?: string }) {
  return <article className="relative rounded-lg border border-border bg-card p-6 shadow-card"><p className="text-sm text-muted-foreground">{label}</p><p className="mt-2 text-[28px] font-bold leading-9 text-heading">{value}</p><p className={`mt-2 text-xs ${noteClass}`}>{note}</p><span className="absolute right-6 top-6">{icon}</span></article>;
}

function Card({ title, action, children, divider = true, className = "" }: { title: ReactNode; action?: ReactNode; children: ReactNode; divider?: boolean; className?: string }) {
  return <section className={`overflow-hidden rounded-lg border border-border bg-card shadow-card ${className}`}><div className={`flex items-center justify-between px-6 ${divider ? "border-b border-border py-5" : "pt-6 pb-2"}`}><h2 className="text-xl font-semibold leading-7 text-heading">{title}</h2>{action}</div>{children}</section>;
}

/** Download a backend export, with a toast either way. */
async function download(run: () => Promise<void>, what: string) {
  try {
    await run();
    toast.success(`${what} exported`);
  } catch (e) {
    toast.error(`Couldn't export the ${what.toLowerCase()}: ${errorText(e)}`);
  }
}

function GrowthChart({ rows, lines, height = 300 }: { rows: ReturnType<typeof growthRows>; lines: { key: "a" | "b"; name: string; color: string }[]; height?: number }) {
  return (
    <div className="px-6 py-4" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={rows} margin={{ top: 8, right: 12, left: -10, bottom: 0 }}>
          <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" />
          <XAxis dataKey="m" tick={{ fontSize: 12, fill: "#64748b" }} />
          <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: "#64748b" }} />
          <Tooltip contentStyle={{ fontSize: 11, borderRadius: 6 }} labelFormatter={(_, p) => p?.[0]?.payload?.label ?? ""} />
          {lines.map((l) => <Line key={l.key} dataKey={l.key} name={l.name} type="monotone" stroke={l.color} strokeWidth={2} dot={{ r: 3, fill: "#ffffff" }} isAnimationActive={false} />)}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function Overview({ onView }: { onView: (userId: string) => void }) {
  const overview = useOverview();
  const growth = useViralGrowth();
  const queue = useWithdrawalQueue();
  const o = overview.data;
  // Requests waiting for review or transfer (amounts are minor units; NGN, kobo).
  const open = (queue.data ?? []).filter((w) => w.status === "Pending" || w.status === "Approved");
  const pendingMinor = open.reduce((t, w) => t + w.amount, 0);
  const stat = (v: string) => (overview.isPending ? "…" : overview.isError ? "—" : v);
  return (
    <div className="space-y-8">
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Viral Coefficient" value={stat(String(+(o?.viralCoefficient ?? 0).toFixed(2)))} note="Avg new users per referrer · last 90 days" icon={<TrendingUp className="size-5 text-finance-positive" />} />
        <Stat label="Conversion Value" value={stat(compactMoney(o?.conversionValueMinor, o?.currency, o?.minorUnit))} note="Revenue from referrals · last 90 days" icon={<DollarSign className="size-5 text-finance-blue" />} />
        <Stat label="Pending Payouts" value={queue.isPending ? "…" : queue.isError ? "—" : compactMoney(pendingMinor, open[0]?.currency, open[0]?.minorUnit)} note="Withdrawals awaiting review or transfer" icon={<Clock3 className="size-5 text-finance-orange" />} />
        <Stat label="Active Referrers" value={stat((o?.activeReferrers ?? 0).toLocaleString("en-NG"))} note="Users with referrals · last 90 days" icon={<Users className="size-5 text-finance-purple" />} />
      </div>
      {overview.isError && <QueryNotice query={overview} label="the overview" />}
      <Card title="Viral Growth Trend" divider={false}>
        {growth.data ? (
          <GrowthChart rows={growthRows(growth.data.points)} lines={[{ key: "a", name: "Signups", color: "#4c6fff" }, { key: "b", name: "Conversions", color: "#16a36a" }]} />
        ) : <QueryNotice query={growth} label="the growth trend" />}
      </Card>
      <Card title="Top Referrers Leaderboard" action={<Button variant="ghost" size="sm" className="text-primary" onClick={() => void download(exportLeaderboard, "Leaderboard")}><Download /> Export</Button>}>
        <div className="space-y-3 p-6">
          {!o && <QueryNotice query={overview} label="the leaderboard" />}
          {o && o.topReferrers.length === 0 && <Notice>No referrers with referrals in the last 90 days.</Notice>}
          {o?.topReferrers.map((r: TopReferrer, i) => (
            <div key={r.userId} className="flex items-center gap-4 rounded-lg bg-table-head px-4 py-4">
              <span className={`grid size-12 shrink-0 place-items-center rounded-full text-xl font-bold text-primary-foreground ${rankColors[Math.min(i, rankColors.length - 1)]}`}>{r.rank}</span>
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-2 text-lg font-semibold text-heading">{r.fullName}<TypePill type={r.userType} /></p>
                <p className="mt-0.5 text-sm text-muted-foreground">{r.referralCount} {r.referralCount === 1 ? "referral" : "referrals"} · <span className="text-finance-positive">{r.paidConversionCount} paid</span></p>
              </div>
              <div className="text-right"><p className="text-xl font-bold leading-7 text-heading">{money(r.totalEarnedMinor, r.currency, r.minorUnit)}</p><p className="text-xs text-muted-foreground">Total Earnings</p></div>
              <Button variant="ghost" size="sm" className="text-primary" onClick={() => onView(r.userId)}><Eye /> View</Button>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function TypePill({ type }: { type: string }) {
  return <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${type === "Mentor" ? "bg-role text-role-foreground" : "bg-finance-info text-finance-blue"}`}>{type}</span>;
}

function LedgerStatusPill({ status }: { status: string }) {
  const paid = status === "Paid";
  const none = /no commission/i.test(status);
  return <span className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ${paid ? "bg-finance-positive-soft text-finance-positive" : none ? "bg-slate-100 text-heading" : "bg-pending/20 text-pending-foreground"}`}>{paid ? <CheckCircle2 className="size-3" /> : none ? <CircleX className="size-3" /> : <Clock3 className="size-3" />}{status}</span>;
}

function HistoryTable({ userId }: { userId: string }) {
  const history = useReferrerHistory(userId);
  const rows = history.data?.pages.flatMap((p) => p.items) ?? [];
  const cols = ["REFEREE", "PROGRAM", "AMOUNT PAID", "COMMISSION", "STATUS", "DATE"];
  if (!history.data) return <QueryNotice query={history} label="referral history" />;
  return (
    <>
      <div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left">
        <thead className="bg-table-head"><tr>{cols.map((c) => <th key={c} className="whitespace-nowrap px-6 py-3 text-xs font-normal tracking-wide text-table-label">{c}</th>)}</tr></thead>
        <tbody>{rows.map((h) => (
          <tr key={h.id} className="border-t border-border text-sm text-heading">
            <td className="px-6 py-4"><p className="text-base font-medium">{h.referee.fullName}</p><p className="text-xs text-muted-foreground">{h.referee.truncatedUserId}</p></td>
            <td className="px-6 py-4">{h.programTitle}</td><td className="px-6 py-4 font-medium">{money(h.amountPaidMinor, h.currency, h.minorUnit)}</td>
            <td className="px-6 py-4 font-medium text-finance-positive">{money(h.commissionMinor, h.currency, h.minorUnit)}</td><td className="px-6 py-4"><LedgerStatusPill status={h.ledgerStatus} /></td><td className="px-6 py-4 whitespace-nowrap">{day(h.creditedAt)}</td>
          </tr>
        ))}
        {!rows.length && <tr><td colSpan={6} className="px-6 py-10 text-center text-muted-foreground">No referrals yet.</td></tr>}
        </tbody>
      </table></div>
      <LoadMore query={history} />
    </>
  );
}

function LoadMore({ query }: { query: { hasNextPage: boolean; isFetchingNextPage: boolean; fetchNextPage: () => unknown } }) {
  if (!query.hasNextPage) return null;
  return <div className="flex justify-center border-t border-border px-6 py-4"><Button variant="outline" className="h-10 font-normal" disabled={query.isFetchingNextPage} onClick={() => void query.fetchNextPage()}>{query.isFetchingNextPage ? "Loading…" : "Load more"}</Button></div>;
}

function useDebounced<T>(value: T, ms = 350) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

function Ledger() {
  const [search, setSearch] = useState("");
  const [programs, setPrograms] = useState<string[]>([]);
  const [statuses, setStatuses] = useState<LedgerStatus[]>([]);
  const debounced = useDebounced(search);
  const filters: LedgerFilters = useMemo(() => ({ search: debounced, programIds: programs, statuses }), [debounced, programs, statuses]);
  const ledger = useLedger(filters);
  const programList = usePrograms();
  const rows: LedgerEntry[] = ledger.data?.pages.flatMap((p) => p.items) ?? [];
  const filtering = !!(debounced.trim() || programs.length || statuses.length);
  const toggle = <T extends string>(value: T, values: T[], setValues: (next: T[]) => void) => setValues(values.includes(value) ? values.filter((v) => v !== value) : [...values, value]);
  return <section className="overflow-hidden rounded-lg border border-border bg-card shadow-card">
    <div className="flex flex-wrap items-center gap-3 border-b border-border p-4 sm:px-6">
      <div className="relative w-full sm:max-w-[410px]"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input aria-label="Search referrals" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name, code, or program..." className="h-[42px] pl-10 md:text-sm" /></div>
      <div className="flex flex-wrap gap-4 sm:ml-auto">
        <Popover><PopoverTrigger asChild><Button variant="outline" className="min-w-36 h-[42px] justify-between font-normal">{programs.length ? `${programs.length} Program${programs.length > 1 ? "s" : ""}` : "All Programs"}<ChevronRight className="size-5 rotate-90 text-heading" /></Button></PopoverTrigger><PopoverContent align="start" className="max-h-80 w-64 space-y-3 overflow-y-auto p-3"><p className="text-xs font-semibold">All Programs</p>{programList.isPending && <p className="text-xs text-muted-foreground">Loading programs…</p>}{programList.isError && <p className="text-xs text-red-600">Couldn&apos;t load programs.</p>}{programList.data?.map((p) => <div key={p.id} className="flex items-center gap-2"><Checkbox id={`program-${p.id}`} checked={programs.includes(p.id)} onCheckedChange={() => toggle(p.id, programs, setPrograms)} /><Label htmlFor={`program-${p.id}`} className="cursor-pointer text-xs">{p.title}</Label></div>)}</PopoverContent></Popover>
        <Popover><PopoverTrigger asChild><Button variant="outline" className="min-w-32 h-[42px] justify-between font-normal">{statuses.length ? `${statuses.length} Status${statuses.length > 1 ? "es" : ""}` : "All Statuses"}<ChevronRight className="size-5 rotate-90 text-heading" /></Button></PopoverTrigger><PopoverContent align="start" className="w-44 space-y-3 p-3"><p className="text-xs font-semibold">All Statuses</p>{LEDGER_STATUSES.map((s) => <div key={s.id} className="flex items-center gap-2"><Checkbox id={`status-${s.id}`} checked={statuses.includes(s.id)} onCheckedChange={() => toggle(s.id, statuses, setStatuses)} /><Label htmlFor={`status-${s.id}`} className="cursor-pointer text-xs">{s.label}</Label></div>)}</PopoverContent></Popover>
        <Button variant="secondary" className="h-[42px] px-4 text-base font-normal" onClick={() => void download(() => exportLedger(filters), "Ledger")}><Download className="size-4" />Export CSV</Button>
      </div>
    </div>
    <div className="overflow-x-auto"><table className="w-full min-w-[900px] text-left"><thead className="bg-table-head"><tr>{["REFERRER", "REFEREE", "CODE", "PROGRAM", "AMOUNT PAID", "COMMISSION", "STATUS", "DATE"].map((head) => <th key={head} className="whitespace-nowrap px-6 py-5 text-xs font-normal tracking-wide text-table-label">{head}</th>)}</tr></thead><tbody>
      {rows.map((row) => <tr key={row.id} className="border-t border-border text-sm text-heading">
        <td className="px-6 py-5"><p className="whitespace-nowrap text-base font-medium">{row.referrer.fullName}</p><p className="text-xs text-muted-foreground">{row.referrer.truncatedUserId}</p></td>
        <td className="px-6 py-5"><p className="whitespace-nowrap text-base font-medium">{row.referee.fullName}</p><p className="text-xs text-muted-foreground">{row.referee.truncatedUserId}</p></td>
        <td className="px-6 py-5"><div className="flex items-center gap-1"><span className="rounded bg-slate-100 px-2 py-1 text-sm">{row.referrer.referralCode}</span><Button variant="ghost" size="icon" className="size-7" aria-label={`Copy ${row.referrer.referralCode}`} onClick={() => { void navigator.clipboard?.writeText(row.referrer.referralCode); toast.success("Referral code copied"); }}><Copy className="size-3.5" /></Button></div></td>
        <td className="px-6 py-5">{row.programTitle}</td><td className="px-6 py-5 font-medium">{money(row.amountPaidMinor, row.currency, row.minorUnit)}</td><td className="px-6 py-5 font-medium text-finance-positive">{money(row.commissionMinor, row.currency, row.minorUnit)}</td>
        <td className="px-6 py-5"><LedgerStatusPill status={row.ledgerStatus} /></td><td className="px-6 py-5 whitespace-nowrap">{day(row.creditedAt)}</td>
      </tr>)}
      {ledger.data && !rows.length && <tr><td colSpan={8} className="px-6 py-10 text-center text-muted-foreground">{filtering ? "No referrals match your filters." : "No referrals yet."}</td></tr>}
    </tbody></table></div>
    {!ledger.data && <QueryNotice query={ledger} label="the referral ledger" />}
    <LoadMore query={ledger} />
  </section>;
}

function DetailField({ label, value }: { label: string; value: ReactNode }) {
  return <div><p className="text-sm text-muted-foreground">{label}</p><p className="text-sm font-medium text-heading">{value ?? "—"}</p></div>;
}

/** "42 days" since an ISO date. */
function ageOf(iso: string | null | undefined) {
  if (!iso) return null;
  const days = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000));
  return Number.isFinite(days) ? `${days} ${days === 1 ? "day" : "days"}` : null;
}

const STATUS_NOTE: Partial<Record<Withdrawal["status"], { label: string; className: string }>> = {
  Approved: { label: "Approved · awaiting transfer", className: "bg-finance-info text-finance-blue" },
  Disbursing: { label: "Transfer in progress", className: "bg-finance-info text-finance-blue" },
  Failed: { label: "Transfer failed", className: "bg-red-50 text-red-700" },
};

/** "Approve & Process" for a pending request (approve, then start the transfer), "Process Payout" once approved. */
function useProcess() {
  const action = useWithdrawalAction();
  const run = async (w: Withdrawal) => {
    const name = w.user?.fullName || w.accountName || "this user";
    if (w.status === "Pending") {
      try {
        await action.mutateAsync({ id: w.id, action: "approve" });
      } catch (e) {
        toast.error(`Couldn't approve the withdrawal: ${errorText(e)}`);
        return false;
      }
    }
    try {
      await action.mutateAsync({ id: w.id, action: "disburse" });
      toast.success(`Withdrawal for ${name} approved and sent for transfer`);
      return true;
    } catch (e) {
      toast.error(`${w.status === "Pending" ? "Approved, but the" : "The"} transfer couldn't start: ${errorText(e)}. It stays in the queue as approved.`);
      return false;
    }
  };
  return { run, pending: action.isPending };
}

function Queue() {
  const queue = useWithdrawalQueue();
  const process = useProcess();
  const reject = useWithdrawalAction();
  const [confirming, setConfirming] = useState<Withdrawal | null>(null);
  const [rejecting, setRejecting] = useState<Withdrawal | null>(null);
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState<Withdrawal | null>(null);
  const rows = queue.data ?? [];
  const nameOf = (w: Withdrawal) => w.user?.fullName || w.accountName || "Unknown user";

  const confirmDialog = <Dialog open={!!confirming} onOpenChange={(open) => { if (!open && !process.pending) setConfirming(null); }}><DialogContent className="max-w-md"><DialogHeader><DialogTitle className="text-base text-heading">Confirm Approval</DialogTitle></DialogHeader>{confirming && <><DialogDescription className="text-xs text-foreground">You are about to {confirming.status === "Pending" ? "approve and process" : "process"} a withdrawal of <strong>{money(confirming.amount, confirming.currency, confirming.minorUnit)}</strong> to:</DialogDescription><div className="rounded-md bg-table-head p-4 text-xs"><p className="text-muted-foreground">Bank Account</p><p className="font-semibold text-heading">{confirming.bankName ?? "—"}</p><p>{confirming.accountNumber ?? "—"}</p><p>{confirming.accountName ?? nameOf(confirming)}</p></div><div className="grid grid-cols-2 gap-2"><Button variant="outline" disabled={process.pending} onClick={() => setConfirming(null)}>Cancel</Button><Button className="bg-finance-positive text-primary-foreground hover:bg-finance-positive/90" disabled={process.pending} onClick={async () => { await process.run(confirming); setConfirming(null); setDetails(null); }}>{process.pending ? "Processing…" : <>Confirm &amp; Process</>}</Button></div></>}</DialogContent></Dialog>;

  const rejectDialog = <Dialog open={!!rejecting} onOpenChange={(open) => { if (!open && !reject.isPending) { setRejecting(null); setReason(""); } }}><DialogContent className="max-w-md"><DialogHeader><DialogTitle className="text-base text-heading">Reject Withdrawal</DialogTitle></DialogHeader>{rejecting && <form className="space-y-3" onSubmit={async (e) => { e.preventDefault(); if (!reason.trim()) return; try { await reject.mutateAsync({ id: rejecting.id, action: "reject", note: reason }); toast.success(`Withdrawal for ${nameOf(rejecting)} rejected`); setRejecting(null); setReason(""); setDetails(null); } catch (err) { toast.error(`Couldn't reject the withdrawal: ${errorText(err)}`); } }}><DialogDescription className="text-xs text-foreground">Reject the withdrawal of <strong>{money(rejecting.amount, rejecting.currency, rejecting.minorUnit)}</strong> requested by {nameOf(rejecting)}. The reason is saved with the request.</DialogDescription><Label htmlFor="reject-reason" className="text-sm font-normal text-ink">Reason</Label><textarea id="reject-reason" required value={reason} onChange={(e) => setReason(e.target.value)} rows={3} className="w-full rounded-md border border-input px-3 py-2 text-sm focus:border-primary focus:outline-none" placeholder="e.g. Bank details don't match the account name" /><div className="grid grid-cols-2 gap-2"><Button type="button" variant="outline" disabled={reject.isPending} onClick={() => { setRejecting(null); setReason(""); }}>Cancel</Button><Button type="submit" className="bg-red-600 text-primary-foreground hover:bg-red-700" disabled={reject.isPending || !reason.trim()}>{reject.isPending ? "Rejecting…" : "Reject"}</Button></div></form>}</DialogContent></Dialog>;

  if (details) {
    const current = rows.find((r) => r.id === details.id) ?? details;
    return <><WithdrawalDetails w={current} onBack={() => setDetails(null)} onApprove={() => setConfirming(current)} onReject={() => setRejecting(current)} />{confirmDialog}{rejectDialog}</>;
  }
  return (
    <div className="space-y-6">
        {!queue.data && <div className="rounded-lg border border-border bg-card"><QueryNotice query={queue} label="withdrawal requests" /></div>}
        {queue.data && rows.length === 0 && <p className="rounded-lg border border-border bg-card py-10 text-center text-sm text-muted-foreground">No pending withdrawal requests</p>}
        {rows.map((r) => <QueueCard key={r.id} w={r} onApprove={() => setConfirming(r)} onReject={() => setRejecting(r)} onDetails={() => setDetails(r)} />)}
      {confirmDialog}
      {rejectDialog}
    </div>
  );
}

function QueueCard({ w, onApprove, onReject, onDetails }: { w: Withdrawal; onApprove: () => void; onReject: () => void; onDetails: () => void }) {
  const referrer = useReferrer(w.userId);
  const name = w.user?.fullName || w.accountName || "Unknown user";
  const note = STATUS_NOTE[w.status];
  const conversions = referrer.data?.paidConversions;
  return (
    <article className="overflow-hidden rounded-lg border border-border bg-card shadow-card">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-table-head px-6 py-5"><div className="flex items-center gap-3"><span className="grid size-12 shrink-0 place-items-center rounded-full bg-finance-blue text-base font-bold text-primary-foreground">{initialsOf(name)}</span><div><p className="flex flex-wrap items-center gap-2 text-base font-semibold text-heading">{name}{note && <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${note.className}`}>{note.label}</span>}</p><p className="text-sm text-muted-foreground">User ID: {w.userId.slice(0, 8)}</p></div></div><div className="text-right"><p className="text-2xl font-bold text-heading">{money(w.amount, w.currency, w.minorUnit)}</p><p className="text-sm text-muted-foreground">{conversions === undefined ? (referrer.isPending ? "…" : (w.user?.userType ?? "")) : `${conversions} successful ${conversions === 1 ? "referral" : "referrals"}`}</p></div></div>
      <div className="grid gap-4 px-6 pt-5 sm:grid-cols-2"><div className="rounded-lg bg-table-head px-4 py-3"><p className="text-xs text-muted-foreground">Requested</p><p className="text-sm font-medium text-heading">{dayTime(w.createdAt)}</p></div><div className="rounded-lg bg-table-head px-4 py-3"><p className="text-xs text-muted-foreground">Bank Account</p><p className="text-sm font-medium text-heading">{masked(w.accountNumber)}{w.bankName ? ` · ${w.bankName}` : ""}</p></div></div>
      <div className="flex flex-wrap justify-end gap-3 px-6 py-5">
        {w.status !== "Disbursing" && <Button className="h-12 px-6 text-base font-normal bg-finance-positive text-primary-foreground hover:bg-finance-positive/90" onClick={onApprove}><CheckCircle2 className="size-4" />{w.status === "Pending" ? <>Approve &amp; Process</> : w.status === "Failed" ? "Retry Payout" : "Process Payout"}</Button>}
        {w.status === "Pending" && <Button variant="outline" className="h-12 px-6 text-base font-normal text-red-600" onClick={onReject}><CircleX className="size-4" />Reject</Button>}
        <Button variant="outline" className="h-12 px-6 text-base font-normal" onClick={onDetails}>View Details</Button>
      </div>
    </article>
  );
}

function WithdrawalDetails({ w, onBack, onApprove, onReject }: { w: Withdrawal; onBack: () => void; onApprove: () => void; onReject: () => void }) {
  const detail = useWithdrawal(w.id);
  const referrer = useReferrer(w.userId);
  const d = detail.data;
  const name = d?.user.fullName || w.user?.fullName || w.accountName || "Unknown user";
  const statusLabel = STATUS_NOTE[w.status]?.label ?? w.status;
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between"><button onClick={onBack} className="flex items-center gap-1 text-base text-heading hover:underline"><ArrowLeft className="size-4" />Back</button><span className="rounded-full bg-pending/20 px-4 py-2 text-sm font-medium text-pending-foreground">{statusLabel}</span></div>
      {detail.isError && <div className="rounded-lg border border-border bg-card"><QueryNotice query={detail} label="the withdrawal" /></div>}
      <div className="grid gap-6 md:grid-cols-3">
        <div className="space-y-4 rounded-lg border border-border bg-card p-6 shadow-card"><div className="flex items-center gap-3"><span className="grid size-12 place-items-center rounded-full bg-finance-blue text-base font-bold text-primary-foreground">{initialsOf(name)}</span><div><p className="text-lg font-semibold text-heading">{name}</p><p className="text-sm text-muted-foreground">{w.userId.slice(0, 8)}{d?.user.userType ? ` · ${d.user.userType}` : ""}</p></div></div><DetailField label="Email" value={d?.user.email ?? w.user?.email} /><DetailField label="Phone" value={d?.user.phoneNumber ?? w.user?.phoneNumber} /><DetailField label="Account Age" value={ageOf(w.user?.createdAt ?? referrer.data?.memberSince)} /><DetailField label="Previous Withdrawals" value={d ? d.previousWithdrawalCount : detail.isPending ? "…" : null} /></div>
        <div className="space-y-4 rounded-lg border border-border bg-card p-6 shadow-card"><p className="flex items-center gap-2 text-lg font-semibold text-heading"><DollarSign className="size-5 text-finance-positive" />Withdrawal Details</p><div><p className="text-sm text-muted-foreground">Amount Requested</p><p className="text-2xl font-bold text-heading">{money(w.amount, w.currency, w.minorUnit)}</p></div><DetailField label="Requested On" value={dayTime(w.createdAt)} /><DetailField label="Successful Referrals" value={referrer.data ? `${referrer.data.paidConversions} conversions` : referrer.isPending ? "…" : null} />{w.note && <DetailField label="Note from requester" value={w.note} />}</div>
        <div className="space-y-4 rounded-lg border border-border bg-card p-6 shadow-card"><p className="flex items-center gap-2 text-lg font-semibold text-heading"><WalletCards className="size-5 text-purple-600" />Bank Account</p><DetailField label="Bank Name" value={w.bankName} /><DetailField label="Account Number" value={w.accountNumber} /><DetailField label="Account Name" value={w.accountName} /></div>
      </div>
      {w.status !== "Disbursing" && <Button className="h-11 w-full bg-finance-positive text-base font-normal text-primary-foreground hover:bg-finance-positive/90" onClick={onApprove}><CheckCircle2 className="size-4" />{w.status === "Pending" ? <>Approve &amp; Process Withdrawal</> : w.status === "Failed" ? "Retry Payout" : "Process Payout"}</Button>}
      {w.status === "Pending" && <Button variant="outline" className="h-11 w-full text-base font-normal text-red-600" onClick={onReject}><CircleX className="size-4" />Reject Withdrawal</Button>}
    </div>
  );
}

function Settings() {
  const settings = useReferralSettings();
  const save = useSaveReferralSettings();
  const [draft, setDraft] = useState<string | null>(null);
  const rate = draft ?? (settings.data ? String(settings.data.rewardPercent) : "");
  const n = Number(rate) || 0;
  return (
    <Card title="Global Reward Configuration" divider={false}>
      {!settings.data ? <QueryNotice query={settings} label="commission settings" /> : (
      <form noValidate className="grid gap-2 p-6" onSubmit={async (e) => {
        e.preventDefault();
        if (rate.trim() === "" || !Number.isFinite(Number(rate)) || n < 0 || n > 100) { toast.error("Enter a rate between 0 and 100."); return; }
        try {
          const saved = await save.mutateAsync(n);
          setDraft(null);
          toast.success(`Global reward rate set to ${saved.rewardPercent}%`);
        } catch (err) {
          toast.error(`Couldn't save the reward rate: ${errorText(err)}`);
        }
      }}>
        <Label htmlFor="rate" className="text-sm font-normal text-ink">Global Reward Rate (%)</Label>
        <Input id="rate" type="number" min={0} max={100} step="any" value={rate} onChange={(e) => setDraft(e.target.value)} className="h-10 px-4 md:text-base" />
        <p className="text-xs text-muted-foreground">Example: If a referred student pays ₦100,000 and rate is {n}%, referrer earns {money(100000 * n, "NGN", 100)}</p>
        {settings.data.updatedAt && <p className="text-xs text-muted-foreground">Last updated {dayTime(settings.data.updatedAt)}</p>}
        <Button type="submit" disabled={save.isPending} className="mt-4 h-12 w-full bg-brand text-base font-normal text-primary-foreground hover:bg-brand/90">{save.isPending ? "Saving…" : "Save Settings"}</Button>
      </form>
      )}
    </Card>
  );
}

function ReferrerDetail({ userId, onBack }: { userId: string; onBack: () => void }) {
  const referrer = useReferrer(userId);
  const performance = useReferrerPerformance(userId);
  const balances = usePayoutSummary(userId);
  const withdrawals = useUserWithdrawals(userId);
  const reset = useResetCode(userId);
  const [confirmReset, setConfirmReset] = useState(false);
  const r = referrer.data;
  const b = balances.data;
  const paidOut = (withdrawals.data?.pages.flatMap((p) => p.items) ?? []);
  const bal = (minor: number | undefined) => (balances.isPending ? "…" : balances.isError ? "—" : money(minor, b?.currency, b?.minorUnit));
  const balCompact = (minor: number | undefined) => (balances.isPending ? "…" : balances.isError ? "—" : compactMoney(minor, b?.currency, b?.minorUnit));
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="flex items-center gap-1 text-base text-heading hover:underline"><ArrowLeft className="size-4" /> Back</button>
        <Button className="h-11 px-4 font-normal" disabled={!r} onClick={() => r && void download(() => exportReferrer(userId, r.referralCode), "Report")}><Download /> Export Report</Button>
      </div>
      {!r ? <section className="rounded-lg border border-border bg-card"><QueryNotice query={referrer} label="the referrer" /></section> : (
      <section className="rounded-lg bg-brand p-6 text-primary-foreground">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <span className="grid size-20 place-items-center rounded-full bg-background text-[28px] font-bold text-heading">{initialsOf(r.fullName)}</span>
            <div><p className="text-2xl font-bold">{r.fullName}</p><p className="text-base opacity-90">{r.userType}{r.memberSince ? ` • Member since ${new Date(r.memberSince).toLocaleDateString("en-US")}` : ""}</p><p className="text-sm opacity-80">{r.email}</p></div>
          </div>
          <div className="text-right"><p className="text-sm opacity-80">Total Earnings</p><p className="text-[32px] font-bold leading-10">{money(r.totalEarnedMinor)}</p></div>
        </div>
        <div className="mt-6 rounded-lg bg-background p-6 text-foreground">
          <div className="mb-3 flex items-center justify-between"><p className="text-lg font-semibold text-heading">Unique Referral Code</p>
            <button className="inline-flex items-center gap-1 text-sm font-medium disabled:opacity-50" disabled={reset.isPending} onClick={() => setConfirmReset(true)}><RefreshCcw className="size-3.5" /> {reset.isPending ? "Resetting…" : "Reset Code"}</button>
          </div>
          <div className="flex items-center gap-3"><Input readOnly aria-label="Referral code" value={r.referralCode} className="h-10 px-4 text-lg font-medium text-primary md:text-lg" />
            <button className="inline-flex items-center gap-1 px-2 text-base font-medium text-accent" onClick={() => { void navigator.clipboard?.writeText(r.referralCode); toast.success("Referral code copied"); }}><Copy className="size-4" /> Copy</button>
          </div>
          <p className="mt-3 flex items-center gap-1.5 break-all text-sm text-muted-foreground"><Link2 className="size-4 shrink-0" />{r.shareUrl}</p>
        </div>
      </section>
      )}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Link Clicks" value={r ? r.linkClicks.toLocaleString("en-NG") : "…"} note="Total link visits" icon={<TrendingUp className="size-5 text-finance-blue" />} />
        <Stat label="Referrals" value={r ? String(r.referrals) : "…"} note={r ? `${r.paidConversions} paid conversions` : " "} icon={<Users className="size-5 text-finance-purple" />} />
        <Stat label="Conversion Rate" value={r ? `${+r.conversionRate.toFixed(1)}%` : "…"} note="Paid conversions per referral" icon={<Award className="size-5 text-finance-positive" />} />
        <Stat label="Available Balance" value={balCompact(b?.availableBalanceMinor)} note="Ready for withdrawal" icon={<DollarSign className="size-5 text-finance-orange" />} />
      </div>
      <Card title="Referral Performance Over Time" divider={false}>
        {performance.data ? <GrowthChart rows={growthRows(performance.data.points)} lines={[{ key: "a", name: "Referrals", color: "#16a36a" }]} /> : <QueryNotice query={performance} label="performance" />}
      </Card>
      <div className="grid gap-6 md:grid-cols-3">
        <article className="rounded-lg border border-border bg-card p-6 shadow-card"><div className="flex justify-between"><p className="text-lg font-semibold text-heading">Available Balance</p><CheckCircle2 className="size-5 text-finance-positive" /></div><p className="mt-3 text-[28px] font-bold leading-9 text-finance-positive">{bal(b?.availableBalanceMinor)}</p><p className="text-sm text-muted-foreground">Ready for withdrawal</p></article>
        <article className="rounded-lg border border-border bg-card p-6 shadow-card"><div className="flex justify-between"><p className="text-lg font-semibold text-heading">Pending Balance</p><Clock3 className="size-5 text-finance-orange" /></div><p className="mt-3 text-[28px] font-bold leading-9 text-finance-orange">{bal(b?.pendingBalanceMinor)}</p><p className="text-sm text-muted-foreground">Not yet available to withdraw</p></article>
        <article className="rounded-lg border border-border bg-card p-6 shadow-card"><div className="flex justify-between"><p className="text-lg font-semibold text-heading">Total Withdrawn</p><Download className="size-5 text-muted-foreground" /></div><p className="mt-3 text-[28px] font-bold leading-9 text-heading">{bal(b?.totalWithdrawnMinor)}</p><p className="text-sm text-muted-foreground">{b ? `${b.disbursedWithdrawalCount} ${b.disbursedWithdrawalCount === 1 ? "transaction" : "transactions"}` : " "}</p></article>
      </div>
      <Card title={`Referral History${r ? ` (${r.paidConversions})` : ""}`}><HistoryTable userId={userId} /></Card>
      <Card title={`Withdrawal History${withdrawals.data ? ` (${paidOut.length}${withdrawals.hasNextPage ? "+" : ""})` : ""}`}>
        <div className="space-y-3 p-6">
          {!withdrawals.data && <QueryNotice query={withdrawals} label="withdrawal history" />}
          {withdrawals.data && paidOut.length === 0 && <Notice>No withdrawals yet.</Notice>}
          {paidOut.map((w) => {
            const done = w.status === "Disbursed";
            const bad = w.status === "Rejected" || w.status === "Failed";
            return (
              <div key={w.id} className="flex items-center gap-4 rounded-lg bg-table-head px-4 py-4">
                <span className={`grid size-10 place-items-center rounded-full ${done ? "bg-finance-positive-soft" : "bg-slate-100"}`}><Download className={`size-5 ${done ? "text-finance-positive" : "text-muted-foreground"}`} /></span>
                <div className="flex-1"><p className="text-base font-semibold text-heading">{money(w.amountMinor, w.currency, w.minorUnit)}</p><p className="text-sm text-muted-foreground">{w.accountNumberMasked ? `****${w.accountNumberMasked.slice(-4)}` : "—"} · {dayTime(w.disbursedAt ?? w.requestedAt)}</p></div>
                <span className={`rounded-full px-3 py-1 text-sm font-medium ${done ? "bg-finance-positive-soft text-finance-positive" : bad ? "bg-red-50 text-red-700" : "bg-pending/20 text-pending-foreground"}`}>{done ? "Completed" : w.status}</span>
              </div>
            );
          })}
        </div>
        <LoadMore query={withdrawals} />
      </Card>
      <Dialog open={confirmReset} onOpenChange={(open) => { if (!reset.isPending) setConfirmReset(open); }}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle className="text-base text-heading">Reset referral code?</DialogTitle></DialogHeader>
          <DialogDescription className="text-xs text-foreground">{r?.fullName ?? "This referrer"} gets a new code and link. Links already shared with the old code ({r?.referralCode}) will stop crediting them.</DialogDescription>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" disabled={reset.isPending} onClick={() => setConfirmReset(false)}>Cancel</Button>
            <Button disabled={reset.isPending} onClick={async () => { try { const next = await reset.mutateAsync(); toast.success(`Referral code reset to ${next.referralCode}`); setConfirmReset(false); } catch (e) { toast.error(`Couldn't reset the code: ${errorText(e)}`); } }}>{reset.isPending ? "Resetting…" : "Reset Code"}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
