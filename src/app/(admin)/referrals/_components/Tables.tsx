"use client";

import { useMemo, useState } from "react";
import { Check, Filter, Search } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/shadcn/popover";
import { Modal } from "@/components/ui/Modal";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/States";
import { cn } from "@/lib/cn";
import { initialsOf, naira, statusLabel, type Ambassador, type AmbassadorStatus, type PayoutRequest } from "./data";

const avatarTones = [
  "bg-purple-100 text-purple-700",
  "bg-emerald-100 text-emerald-700",
  "bg-orange-100 text-orange-700",
  "bg-blue-100 text-blue-700",
  "bg-pink-100 text-pink-700",
  "bg-indigo-100 text-indigo-700",
];

export function Avatar({ name, index }: { name: string; index: number }) {
  return (
    <span aria-hidden="true" className={cn("grid size-8 shrink-0 place-items-center rounded-full text-[11px] font-semibold", avatarTones[index % avatarTones.length])}>
      {initialsOf(name)}
    </span>
  );
}

const statusTones: Record<AmbassadorStatus, string> = {
  "payout-due": "bg-warning-soft text-orange-700",
  approved: "bg-blue-50 text-blue-700",
  paid: "bg-success-soft text-green-700",
};

const payoutLabel: Record<PayoutRequest["status"], string> = {
  PendingOtp: "Awaiting OTP",
  Pending: "Awaiting review",
  Approved: "Approved",
  Rejected: "Rejected",
  Disbursed: "Paid",
};

const shortDate = (iso: string) => new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

const th = "px-4 py-3 text-left text-[11px] leading-4 font-semibold tracking-wide text-slate-500 uppercase";
const td = "px-4 py-3.5 text-sm leading-5 text-slate-900";

function SearchBox({ value, onChange, placeholder, label }: { value: string; onChange: (v: string) => void; placeholder: string; label: string }) {
  return (
    <label className="relative flex-1">
      <span className="sr-only">{label}</span>
      <Search aria-hidden className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-10 w-full rounded-lg border border-gray-200 bg-white pr-3 pl-9 text-sm text-slate-900 placeholder:text-slate-400 focus:border-accent focus:outline-none"
      />
    </label>
  );
}

function FilterMenu<T extends string>({ value, options, onChange }: { value: T; options: { id: T; label: string }[]; onChange: (v: T) => void }) {
  const [open, setOpen] = useState(false);
  const active = options.find((o) => o.id === value);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="flex h-10 shrink-0 items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 text-sm font-medium text-slate-900 hover:bg-slate-50"
        >
          <Filter aria-hidden className="size-4" />
          Filters
          {active && options[0].id !== value && <span className="rounded-full bg-primary-soft px-2 text-xs text-primary">{active.label}</span>}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-52 p-1">
        <ul role="listbox" aria-label="Status filter">
          {options.map((o) => (
            <li key={o.id}>
              <button
                type="button"
                role="option"
                aria-selected={o.id === value}
                onClick={() => {
                  onChange(o.id);
                  setOpen(false);
                }}
                className="flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm text-slate-900 hover:bg-slate-50"
              >
                {o.label}
                {o.id === value && <Check aria-hidden className="size-4 text-primary" />}
              </button>
            </li>
          ))}
        </ul>
      </PopoverContent>
    </Popover>
  );
}

// ---- Ambassadors (from payout records) -------------------------------------------

const PAGE = 6;

type AmbassadorsTableProps = {
  ambassadors: Ambassador[];
  payouts: PayoutRequest[];
  loading: boolean;
  error: unknown;
  onRetry: () => void;
  retrying: boolean;
};

/** Everyone who has requested a payout, with their totals; Manage shows their payout history. */
export function AmbassadorsTable({ ambassadors, payouts, loading, error, onRetry, retrying }: AmbassadorsTableProps) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"all" | AmbassadorStatus>("all");
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<Ambassador | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return ambassadors.filter((a) => (status === "all" || a.status === status) && (!q || `${a.name} ${a.email}`.toLowerCase().includes(q)));
  }, [ambassadors, query, status]);
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE));
  const current = Math.min(page, pages - 1);
  const rows = filtered.slice(current * PAGE, current * PAGE + PAGE);
  const history = selected ? payouts.filter((p) => p.payeeId === selected.id).sort((a, b) => b.requestedAt.localeCompare(a.requestedAt)) : [];

  return (
    <div className="flex flex-col">
      <div className="flex flex-col gap-3 p-4 sm:flex-row">
        <SearchBox
          value={query}
          onChange={(v) => {
            setQuery(v);
            setPage(0);
          }}
          placeholder="Search ambassadors..."
          label="Search ambassadors"
        />
        <FilterMenu
          value={status}
          onChange={(v) => {
            setStatus(v);
            setPage(0);
          }}
          options={[
            { id: "all", label: "All statuses" },
            { id: "payout-due", label: "Payout due" },
            { id: "approved", label: "Awaiting transfer" },
            { id: "paid", label: "Nothing due" },
          ]}
        />
      </div>

      {loading ? (
        <div className="px-4 pb-6">
          <LoadingState variant="block" label="Loading ambassadors…" />
        </div>
      ) : error ? (
        <div className="px-4 pb-6">
          <ErrorState error={error} title="Couldn't load ambassadors" onRetry={onRetry} retrying={retrying} />
        </div>
      ) : rows.length === 0 ? (
        <div className="px-4 pb-6">
          <EmptyState
            title={ambassadors.length ? "No ambassadors match" : "No ambassadors yet"}
            description={ambassadors.length ? "Try another name, email or status." : "Ambassadors appear here once they request a payout of their referral earnings."}
          />
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] border-collapse">
            <thead className="bg-slate-50">
              <tr>
                <th className={th}>Ambassador</th>
                <th className={th}>Requests</th>
                <th className={th}>Requested</th>
                <th className={th}>Paid out</th>
                <th className={th}>Outstanding</th>
                <th className={th}>Last request</th>
                <th className={th}>Status</th>
                <th className={th}>
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((a, i) => (
                <tr key={a.id} className="border-t border-slate-100">
                  <td className={td}>
                    <div className="flex items-center gap-3">
                      <Avatar name={a.name} index={current * PAGE + i} />
                      <div className="flex min-w-0 flex-col">
                        <span className="font-medium">{a.name}</span>
                        {a.email && <span className="truncate text-xs leading-4 text-primary">{a.email}</span>}
                      </div>
                    </div>
                  </td>
                  <td className={td}>{a.requests}</td>
                  <td className={td}>{naira(a.requested)}</td>
                  <td className={cn(td, "font-semibold text-green-700")}>{naira(a.paidOut)}</td>
                  <td className={td}>{naira(a.outstanding)}</td>
                  <td className={td}>{shortDate(a.lastRequest)}</td>
                  <td className={td}>
                    <span className={cn("rounded-full px-2.5 py-0.5 text-xs leading-4 font-medium", statusTones[a.status])}>{statusLabel[a.status]}</span>
                  </td>
                  <td className={cn(td, "text-right")}>
                    <button type="button" onClick={() => setSelected(a)} className="text-sm font-medium text-primary hover:underline">
                      Manage<span className="sr-only"> {a.name}</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-4 py-3">
        <p className="text-xs leading-4 text-slate-500">
          Showing {filtered.length ? current * PAGE + 1 : 0}–{current * PAGE + rows.length} of {filtered.length} ambassadors
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            disabled={current === 0}
            onClick={() => setPage(current - 1)}
            className="h-8 rounded-lg border border-gray-200 px-3 text-xs font-medium text-slate-900 disabled:text-slate-400"
          >
            Previous
          </button>
          <button
            type="button"
            disabled={current >= pages - 1}
            onClick={() => setPage(current + 1)}
            className="h-8 rounded-lg border border-gray-200 px-3 text-xs font-semibold text-slate-900 disabled:font-medium disabled:text-slate-400"
          >
            Next
          </button>
        </div>
      </div>

      {selected && (
        <Modal open size="md" onClose={() => setSelected(null)} title={selected.name} subtitle={selected.email || undefined}>
          <dl className="grid gap-3 sm:grid-cols-3">
            {[
              ["Paid out", naira(selected.paidOut)],
              ["Outstanding", naira(selected.outstanding)],
              ["Requests", String(selected.requests)],
            ].map(([label, value]) => (
              <div key={label} className="rounded-lg bg-slate-50 p-3">
                <dt className="text-xs leading-4 text-slate-500">{label}</dt>
                <dd className="text-base leading-6 font-semibold text-slate-900">{value}</dd>
              </div>
            ))}
          </dl>
          <section aria-label="Payout history" className="flex flex-col gap-2">
            <h3 className="text-sm leading-5 font-semibold text-slate-900">Payout history</h3>
            <ul className="flex flex-col divide-y divide-slate-100 rounded-lg border border-slate-100">
              {history.map((h) => (
                <li key={h.id} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2.5 text-sm leading-5">
                  <span className="flex flex-col">
                    <span className="font-semibold text-slate-900">{h.amount}</span>
                    <span className="text-xs leading-4 text-slate-500">
                      {shortDate(h.requestedAt)} · {h.bank} {h.account}
                    </span>
                  </span>
                  <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs leading-4 font-medium text-slate-700">{payoutLabel[h.status]}</span>
                </li>
              ))}
            </ul>
          </section>
          <p className="text-xs leading-4 text-slate-500">Approve, reject or mark payouts as sent in the Payout requests tab.</p>
        </Modal>
      )}
    </div>
  );
}
