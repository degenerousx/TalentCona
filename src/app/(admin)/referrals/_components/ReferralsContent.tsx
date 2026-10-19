"use client";

import { useState, type ReactNode } from "react";
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

type Tab = "overview" | "ledger" | "queue" | "settings";

const growth = [
  { m: "Aug", a: 45, b: 38 }, { m: "Sep", a: 62, b: 54 }, { m: "Oct", a: 78, b: 68 }, { m: "Nov", a: 95, b: 82 },
  { m: "Dec", a: 124, b: 106 }, { m: "Jan", a: 158, b: 138 }, { m: "Feb", a: 192, b: 165 },
];

type Referrer = { rank: number; name: string; type: "Student" | "Mentor"; referrals: number; paid: number; earnings: string; email: string; code: string };
const referrers: Referrer[] = [
  { rank: 1, name: "Sarah Johnson", type: "Student", referrals: 24, paid: 22, earnings: "₦330,000", email: "sarah.j@email.com", code: "SARAH2026" },
  { rank: 2, name: "Dr. James Wilson", type: "Mentor", referrals: 18, paid: 18, earnings: "₦270,000", email: "james.w@email.com", code: "JAMES2026" },
  { rank: 3, name: "Michael Chen", type: "Student", referrals: 16, paid: 14, earnings: "₦210,000", email: "michael.c@email.com", code: "MICHAEL2026" },
  { rank: 4, name: "Emily Rodriguez", type: "Student", referrals: 12, paid: 11, earnings: "₦165,000", email: "emily.r@email.com", code: "EMILY2026" },
  { rank: 5, name: "David Kim", type: "Mentor", referrals: 10, paid: 10, earnings: "₦150,000", email: "david.k@email.com", code: "DAVID2026" },
];
const rankColors = ["bg-yellow-500", "bg-slate-400", "bg-orange-600", "bg-brand", "bg-brand"];

const history = [
  ["Alice Smith", "STU-5678", "Web Development", "₦100,000", "₦15,000", "Paid", "2024-02-10"],
  ["Bob Brown", "STU-8765", "Data Science", "₦120,000", "₦18,000", "Pending", "2024-02-15"],
  ["Charlie Davis", "STU-9876", "UX Design", "₦95,000", "₦14,250", "Paid", "2024-01-28"],
  ["Diana Prince", "STU-3456", "Mobile Dev", "₦110,000", "₦16,500", "Pending", "2024-03-01"],
  ["Ethan Hunt", "STU-7890", "Web Development", "₦100,000", "₦15,000", "Paid", "2024-02-20"],
];
const perf = [{ m: "Jan", v: 3 }, { m: "Feb", v: 12 }, { m: "Mar", v: 9 }];

type Withdrawal = { name: string; userId: string; amount: number; referrals: number; requested: string; account: string; bank: string; accountNumber: string };
const initialWithdrawals: Withdrawal[] = [
  { name: "Sarah Johnson", userId: "STU-1234", amount: 150000, referrals: 10, requested: "2026-02-16 10:30", account: "****5678", bank: "First Bank of Nigeria", accountNumber: "1234567890" },
  { name: "Michael Chen", userId: "STU-5678", amount: 85000, referrals: 6, requested: "2026-02-15 14:20", account: "****4321", bank: "Access Bank", accountNumber: "0987654321" },
];

type LedgerEntry = { referrer: string; referrerId: string; referee: string; refereeId: string; code: string; program: string; amount: number; commission: number; status: "Paid" | "Processing" | "Pending" | "No Commission"; date: string };
const ledgerEntries: LedgerEntry[] = [
  { referrer: "John Doe", referrerId: "STU-1234", referee: "Alice Smith", refereeId: "STU-5678", code: "JOHN2026", program: "Frontend Engineering", amount: 100000, commission: 15000, status: "Paid", date: "2026-02-10" },
  { referrer: "Jane Mentor", referrerId: "MNT-4321", referee: "Bob Brown", refereeId: "STU-8765", code: "JANE15", program: "Data Science", amount: 120000, commission: 20000, status: "Pending", date: "2026-02-15" },
  { referrer: "Sam Lee", referrerId: "STU-9999", referee: "Charlie Verified", refereeId: "STU-1111", code: "SAMREF", program: "UX Design", amount: 95000, commission: 0, status: "No Commission", date: "2026-02-01" },
];
const ledgerStatuses: LedgerEntry["status"][] = ["Paid", "Processing", "Pending", "No Commission"];
const ledgerPrograms = ["Frontend Engineering", "Data Science", "UX Design"];
const naira = (amount: number) => `₦${amount.toLocaleString("en-NG")}`;

export default function ReferralsContent() {
  const [tab, setTab] = useState<Tab>("overview");
  const [selected, setSelected] = useState<Referrer | null>(null);
  const [queue, setQueue] = useState(initialWithdrawals);
  // The layout's <main> is the scroll box; open/close the detail view at its top.
  const showReferrer = (r: Referrer | null) => { setSelected(r); document.querySelector("main")?.scrollTo({ top: 0 }); };

  return (
    <div className="text-foreground">
        <div className="mx-auto max-w-[1280px]">
          {selected ? <ReferrerDetail referrer={selected} onBack={() => showReferrer(null)} /> : (
            <>
              <header className="mb-8"><h1 className="text-[28px] leading-9 font-normal text-heading sm:text-[32px]">Referral &amp; Commission Engine</h1><p className="text-base text-slate-600">Manage viral growth and track referral earnings</p></header>
              <div className="mb-8 flex gap-8 overflow-x-auto border-b border-border px-6" role="tablist">
                {([["overview", "Overview Dashboard"], ["ledger", "Referral Ledger"], ["queue", "Withdrawal Queue"], ["settings", "Commission Settings"]] as const).map(([id, label]) => (
                  <Button key={id} variant="ghost" role="tab" aria-selected={tab === id} onClick={() => setTab(id)} className={`relative h-[58px] shrink-0 gap-2 rounded-none px-1.5 text-base shadow-none hover:bg-transparent ${tab === id ? "font-medium text-primary after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:bg-primary" : "font-medium text-heading"}`}>
                    {label}{id === "queue" && <span className="grid min-w-5 place-items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs font-normal text-slate-600">{queue.length}</span>}
                  </Button>
                ))}
              </div>
              {tab === "overview" && <Overview onView={showReferrer} />}
              {tab === "ledger" && <Ledger />}
               {tab === "queue" && <Queue rows={queue} onDone={(name) => { setQueue((q) => q.filter((r) => r.name !== name)); toast.success(`Withdrawal for ${name} marked as processed`); }} />}
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

function Overview({ onView }: { onView: (r: Referrer) => void }) {
  return (
    <div className="space-y-8">
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Viral Coefficient" value="1.8" note="Avg new users per referrer" icon={<TrendingUp className="size-5 text-finance-positive" />} />
        <Stat label="Conversion Value" value="₦12.4M" note="Revenue from referrals" icon={<DollarSign className="size-5 text-finance-blue" />} />
        <Stat label="Pending Payouts" value="₦2.3M" note="Awaiting lock-in period" icon={<Clock3 className="size-5 text-finance-orange" />} />
        <Stat label="Active Referrers" value="342" note="Users with referrals" icon={<Users className="size-5 text-finance-purple" />} />
      </div>
      <Card title="Viral Growth Trend" divider={false}>
        <div className="h-[300px] px-6 py-4">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={growth} margin={{ top: 8, right: 12, left: -10, bottom: 0 }}>
              <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" />
              <XAxis dataKey="m" tick={{ fontSize: 12, fill: "#64748b" }} />
              <YAxis domain={[0, 200]} ticks={[0, 50, 100, 150, 200]} tick={{ fontSize: 12, fill: "#64748b" }} />
              <Tooltip contentStyle={{ fontSize: 11, borderRadius: 6 }} />
              <Line dataKey="a" name="Signups" type="monotone" stroke="#4c6fff" strokeWidth={2} dot={{ r: 3, fill: "#ffffff" }} isAnimationActive={false} />
              <Line dataKey="b" name="Conversions" type="monotone" stroke="#16a36a" strokeWidth={2} dot={{ r: 3, fill: "#ffffff" }} isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>
      <Card title="Top Referrers Leaderboard" action={<Button variant="ghost" size="sm" className="text-primary" onClick={() => toast.success("Leaderboard exported")}><Download /> Export</Button>}>
        <div className="space-y-3 p-6">
          {referrers.map((r, i) => (
            <div key={r.name} className="flex items-center gap-4 rounded-lg bg-table-head px-4 py-4">
              <span className={`grid size-12 shrink-0 place-items-center rounded-full text-xl font-bold text-primary-foreground ${rankColors[i]}`}>{r.rank}</span>
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-2 text-lg font-semibold text-heading">{r.name}<TypePill type={r.type} /></p>
                <p className="mt-0.5 text-sm text-muted-foreground">{r.referrals} referrals · <span className="text-finance-positive">{r.paid} paid</span></p>
              </div>
              <div className="text-right"><p className="text-xl font-bold leading-7 text-heading">{r.earnings}</p><p className="text-xs text-muted-foreground">Total Earnings</p></div>
              <Button variant="ghost" size="sm" className="text-primary" onClick={() => onView(r)}><Eye /> View</Button>
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

function Badge({ status }: { status: string }) {
  const paid = status === "Paid" || status === "Completed";
  return <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${paid ? "bg-finance-positive-soft text-finance-positive" : "bg-pending/20 text-pending-foreground"}`}>{paid ? <CheckCircle2 className="size-3" /> : <Clock3 className="size-3" />}{status}</span>;
}

function HistoryTable() {
  const cols = ["REFEREE", "PROGRAM", "AMOUNT PAID", "COMMISSION", "STATUS", "DATE"];
  return (
    <div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left">
      <thead className="bg-table-head"><tr>{cols.map((c) => <th key={c} className="whitespace-nowrap px-6 py-3 text-xs font-normal tracking-wide text-table-label">{c}</th>)}</tr></thead>
      <tbody>{history.map((h) => (
        <tr key={h[1]} className="border-t border-border text-sm text-heading">
          <td className="px-6 py-4"><p className="text-base font-medium">{h[0]}</p><p className="text-xs text-muted-foreground">{h[1]}</p></td>
          <td className="px-6 py-4">{h[2]}</td><td className="px-6 py-4 font-medium">{h[3]}</td>
          <td className="px-6 py-4 font-medium text-finance-positive">{h[4]}</td><td className="px-6 py-4"><Badge status={h[5]!} /></td><td className="px-6 py-4">{h[6]}</td>
        </tr>
      ))}</tbody>
    </table></div>
  );
}

function Ledger() {
  const [search, setSearch] = useState("");
  const [programs, setPrograms] = useState<string[]>([]);
  const [statuses, setStatuses] = useState<string[]>([]);
  const filtered = ledgerEntries.filter((row) => {
    const query = search.trim().toLowerCase();
    return (!query || [row.referrer, row.referrerId, row.referee, row.refereeId, row.code, row.program].some((field) => field.toLowerCase().includes(query)))
      && (programs.length === 0 || programs.includes(row.program)) && (statuses.length === 0 || statuses.includes(row.status));
  });
  const exportCsv = () => {
    const columns = ["Referrer", "Referrer ID", "Referee", "Referee ID", "Code", "Program", "Amount Paid", "Commission", "Status", "Date"];
    const lines = [columns, ...filtered.map((r) => [r.referrer, r.referrerId, r.referee, r.refereeId, r.code, r.program, String(r.amount), String(r.commission), r.status, r.date])];
    const csv = lines.map((line) => line.map((cell) => `"${cell.replaceAll('"', '""')}"`).join(",")).join("\r\n");
    const url = URL.createObjectURL(new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a"); link.href = url; link.download = "referral-ledger.csv"; link.click(); URL.revokeObjectURL(url);
  };
  const toggle = (value: string, values: string[], setValues: (next: string[]) => void) => setValues(values.includes(value) ? values.filter((v) => v !== value) : [...values, value]);
  return <section className="overflow-hidden rounded-lg border border-border bg-card shadow-card">
    <div className="flex flex-wrap items-center gap-3 border-b border-border p-4 sm:px-6">
      <div className="relative w-full sm:max-w-[410px]"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input aria-label="Search referrals" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name, code, or program..." className="h-[42px] pl-10 md:text-sm" /></div>
      <div className="flex flex-wrap gap-4 sm:ml-auto">
        <Popover><PopoverTrigger asChild><Button variant="outline" className="min-w-36 h-[42px] justify-between font-normal">{programs.length ? `${programs.length} Program${programs.length > 1 ? "s" : ""}` : "All Programs"}<ChevronRight className="size-5 rotate-90 text-heading" /></Button></PopoverTrigger><PopoverContent align="start" className="w-56 space-y-3 p-3"><p className="text-xs font-semibold">All Programs</p>{ledgerPrograms.map((p) => <div key={p} className="flex items-center gap-2"><Checkbox id={`program-${p}`} checked={programs.includes(p)} onCheckedChange={() => toggle(p, programs, setPrograms)} /><Label htmlFor={`program-${p}`} className="cursor-pointer text-xs">{p}</Label></div>)}</PopoverContent></Popover>
        <Popover><PopoverTrigger asChild><Button variant="outline" className="min-w-32 h-[42px] justify-between font-normal">{statuses.length ? `${statuses.length} Status${statuses.length > 1 ? "es" : ""}` : "All Statuses"}<ChevronRight className="size-5 rotate-90 text-heading" /></Button></PopoverTrigger><PopoverContent align="start" className="w-44 space-y-3 p-3"><p className="text-xs font-semibold">All Statuses</p>{ledgerStatuses.map((s) => <div key={s} className="flex items-center gap-2"><Checkbox id={`status-${s}`} checked={statuses.includes(s)} onCheckedChange={() => toggle(s, statuses, setStatuses)} /><Label htmlFor={`status-${s}`} className="cursor-pointer text-xs">{s}</Label></div>)}</PopoverContent></Popover>
        <Button variant="secondary" className="h-[42px] px-4 text-base font-normal" onClick={exportCsv}><Download className="size-4" />Export CSV</Button>
      </div>
    </div>
    <div className="overflow-x-auto"><table className="w-full min-w-[900px] text-left"><thead className="bg-table-head"><tr>{["REFERRER", "REFEREE", "CODE", "PROGRAM", "AMOUNT PAID", "COMMISSION", "STATUS", "DATE"].map((head) => <th key={head} className="whitespace-nowrap px-6 py-5 text-xs font-normal tracking-wide text-table-label">{head}</th>)}</tr></thead><tbody>
      {filtered.map((row) => <tr key={row.code} className="border-t border-border text-sm text-heading">
        <td className="px-6 py-5"><p className="whitespace-nowrap text-base font-medium">{row.referrer}</p><p className="text-xs text-muted-foreground">{row.referrerId}</p></td>
        <td className="px-6 py-5"><p className="whitespace-nowrap text-base font-medium">{row.referee}</p><p className="text-xs text-muted-foreground">{row.refereeId}</p></td>
        <td className="px-6 py-5"><div className="flex items-center gap-1"><span className="rounded bg-slate-100 px-2 py-1 text-sm">{row.code}</span><Button variant="ghost" size="icon" className="size-7" aria-label={`Copy ${row.code}`} onClick={() => { navigator.clipboard?.writeText(row.code); toast.success("Referral code copied"); }}><Copy className="size-3.5" /></Button></div></td>
        <td className="px-6 py-5">{row.program}</td><td className="px-6 py-5 font-medium">{naira(row.amount)}</td><td className="px-6 py-5 font-medium text-finance-positive">{naira(row.commission)}</td>
        <td className="px-6 py-5"><span className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ${row.status === "Paid" ? "bg-finance-positive-soft text-finance-positive" : row.status === "Pending" ? "bg-pending/20 text-pending-foreground" : "bg-slate-100 text-heading"}`}>{row.status === "Paid" ? <CheckCircle2 className="size-3" /> : row.status === "No Commission" ? <CircleX className="size-3" /> : <Clock3 className="size-3" />}{row.status}</span></td><td className="px-6 py-5 whitespace-nowrap">{row.date}</td>
      </tr>)}
      {!filtered.length && <tr><td colSpan={8} className="px-6 py-10 text-center text-muted-foreground">No referrals match your filters.</td></tr>}
    </tbody></table></div>
  </section>;
}

const extra: Record<string, { email: string; phone: string; age: string; prev: number }> = {
  "STU-1234": { email: "sarah.j@email.com", phone: "+1 (555) 123-4567", age: "42 days", prev: 2 },
  "STU-5678": { email: "michael.c@email.com", phone: "+1 (555) 987-6543", age: "35 days", prev: 1 },
};

function DetailField({ label, value }: { label: string; value: ReactNode }) {
  return <div><p className="text-sm text-muted-foreground">{label}</p><p className="text-sm font-medium text-heading">{value}</p></div>;
}

function Queue({ rows, onDone }: { rows: Withdrawal[]; onDone: (name: string) => void }) {
  const [confirming, setConfirming] = useState<Withdrawal | null>(null);
  const [details, setDetails] = useState<Withdrawal | null>(null);
  const confirmDialog = <Dialog open={!!confirming} onOpenChange={(open) => { if (!open) setConfirming(null); }}><DialogContent className="max-w-md"><DialogHeader><DialogTitle className="text-base text-heading">Confirm Approval</DialogTitle></DialogHeader>{confirming && <><DialogDescription className="text-xs text-foreground">You are about to approve and process a withdrawal of <strong>{naira(confirming.amount)}</strong> to:</DialogDescription><div className="rounded-md bg-table-head p-4 text-xs"><p className="text-muted-foreground">Bank Account</p><p className="font-semibold text-heading">{confirming.bank}</p><p>{confirming.accountNumber}</p><p>{confirming.name}</p></div><div className="grid grid-cols-2 gap-2"><Button variant="outline" onClick={() => setConfirming(null)}>Cancel</Button><Button className="bg-finance-positive text-primary-foreground hover:bg-finance-positive/90" onClick={() => { onDone(confirming.name); setConfirming(null); setDetails(null); }}>Confirm &amp; Process</Button></div></>}</DialogContent></Dialog>;
  if (details) {
    const x = extra[details.userId];
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between"><button onClick={() => setDetails(null)} className="flex items-center gap-1 text-base text-heading hover:underline"><ArrowLeft className="size-4" />Back</button><span className="rounded-full bg-pending/20 px-4 py-2 text-sm font-medium text-pending-foreground">Pending</span></div>
        <div className="grid gap-6 md:grid-cols-3">
          <div className="space-y-4 rounded-lg border border-border bg-card p-6 shadow-card"><div className="flex items-center gap-3"><span className="grid size-12 place-items-center rounded-full bg-finance-blue text-base font-bold text-primary-foreground">{details.name.split(" ").map((n) => n[0]).join("")}</span><div><p className="text-lg font-semibold text-heading">{details.name}</p><p className="text-sm text-muted-foreground">{details.userId}</p></div></div><DetailField label="Email" value={x?.email} /><DetailField label="Phone" value={x?.phone} /><DetailField label="Account Age" value={x?.age} /><DetailField label="Previous Withdrawals" value={x?.prev} /></div>
          <div className="space-y-4 rounded-lg border border-border bg-card p-6 shadow-card"><p className="flex items-center gap-2 text-lg font-semibold text-heading"><DollarSign className="size-5 text-finance-positive" />Withdrawal Details</p><div><p className="text-sm text-muted-foreground">Amount Requested</p><p className="text-2xl font-bold text-heading">{naira(details.amount)}</p></div><DetailField label="Requested On" value={details.requested} /><DetailField label="Successful Referrals" value={`${details.referrals} conversions`} /></div>
          <div className="space-y-4 rounded-lg border border-border bg-card p-6 shadow-card"><p className="flex items-center gap-2 text-lg font-semibold text-heading"><WalletCards className="size-5 text-purple-600" />Bank Account</p><DetailField label="Bank Name" value={details.bank} /><DetailField label="Account Number" value={details.accountNumber} /><DetailField label="Account Name" value={details.name} /></div>
        </div>
        <Button className="h-11 w-full bg-finance-positive text-base font-normal text-primary-foreground hover:bg-finance-positive/90" onClick={() => setConfirming(details)}><CheckCircle2 className="size-4" />Approve &amp; Process Withdrawal</Button>
        {confirmDialog}
      </div>
    );
  }
  return (
    <div className="space-y-6">
        {rows.length === 0 && <p className="rounded-lg border border-border bg-card py-10 text-center text-sm text-muted-foreground">No pending withdrawal requests</p>}
        {rows.map((r) => (
          <article key={r.userId} className="overflow-hidden rounded-lg border border-border bg-card shadow-card">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-table-head px-6 py-5"><div className="flex items-center gap-3"><span className="grid size-12 shrink-0 place-items-center rounded-full bg-finance-blue text-base font-bold text-primary-foreground">{r.name.split(" ").map((n) => n[0]).join("")}</span><div><p className="text-base font-semibold text-heading">{r.name}</p><p className="text-sm text-muted-foreground">User ID: {r.userId}</p></div></div><div className="text-right"><p className="text-2xl font-bold text-heading">{naira(r.amount)}</p><p className="text-sm text-muted-foreground">{r.referrals} successful referrals</p></div></div>
            <div className="grid gap-4 px-6 pt-5 sm:grid-cols-2"><div className="rounded-lg bg-table-head px-4 py-3"><p className="text-xs text-muted-foreground">Requested</p><p className="text-sm font-medium text-heading">{r.requested}</p></div><div className="rounded-lg bg-table-head px-4 py-3"><p className="text-xs text-muted-foreground">Bank Account</p><p className="text-sm font-medium text-heading">{r.account}</p></div></div>
            <div className="flex flex-wrap justify-end gap-3 px-6 py-5"><Button className="h-12 px-6 text-base font-normal bg-finance-positive text-primary-foreground hover:bg-finance-positive/90" onClick={() => setConfirming(r)}><CheckCircle2 className="size-4" />Approve &amp; Process</Button><Button variant="outline" className="h-12 px-6 text-base font-normal" onClick={() => setDetails(r)}>View Details</Button></div>
          </article>
        ))}
      {confirmDialog}
    </div>
  );
}

function Settings() {
  const [rate, setRate] = useState("15");
  const n = Number(rate) || 0;
  return (
    <Card title="Global Reward Configuration" divider={false}>
      <form className="grid gap-2 p-6" onSubmit={(e) => { e.preventDefault(); if (!rate || n < 0 || n > 100) { toast.error("Enter a rate between 0 and 100."); return; } toast.success(`Global reward rate set to ${n}%`); }}>
        <Label htmlFor="rate" className="text-sm font-normal text-ink">Global Reward Rate (%)</Label>
        <Input id="rate" type="number" min={0} max={100} value={rate} onChange={(e) => setRate(e.target.value)} className="h-10 px-4 md:text-base" />
        <p className="text-xs text-muted-foreground">Example: If a referred student pays ₦100,000 and rate is {n}%, referrer earns {naira((100000 * n) / 100)}</p>
        <Button type="submit" className="mt-4 h-12 w-full bg-brand text-base font-normal text-primary-foreground hover:bg-brand/90">Save Settings</Button>
      </form>
    </Card>
  );
}

function ReferrerDetail({ referrer, onBack }: { referrer: Referrer; onBack: () => void }) {
  const [code, setCode] = useState(referrer.code);
  const initials = referrer.name.replace("Dr. ", "").split(" ").map((p) => p[0]).join("").slice(0, 2);
  const link = `https://angt.hub/join/${code.toLowerCase()}`;
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="flex items-center gap-1 text-base text-heading hover:underline"><ArrowLeft className="size-4" /> Back</button>
        <Button className="h-11 px-4 font-normal" onClick={() => toast.success("Report exported")}><Download /> Export Report</Button>
      </div>
      <section className="rounded-lg bg-brand p-6 text-primary-foreground">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <span className="grid size-20 place-items-center rounded-full bg-background text-[28px] font-bold text-heading">{initials}</span>
            <div><p className="text-2xl font-bold">{referrer.name}</p><p className="text-base opacity-90">{referrer.type} • Member since 1/15/2024</p><p className="text-sm opacity-80">{referrer.email}</p></div>
          </div>
          <div className="text-right"><p className="text-sm opacity-80">Total Earnings</p><p className="text-[32px] font-bold leading-10">{referrer.earnings}</p></div>
        </div>
        <div className="mt-6 rounded-lg bg-background p-6 text-foreground">
          <div className="mb-3 flex items-center justify-between"><p className="text-lg font-semibold text-heading">Unique Referral Code</p>
            <button className="inline-flex items-center gap-1 text-sm font-medium" onClick={() => { const c = `${referrer.name.replace("Dr. ", "").split(" ")[0]!.toUpperCase()}${Math.floor(1000 + Math.random() * 9000)}`; setCode(c); toast.success("Referral code reset"); }}><RefreshCcw className="size-3.5" /> Reset Code</button>
          </div>
          <div className="flex items-center gap-3"><Input readOnly value={code} className="h-10 px-4 text-lg font-medium text-primary md:text-lg" />
            <button className="inline-flex items-center gap-1 px-2 text-base font-medium text-accent" onClick={() => { navigator.clipboard?.writeText(code); toast.success("Referral code copied"); }}><Copy className="size-4" /> Copy</button>
          </div>
          <p className="mt-3 flex items-center gap-1.5 text-sm text-muted-foreground"><Link2 className="size-4" />{link}</p>
        </div>
      </section>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Link Clicks" value="145" note="Total link visits" icon={<TrendingUp className="size-5 text-finance-blue" />} />
        <Stat label="Referrals" value={String(referrer.referrals)} note={`${referrer.paid} paid conversions`} icon={<Users className="size-5 text-finance-purple" />} />
        <Stat label="Conversion Rate" value="91.7%" note="Above platform avg" icon={<Award className="size-5 text-finance-positive" />} />
        <Stat label="Available Balance" value="₦198K" note="Ready for withdrawal" icon={<DollarSign className="size-5 text-finance-orange" />} />
      </div>
      <Card title="Referral Performance Over Time" divider={false}>
        <div className="h-[300px] px-6 py-4"><ResponsiveContainer width="100%" height="100%">
          <LineChart data={perf} margin={{ top: 8, right: 12, left: -20, bottom: 0 }}>
            <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" />
            <XAxis dataKey="m" tick={{ fontSize: 12, fill: "#64748b" }} />
            <YAxis domain={[0, 12]} ticks={[0, 3, 6, 9, 12]} tick={{ fontSize: 12, fill: "#64748b" }} />
            <Tooltip contentStyle={{ fontSize: 11, borderRadius: 6 }} />
            <Line dataKey="v" name="Referrals" type="monotone" stroke="#16a36a" strokeWidth={2} dot={{ r: 3, fill: "#ffffff" }} isAnimationActive={false} />
          </LineChart>
        </ResponsiveContainer></div>
      </Card>
      <div className="grid gap-6 md:grid-cols-3">
        <article className="rounded-lg border border-border bg-card p-6 shadow-card"><div className="flex justify-between"><p className="text-lg font-semibold text-heading">Available Balance</p><CheckCircle2 className="size-5 text-finance-positive" /></div><p className="mt-3 text-[28px] font-bold leading-9 text-finance-positive">₦198,000</p><p className="text-sm text-muted-foreground">Ready for withdrawal</p><Button className="mt-4 h-9 w-3/4 bg-finance-positive text-base font-normal hover:bg-finance-positive/90" onClick={() => toast.success("Withdrawal processed")}>Process Withdrawal</Button></article>
        <article className="rounded-lg border border-border bg-card p-6 shadow-card"><div className="flex justify-between"><p className="text-lg font-semibold text-heading">Pending Balance</p><Clock3 className="size-5 text-finance-orange" /></div><p className="mt-3 text-[28px] font-bold leading-9 text-finance-orange">₦132,000</p><p className="text-sm text-muted-foreground">In lock-in period</p><p className="mt-4 text-xs text-muted-foreground">Avg. 19 days until release</p></article>
        <article className="rounded-lg border border-border bg-card p-6 shadow-card"><div className="flex justify-between"><p className="text-lg font-semibold text-heading">Total Withdrawn</p><Download className="size-5 text-muted-foreground" /></div><p className="mt-3 text-[28px] font-bold leading-9 text-heading">₦99,000</p><p className="text-sm text-muted-foreground">2 transactions</p></article>
      </div>
      <Card title="Referral History (5)"><HistoryTable /></Card>
      <Card title="Withdrawal History (2)">
        <div className="space-y-3 p-6">
          {[["₦45,000", "2024-02-28 14:30"], ["₦54,000", "2024-03-15 10:20"]].map(([amt, d]) => (
            <div key={d} className="flex items-center gap-4 rounded-lg bg-table-head px-4 py-4">
              <span className="grid size-10 place-items-center rounded-full bg-finance-positive-soft"><Download className="size-5 text-finance-positive" /></span>
              <div className="flex-1"><p className="text-base font-semibold text-heading">{amt}</p><p className="text-sm text-muted-foreground">****5678 · {d}</p></div>
              <span className="rounded-full bg-finance-positive-soft px-3 py-1 text-sm font-medium text-finance-positive">Completed</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
