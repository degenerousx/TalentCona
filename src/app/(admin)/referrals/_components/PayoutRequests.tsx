"use client";

import { useState } from "react";
import { Check, FileText, Send } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/States";
import { usePayoutAction, usePayoutRequests, type PayoutAction } from "./api";
import { initialsOf, naira, type PayoutRequest } from "./data";

/** "Today, 9:42 AM" · "Yesterday, 4:18 PM" · "23 May, 11:07 AM" */
export function requestedLabel(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const time = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  const today = new Date();
  const yesterday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return `Today, ${time}`;
  if (d.toDateString() === yesterday.toDateString()) return `Yesterday, ${time}`;
  return `${d.toLocaleDateString("en-GB", { day: "numeric", month: "short" })}, ${time}`;
}

const errorMessage = (e: unknown) => (e instanceof Error && e.message ? e.message : "Something went wrong. Please try again.");

const done: Record<PayoutAction, string> = { approve: "approved", reject: "rejected", disburse: "marked as disbursed" };

/** One payout as a bordered row card: who, amount, receiving account, actions. */
function PayoutCard({ request, children }: { request: PayoutRequest; children: React.ReactNode }) {
  return (
    <li className="grid items-center gap-4 rounded-lg border border-gray-200 bg-white p-4 md:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_minmax(0,1.3fr)_17.5rem]">
      <div className="flex min-w-0 items-center gap-3">
        <span aria-hidden="true" className="grid size-9 shrink-0 place-items-center rounded-full bg-primary-soft text-xs font-semibold text-accent">
          {initialsOf(request.name)}
        </span>
        <div className="flex min-w-0 flex-col">
          <span className="truncate text-sm leading-5 font-semibold text-slate-900">{request.name}</span>
          <span className="text-xs leading-4 text-slate-500">{requestedLabel(request.requestedAt)}</span>
        </div>
      </div>
      <div className="flex flex-col">
        <span className="text-[11px] leading-4 text-slate-500">Payout amount</span>
        <span className="text-base leading-6 font-semibold text-slate-900">{request.amount}</span>
      </div>
      <div className="flex min-w-0 flex-col">
        <span className="text-[11px] leading-4 text-slate-500">Receiving account</span>
        <span className="truncate text-sm leading-5 font-semibold text-slate-900">
          {request.bank} {request.account.replace("•••• ", "•• ")}
        </span>
      </div>
      <div className="flex flex-wrap gap-2 md:justify-end">{children}</div>
    </li>
  );
}

function Section({
  title,
  description,
  total,
  children,
}: {
  title: string;
  description: string;
  total?: string;
  children: React.ReactNode;
}) {
  return (
    <section aria-label={title} className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div className="flex flex-col gap-0.5">
          <h3 className="text-sm leading-5 font-semibold text-slate-900">{title}</h3>
          <p className="text-xs leading-4 text-slate-500">{description}</p>
        </div>
        {total && <p className="text-xs leading-4 font-medium text-slate-500">{total} total</p>}
      </div>
      {children}
    </section>
  );
}

const outlineBtn = "flex h-9 items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 text-xs font-semibold text-slate-900 hover:bg-slate-50 disabled:opacity-50";
const primaryBtn = "flex h-9 items-center gap-1.5 rounded-lg bg-primary px-3.5 text-xs font-semibold text-white hover:bg-primary/90 disabled:opacity-50";

/**
 * Payout requests (live, /withdrawals/admin). "Awaiting review" lists pending
 * requests with View evidence (bank details + Approve / Reject) and Approve;
 * approved ones wait below to be marked as disbursed once the transfer is made.
 */
export function PayoutRequests() {
  const pending = usePayoutRequests("Pending");
  const approved = usePayoutRequests("Approved");
  const act = usePayoutAction();
  const [evidence, setEvidence] = useState<PayoutRequest | null>(null);
  const [confirm, setConfirm] = useState<{ request: PayoutRequest; action: PayoutAction } | null>(null);
  const [note, setNote] = useState("");

  const pendingItems = pending.data?.pages.flatMap((p) => p.items) ?? [];
  const approvedItems = approved.data?.pages.flatMap((p) => p.items) ?? [];
  const pendingTotal = pendingItems.reduce((sum, r) => sum + r.amountValue, 0);

  const run = (request: PayoutRequest, action: PayoutAction, withNote?: string, after?: () => void) =>
    act.mutate(
      { id: request.id, action, note: withNote },
      {
        onSuccess: () => {
          toast.success(`${request.name}'s payout of ${request.amount} was ${done[action]}`);
          after?.();
        },
        onError: (e) => toast.error(errorMessage(e)),
      },
    );

  const busy = (id: string) => act.isPending && act.variables?.id === id;
  const closeConfirm = () => {
    setConfirm(null);
    setNote("");
  };

  return (
    <div className="flex flex-col gap-8 p-4 sm:p-5">
      <Section title="Awaiting review" description="Verify bank evidence before approving each payout." total={pending.isSuccess ? naira(pendingTotal) : undefined}>
        {pending.isPending ? (
          <LoadingState variant="block" label="Loading payout requests…" />
        ) : pending.isError && !pending.data ? (
          <ErrorState error={pending.error} title="Couldn't load payout requests" onRetry={() => void pending.refetch()} retrying={pending.isFetching} />
        ) : pendingItems.length === 0 ? (
          <EmptyState title="No payouts awaiting review" description="New withdrawal requests from ambassadors appear here." />
        ) : (
          <ul className="flex flex-col gap-3">
            {pendingItems.map((r) => (
              <PayoutCard key={r.id} request={r}>
                <button type="button" className={outlineBtn} onClick={() => setEvidence(r)}>
                  <FileText aria-hidden className="size-3.5" />
                  View evidence<span className="sr-only"> for {r.name}</span>
                </button>
                <button type="button" className={primaryBtn} disabled={busy(r.id)} onClick={() => run(r, "approve")}>
                  <Check aria-hidden className="size-3.5" strokeWidth={2.5} />
                  {busy(r.id) ? "Approving…" : "Approve"}
                  <span className="sr-only"> payout for {r.name}</span>
                </button>
              </PayoutCard>
            ))}
          </ul>
        )}
        {pending.hasNextPage && (
          <Button variant="outline" className="self-center px-5" onClick={() => void pending.fetchNextPage()} disabled={pending.isFetchingNextPage}>
            {pending.isFetchingNextPage ? "Loading…" : "Load more"}
          </Button>
        )}
      </Section>

      {approvedItems.length > 0 && (
        <Section
          title="Approved — awaiting transfer"
          description="Mark each payout as disbursed once the money has been sent."
          total={naira(approvedItems.reduce((sum, r) => sum + r.amountValue, 0))}
        >
          <ul className="flex flex-col gap-3">
            {approvedItems.map((r) => (
              <PayoutCard key={r.id} request={r}>
                <button type="button" className={outlineBtn} onClick={() => setEvidence(r)}>
                  <FileText aria-hidden className="size-3.5" />
                  View evidence<span className="sr-only"> for {r.name}</span>
                </button>
                <button type="button" className={primaryBtn} disabled={busy(r.id)} onClick={() => setConfirm({ request: r, action: "disburse" })}>
                  <Send aria-hidden className="size-3.5" />
                  Mark as disbursed<span className="sr-only"> payout for {r.name}</span>
                </button>
              </PayoutCard>
            ))}
          </ul>
        </Section>
      )}

      {evidence && (
        <Modal
          open
          size="sm"
          onClose={() => setEvidence(null)}
          title="Payout evidence"
          subtitle={`${evidence.name} · ${evidence.amount}`}
          footer={
            evidence.status === "Pending" || evidence.status === "Approved" ? (
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  className="h-10 rounded-lg border border-red-200 px-4 text-sm font-semibold text-red-600 hover:bg-red-50"
                  onClick={() => {
                    setConfirm({ request: evidence, action: "reject" });
                    setEvidence(null);
                  }}
                >
                  Reject
                </button>
                {evidence.status === "Pending" && (
                  <button
                    type="button"
                    className="flex h-10 items-center gap-1.5 rounded-lg bg-primary px-4 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-50"
                    disabled={busy(evidence.id)}
                    onClick={() => run(evidence, "approve", undefined, () => setEvidence(null))}
                  >
                    <Check aria-hidden className="size-4" strokeWidth={2.5} />
                    Approve
                  </button>
                )}
              </div>
            ) : undefined
          }
        >
          <dl className="grid gap-3 sm:grid-cols-2">
            {[
              ["Bank", evidence.bank],
              ["Account name", evidence.accountName || "-"],
              ["Account number", evidence.account],
              ["Amount", evidence.amount],
              ["Requested", requestedLabel(evidence.requestedAt)],
              ["Email", evidence.email || "-"],
            ].map(([label, value]) => (
              <div key={label} className="rounded-lg bg-slate-50 p-3">
                <dt className="text-xs leading-4 text-slate-500">{label}</dt>
                <dd className="text-sm leading-5 font-semibold break-words text-slate-900">{value}</dd>
              </div>
            ))}
          </dl>
          {evidence.note && (
            <p className="rounded-lg bg-slate-50 p-3 text-sm leading-5 text-slate-700">
              <span className="font-semibold">Ambassador&apos;s note:</span> {evidence.note}
            </p>
          )}
          <p className="text-xs leading-4 text-slate-500">
            Check that the account name matches the ambassador before approving. The account number is masked here.
          </p>
        </Modal>
      )}

      {confirm && (
        <Modal
          open
          size="sm"
          onClose={closeConfirm}
          title={confirm.action === "reject" ? "Reject payout?" : "Mark as disbursed?"}
          subtitle={`${confirm.request.name} · ${confirm.request.amount}`}
          footer={
            <div className="flex justify-end gap-2">
              <Button variant="outline" className="px-5" onClick={closeConfirm} disabled={act.isPending}>
                Cancel
              </Button>
              <Button variant="primary" className="px-4" disabled={act.isPending} onClick={() => run(confirm.request, confirm.action, note, closeConfirm)}>
                {act.isPending ? "Saving…" : confirm.action === "reject" ? "Reject payout" : "Mark as disbursed"}
              </Button>
            </div>
          }
        >
          <label className="flex flex-col gap-2 text-sm leading-5 font-medium text-slate-700">
            {confirm.action === "reject" ? "Reason for the ambassador (optional)" : "Transfer reference (optional)"}
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
