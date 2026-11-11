"use client";

import { useMemo, useState } from "react";
import { Check, Filter, Search } from "lucide-react";
import { toast } from "sonner";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/shadcn/popover";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/States";
import { cn } from "@/lib/cn";
import { usePayoutAction, usePayoutRequests, type PayoutAction } from "./api";
import {
  initialsOf,
  naira,
  payoutStatusLabel,
  statusLabel,
  type Ambassador,
  type AmbassadorStatus,
  type PayoutRequest,
  type PayoutStatus,
} from "./data";

const avatarTones = [
  "bg-purple-100 text-purple-700",
  "bg-emerald-100 text-emerald-700",
  "bg-orange-100 text-orange-700",
  "bg-blue-100 text-blue-700",
  "bg-pink-100 text-pink-700",
  "bg-indigo-100 text-indigo-700",
];

function Avatar({ name, index }: { name: string; index: number }) {
  return (
    <span aria-hidden="true" className={cn("grid size-8 shrink-0 place-items-center rounded-full text-[11px] font-semibold", avatarTones[index % avatarTones.length])}>
      {initialsOf(name)}
    </span>
  );
}

const statusTones: Record<AmbassadorStatus, string> = {
  active: "bg-success-soft text-green-700",
  "payout-due": "bg-warning-soft text-orange-700",
  inactive: "bg-slate-100 text-slate-500",
};

const payoutTones: Record<PayoutStatus, string> = {
  PendingOtp: "bg-slate-100 text-slate-600",
  Pending: "bg-warning-soft text-orange-700",
  Approved: "bg-blue-50 text-blue-700",
  Rejected: "bg-red-50 text-red-700",
  Disbursed: "bg-success-soft text-green-700",
};

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

// ---- Ambassadors (sample data) -------------------------------------------------

const PAGE = 6;

export function AmbassadorsTable({ ambassadors }: { ambassadors: Ambassador[] }) {
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
            { id: "active", label: "Active" },
            { id: "payout-due", label: "Payout due" },
            { id: "inactive", label: "Inactive" },
          ]}
        />
      </div>

      {rows.length === 0 ? (
        <div className="px-4 pb-6">
          <EmptyState title="No ambassadors match" description="Try another name, email or status." />
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[920px] border-collapse">
            <thead className="bg-slate-50">
              <tr>
                <th className={th}>Ambassador</th>
                <th className={th}>Students</th>
                <th className={th}>Student payments</th>
                <th className={th}>Commission earned</th>
                <th className={th}>Withdrawn</th>
                <th className={th}>Available</th>
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
                        <span className="truncate text-xs leading-4 text-primary">{a.email}</span>
                      </div>
                    </div>
                  </td>
                  <td className={td}>{a.students}</td>
                  <td className={td}>{naira(a.studentPayments)}</td>
                  <td className={td}>
                    <span className="flex flex-col">
                      <span className="font-semibold text-green-700">{naira(a.commission)}</span>
                      <span className="text-xs leading-4 text-slate-500">{a.rate}% rate</span>
                    </span>
                  </td>
                  <td className={td}>{naira(a.withdrawn)}</td>
                  <td className={td}>{naira(a.available)}</td>
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
        <Modal open size="md" onClose={() => setSelected(null)} title={selected.name} subtitle={selected.email}>
          <dl className="grid gap-3 sm:grid-cols-2">
            {[
              ["Status", statusLabel[selected.status]],
              ["Referral code", selected.referralCode],
              ["Students referred", String(selected.students)],
              ["Student payments", naira(selected.studentPayments)],
              ["Commission earned", `${naira(selected.commission)} (${selected.rate}% rate)`],
              ["Withdrawn", naira(selected.withdrawn)],
              ["Available to withdraw", naira(selected.available)],
              ["Joined", new Date(selected.joined).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })],
            ].map(([label, value]) => (
              <div key={label} className="rounded-lg bg-slate-50 p-3">
                <dt className="text-xs leading-4 text-slate-500">{label}</dt>
                <dd className="text-base leading-6 font-semibold text-slate-900">{value}</dd>
              </div>
            ))}
          </dl>
          <p className="rounded-lg bg-warning-soft p-3 text-sm leading-5 text-orange-800">
            Sample ambassador. Account actions arrive when the backend adds ambassador endpoints.
          </p>
        </Modal>
      )}
    </div>
  );
}

// ---- Payout requests (live) -----------------------------------------------------

const actionCopy: Record<PayoutAction, { title: string; button: string; done: string; noteLabel: string }> = {
  approve: { title: "Approve payout?", button: "Approve", done: "approved", noteLabel: "Note (optional)" },
  reject: { title: "Reject payout?", button: "Reject", done: "rejected", noteLabel: "Reason for the ambassador (optional)" },
  disburse: { title: "Mark as disbursed?", button: "Mark as disbursed", done: "marked as disbursed", noteLabel: "Transfer reference (optional)" },
};

/** Which actions a request in this status allows. */
const nextActions: Record<PayoutStatus, PayoutAction[]> = {
  PendingOtp: [],
  Pending: ["approve", "reject"],
  Approved: ["disburse", "reject"],
  Rejected: [],
  Disbursed: [],
};

export function PayoutRequestsTable() {
  const [status, setStatus] = useState<PayoutStatus | "all">("Pending");
  const [query, setQuery] = useState("");
  const list = usePayoutRequests(status);
  const act = usePayoutAction();
  const [pending, setPending] = useState<{ request: PayoutRequest; action: PayoutAction } | null>(null);
  const [note, setNote] = useState("");

  const items = list.data?.pages.flatMap((p) => p.items) ?? [];
  const q = query.trim().toLowerCase();
  const rows = q ? items.filter((r) => `${r.name} ${r.email} ${r.bank} ${r.accountName}`.toLowerCase().includes(q)) : items;

  const close = () => {
    setPending(null);
    setNote("");
  };
  const confirm = () => {
    if (!pending) return;
    const { request, action } = pending;
    act.mutate(
      { id: request.id, action, note },
      {
        onSuccess: () => {
          toast.success(`${request.name}'s payout of ${request.amount} was ${actionCopy[action].done}`);
          close();
        },
        onError: (e) => toast.error(e instanceof Error && e.message ? e.message : "Something went wrong. Please try again."),
      },
    );
  };

  return (
    <div className="flex flex-col">
      <div className="flex flex-col gap-3 p-4 sm:flex-row">
        <SearchBox value={query} onChange={setQuery} placeholder="Search payout requests..." label="Search payout requests" />
        <FilterMenu
          value={status}
          onChange={setStatus}
          options={[
            { id: "Pending", label: "Pending review" },
            { id: "Approved", label: "Approved" },
            { id: "Disbursed", label: "Disbursed" },
            { id: "Rejected", label: "Rejected" },
            { id: "PendingOtp", label: "Awaiting OTP" },
            { id: "all", label: "All" },
          ]}
        />
      </div>

      {list.isPending ? (
        <div className="px-4 pb-6">
          <LoadingState variant="block" label="Loading payout requests…" />
        </div>
      ) : list.isError && !list.data ? (
        <div className="px-4 pb-6">
          <ErrorState error={list.error} title="Couldn't load payout requests" onRetry={() => void list.refetch()} retrying={list.isFetching} />
        </div>
      ) : rows.length === 0 ? (
        <div className="px-4 pb-6">
          <EmptyState title="No payout requests" description={q ? "Try another name or bank." : "Withdrawal requests from ambassadors appear here."} />
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] border-collapse">
            <thead className="bg-slate-50">
              <tr>
                <th className={th}>Ambassador</th>
                <th className={th}>Amount</th>
                <th className={th}>Bank account</th>
                <th className={th}>Requested</th>
                <th className={th}>Status</th>
                <th className={th}>
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={r.id} className="border-t border-slate-100">
                  <td className={td}>
                    <div className="flex items-center gap-3">
                      <Avatar name={r.name} index={i} />
                      <div className="flex min-w-0 flex-col">
                        <span className="font-medium">{r.name}</span>
                        {r.email && <span className="truncate text-xs leading-4 text-primary">{r.email}</span>}
                      </div>
                    </div>
                  </td>
                  <td className={cn(td, "font-semibold")}>{r.amount}</td>
                  <td className={td}>
                    <span className="flex flex-col">
                      <span>{r.bank}</span>
                      <span className="text-xs leading-4 text-slate-500">
                        {r.accountName ? `${r.accountName} · ` : ""}
                        {r.account}
                      </span>
                    </span>
                  </td>
                  <td className={td}>{new Date(r.requestedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</td>
                  <td className={td}>
                    <span className={cn("rounded-full px-2.5 py-0.5 text-xs leading-4 font-medium", payoutTones[r.status])}>{payoutStatusLabel[r.status]}</span>
                  </td>
                  <td className={cn(td, "text-right")}>
                    <div className="flex justify-end gap-3">
                      {nextActions[r.status].map((action) => (
                        <button
                          key={action}
                          type="button"
                          onClick={() => setPending({ request: r, action })}
                          disabled={act.isPending}
                          className={cn("text-sm font-medium hover:underline disabled:opacity-50", action === "reject" ? "text-red-600" : "text-primary")}
                        >
                          {actionCopy[action].button}
                          <span className="sr-only"> payout for {r.name}</span>
                        </button>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {list.hasNextPage && (
        <div className="flex justify-center border-t border-slate-100 py-3">
          <Button variant="outline" className="px-5" onClick={() => void list.fetchNextPage()} disabled={list.isFetchingNextPage}>
            {list.isFetchingNextPage ? "Loading…" : "Load more"}
          </Button>
        </div>
      )}

      {pending && (
        <Modal
          open
          size="sm"
          onClose={close}
          title={actionCopy[pending.action].title}
          subtitle={`${pending.request.name} · ${pending.request.amount}`}
          footer={
            <div className="flex justify-end gap-2">
              <Button variant="outline" className="px-5" onClick={close} disabled={act.isPending}>
                Cancel
              </Button>
              <Button variant="primary" className="px-4" onClick={confirm} disabled={act.isPending}>
                {act.isPending ? "Saving…" : actionCopy[pending.action].button}
              </Button>
            </div>
          }
        >
          <p className="text-sm leading-5 text-slate-700">
            {pending.request.bank} · {pending.request.accountName} {pending.request.account}
          </p>
          <label className="flex flex-col gap-2 text-sm leading-5 font-medium text-slate-700">
            {actionCopy[pending.action].noteLabel}
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              maxLength={500}
              className="rounded-lg border border-slate-300 p-3 text-base font-normal focus:border-accent focus:outline-none"
            />
          </label>
        </Modal>
      )}
    </div>
  );
}
