"use client";

import { useEffect, useRef, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { ArrowRight, Check, ChevronLeft, Copy, FileText, Mail, MoreHorizontal, X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/cn";
import { useStudentProfile } from "./api";
import { requestedLabel } from "./PayoutRequests";
import { initialsOf, naira, statusLabel, type Ambassador, type AmbassadorStatus, type PayoutRequest } from "./data";

const statusTones: Record<AmbassadorStatus, string> = {
  "payout-due": "bg-warning-soft text-orange-700",
  approved: "bg-blue-50 text-blue-700",
  paid: "bg-success-soft text-green-700",
};

const payoutTones: Record<PayoutRequest["status"], string> = {
  PendingOtp: "bg-slate-100 text-slate-600",
  Pending: "bg-warning-soft text-orange-700",
  Approved: "bg-blue-50 text-blue-700",
  Rejected: "bg-red-50 text-red-700",
  Disbursed: "bg-success-soft text-green-700",
};

const payoutLabel: Record<PayoutRequest["status"], string> = {
  PendingOtp: "Awaiting OTP",
  Pending: "Awaiting review",
  Approved: "Approved",
  Rejected: "Rejected",
  Disbursed: "Paid",
};

const longDate = (iso: string) => new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
const joinedDate = (iso: string) => new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex min-w-0 flex-col gap-0.5">
      <dt className="text-[11px] leading-4 text-slate-500">{label}</dt>
      <dd className="truncate text-sm leading-5 font-semibold text-slate-900">{value}</dd>
    </div>
  );
}

/** The "…" menu: email, copy email, jump to their payouts. */
function MoreMenu({ email, canReview, onReview }: { email: string; canReview: boolean; onReview: () => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);
  const item = "flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-slate-900 hover:bg-slate-50";
  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-label="More actions"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="grid size-9 place-items-center rounded-lg border border-gray-200 text-slate-700 hover:bg-slate-50"
      >
        <MoreHorizontal aria-hidden className="size-4" />
      </button>
      {open && (
        <div role="menu" className="absolute top-10 right-0 z-10 w-52 rounded-lg border border-gray-200 bg-white p-1 shadow-lg">
          {email && (
            <>
              <a role="menuitem" href={`mailto:${email}`} className={item} onClick={() => setOpen(false)}>
                <Mail aria-hidden className="size-4 text-slate-500" /> Email ambassador
              </a>
              <button
                type="button"
                role="menuitem"
                className={item}
                onClick={() => {
                  void navigator.clipboard?.writeText(email).then(() => toast.success("Email copied"), () => toast.error("Couldn't copy the email"));
                  setOpen(false);
                }}
              >
                <Copy aria-hidden className="size-4 text-slate-500" /> Copy email
              </button>
            </>
          )}
          <button
            type="button"
            role="menuitem"
            disabled={!canReview}
            className={cn(item, "disabled:cursor-not-allowed disabled:text-slate-400")}
            onClick={() => {
              setOpen(false);
              onReview();
            }}
          >
            <ArrowRight aria-hidden className="size-4 text-slate-500" /> Review their payouts
          </button>
        </div>
      )}
    </div>
  );
}

type Props = {
  ambassador: Ambassador;
  /** This person's payout records, newest first. */
  history: PayoutRequest[];
  onClose: () => void;
  onReviewPayouts: () => void;
};

/**
 * Manage panel (from the "Ambassador Referral Admin Dashboard" design): a
 * right-side sheet with the person, their payout figures, bank details from
 * their latest payout and their payout history. Profile details come from
 * GET /students/admin/:studentId when they have a student account.
 */
export function AmbassadorPanel({ ambassador: a, history, onClose, onReviewPayouts }: Props) {
  const profile = useStudentProfile(a.studentId);
  const p = profile.data;
  const name = p?.fullName || a.name;
  const email = p?.email || a.email;
  const latest = history[0];
  const [showAll, setShowAll] = useState(false);
  const visible = showAll ? history : history.slice(0, 4);

  const meta = [email, p?.joinedAt ? `Joined ${joinedDate(p.joinedAt)}` : null].filter(Boolean).join(" · ");
  const figures = [
    { label: "Requests", value: String(a.requests) },
    { label: "Requested", value: naira(a.requested) },
    { label: "Paid out", value: naira(a.paidOut) },
    { label: "Outstanding", value: naira(a.outstanding), highlight: true },
  ];

  return (
    <Dialog.Root open onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-slate-900/20 backdrop-blur-sm" />
        <Dialog.Content
          aria-describedby={undefined}
          className="fixed inset-y-0 right-0 z-50 flex w-full max-w-[460px] flex-col overflow-y-auto bg-slate-50 shadow-2xl focus:outline-none"
        >
          <div className="flex items-center justify-between border-b border-gray-200 bg-white px-5 py-3.5">
            <Dialog.Close className="flex items-center gap-1 rounded text-xs font-medium text-slate-700 hover:text-primary">
              <ChevronLeft aria-hidden className="size-4" />
              Back to ambassadors
            </Dialog.Close>
            <Dialog.Close aria-label="Close" className="grid size-8 place-items-center rounded-lg border border-gray-200 text-slate-700 hover:bg-slate-50">
              <X aria-hidden className="size-4" />
            </Dialog.Close>
          </div>

          <div className="flex flex-col gap-4 p-5">
            {/* Person */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <span aria-hidden="true" className="grid size-12 shrink-0 place-items-center rounded-full bg-primary-soft text-sm font-semibold text-accent">
                  {initialsOf(name)}
                </span>
                <div className="flex min-w-0 flex-col gap-0.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <Dialog.Title className="text-lg leading-7 font-semibold text-slate-900">{name}</Dialog.Title>
                    <span className={cn("rounded-full px-2 py-0.5 text-[11px] leading-4 font-medium", statusTones[a.status])}>{statusLabel[a.status]}</span>
                    {p?.accountLabel && p.accountLabel !== "Active" && (
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] leading-4 font-medium text-slate-600">Account {p.accountLabel}</span>
                    )}
                  </div>
                  <p className="truncate text-xs leading-4 text-slate-500">{profile.isPending && a.studentId ? "Loading profile…" : meta}</p>
                </div>
              </div>
              <MoreMenu email={email} canReview={a.outstanding > 0} onReview={onReviewPayouts} />
            </div>

            {/* Figures */}
            <dl className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {figures.map((f) => (
                <div key={f.label} className={cn("flex flex-col gap-1 rounded-lg border bg-white p-3", f.highlight ? "border-green-200 bg-success-soft" : "border-gray-200")}>
                  <dt className="text-[11px] leading-4 text-slate-500">{f.label}</dt>
                  <dd className={cn("text-sm leading-5 font-semibold", f.highlight ? "text-green-700" : "text-slate-900")}>{f.value}</dd>
                </div>
              ))}
            </dl>

            {/* Bank details */}
            {latest && (
              <section aria-label="Bank details" className="flex flex-col gap-3 rounded-lg border border-gray-200 bg-white p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex flex-col gap-0.5">
                    <h3 className="text-sm leading-5 font-semibold text-slate-900">Bank details &amp; evidence</h3>
                    <p className="text-xs leading-4 text-slate-500">From their latest payout request, {longDate(latest.requestedAt)}</p>
                  </div>
                  <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] leading-4 font-medium", payoutTones[latest.status])}>
                    {latest.status === "Disbursed" && <Check aria-hidden className="size-3" />}
                    {payoutLabel[latest.status]}
                  </span>
                </div>
                <dl className="grid grid-cols-2 gap-x-4 gap-y-3 rounded-lg bg-slate-50 p-3">
                  <Field label="Bank name" value={latest.bank} />
                  <Field label="Account number" value={latest.account.replace("••••", "•••• ••••")} />
                  <Field label="Account name" value={latest.accountName || "-"} />
                  <Field label="Bank code" value={latest.bankCode || "-"} />
                </dl>
                {latest.note ? (
                  <div className="flex items-start gap-3 rounded-lg border border-gray-200 p-3">
                    <span aria-hidden="true" className="grid size-8 shrink-0 place-items-center rounded-md bg-orange-50 text-orange-600">
                      <FileText className="size-4" />
                    </span>
                    <div className="flex min-w-0 flex-col">
                      <span className="text-xs leading-4 font-semibold text-slate-900">Note from the ambassador</span>
                      <span className="text-xs leading-4 break-words text-slate-600">{latest.note}</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs leading-4 text-slate-500">No supporting document or note was sent with this payout.</p>
                )}
                {latest.reviewNote && <p className="text-xs leading-4 text-slate-600">Review note: {latest.reviewNote}</p>}
              </section>
            )}

            {/* Payout history */}
            <section aria-label="Payout history" className="flex flex-col rounded-lg border border-gray-200 bg-white">
              <div className="flex items-start justify-between gap-2 p-4">
                <div className="flex flex-col gap-0.5">
                  <h3 className="text-sm leading-5 font-semibold text-slate-900">Payout history</h3>
                  <p className="text-xs leading-4 text-slate-500">Every withdrawal of their referral earnings</p>
                </div>
                <span className="text-xs leading-4 font-semibold text-slate-900">{history.length} total</span>
              </div>
              <ul className="flex flex-col">
                {visible.map((h) => (
                  <li key={h.id} className="flex items-center gap-3 border-t border-slate-100 px-4 py-3">
                    <span aria-hidden="true" className="grid size-8 shrink-0 place-items-center rounded-full bg-slate-100 text-slate-600">
                      <FileText className="size-3.5" />
                    </span>
                    <div className="flex min-w-0 flex-1 flex-col">
                      <span className="truncate text-xs leading-4 font-semibold text-slate-900">
                        {h.bank} {h.account.replace("•••• ", "•• ")}
                      </span>
                      <span className="text-[11px] leading-4 text-slate-500">{requestedLabel(h.requestedAt)}</span>
                    </div>
                    <div className="flex flex-col items-end gap-0.5">
                      <span className={cn("text-sm leading-5 font-semibold", h.status === "Disbursed" ? "text-green-700" : h.status === "Rejected" ? "text-slate-400 line-through" : "text-slate-900")}>
                        {h.amount}
                      </span>
                      <span className={cn("rounded-full px-1.5 text-[10px] leading-4 font-medium", payoutTones[h.status])}>{payoutLabel[h.status]}</span>
                    </div>
                  </li>
                ))}
              </ul>
              {history.length > 4 && (
                <button type="button" onClick={() => setShowAll((s) => !s)} className="border-t border-slate-100 py-3 text-xs font-semibold text-primary hover:underline">
                  {showAll ? "Show fewer" : `View all ${history.length} payouts`}
                </button>
              )}
            </section>
            {profile.isError && <p className="text-xs leading-4 text-slate-500">Couldn&apos;t load their account details; showing what their payouts include.</p>}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
