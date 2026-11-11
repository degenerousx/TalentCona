/**
 * Referrals types and the calculations that turn payout records (the only
 * admin referral data the backend offers) into the page's numbers. No sample
 * data.
 */

export type PayoutStatus = "PendingOtp" | "Pending" | "Approved" | "Rejected" | "Disbursed";

export type PayoutRequest = {
  id: string;
  /** Who asked for the payout (user id when the backend sends it). */
  payeeId: string;
  name: string;
  email: string;
  /** Formatted, e.g. "₦50,000". */
  amount: string;
  /** Naira (major units). */
  amountValue: number;
  bank: string;
  accountName: string;
  /** Masked, e.g. "•••• 4375". */
  account: string;
  status: PayoutStatus;
  note: string;
  reviewNote: string;
  requestedAt: string;
  disbursedAt: string | null;
};

export type AmbassadorStatus = "payout-due" | "approved" | "paid";

/** One person, from all their payout requests. */
export type Ambassador = {
  id: string;
  name: string;
  email: string;
  requests: number;
  /** Naira: everything requested except rejected requests. */
  requested: number;
  paidOut: number;
  /** Pending review + approved but not yet sent. */
  outstanding: number;
  lastRequest: string;
  status: AmbassadorStatus;
};

export const statusLabel: Record<AmbassadorStatus, string> = {
  "payout-due": "Payout due",
  approved: "Awaiting transfer",
  paid: "Nothing due",
};

export const naira = (value: number) => `₦${Math.round(value).toLocaleString("en-NG")}`;

export function initialsOf(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  return (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase();
}

const sum = (list: PayoutRequest[]) => list.reduce((total, r) => total + r.amountValue, 0);

/** Group payout records by person, busiest first. */
export function ambassadorsFrom(payouts: PayoutRequest[]): Ambassador[] {
  const groups = new Map<string, PayoutRequest[]>();
  for (const p of payouts) groups.set(p.payeeId, [...(groups.get(p.payeeId) ?? []), p]);
  return [...groups.entries()]
    .map(([id, list]) => {
      const latest = [...list].sort((a, b) => b.requestedAt.localeCompare(a.requestedAt))[0];
      const pending = list.filter((r) => r.status === "Pending");
      const approved = list.filter((r) => r.status === "Approved");
      const status: AmbassadorStatus = pending.length ? "payout-due" : approved.length ? "approved" : "paid";
      return {
        id,
        name: latest.name,
        email: latest.email,
        requests: list.length,
        requested: sum(list.filter((r) => r.status !== "Rejected")),
        paidOut: sum(list.filter((r) => r.status === "Disbursed")),
        outstanding: sum([...pending, ...approved]),
        lastRequest: latest.requestedAt,
        status,
      };
    })
    .sort((a, b) => b.requested - a.requested);
}

/** The four stat cards. */
export function statsFrom(payouts: PayoutRequest[]) {
  const by = (s: PayoutStatus) => payouts.filter((r) => r.status === s);
  const now = new Date();
  const thisMonth = payouts.filter((r) => {
    const d = new Date(r.requestedAt);
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  });
  return {
    ambassadors: new Set(payouts.map((p) => p.payeeId)).size,
    requests: payouts.length,
    requestsThisMonth: thisMonth.length,
    paidOut: sum(by("Disbursed")),
    paidCount: by("Disbursed").length,
    awaitingReview: sum(by("Pending")),
    awaitingReviewCount: by("Pending").length,
    awaitingTransfer: sum(by("Approved")),
    awaitingTransferCount: by("Approved").length,
  };
}

/** Requested vs paid out per calendar month, oldest first, for the last `months` months. */
export function monthlyFrom(payouts: PayoutRequest[], months: number) {
  const now = new Date();
  const buckets = Array.from({ length: months }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (months - 1 - i), 1);
    return { key: `${d.getFullYear()}-${d.getMonth()}`, month: d.toLocaleDateString("en-US", { month: "short" }), requested: 0, paid: 0 };
  });
  const index = new Map(buckets.map((b, i) => [b.key, i]));
  const keyOf = (iso: string) => {
    const d = new Date(iso);
    return `${d.getFullYear()}-${d.getMonth()}`;
  };
  for (const p of payouts) {
    if (p.status !== "Rejected" && p.status !== "PendingOtp") {
      const i = index.get(keyOf(p.requestedAt));
      if (i !== undefined) buckets[i].requested += p.amountValue;
    }
    if (p.status === "Disbursed") {
      const i = index.get(keyOf(p.disbursedAt ?? p.requestedAt));
      if (i !== undefined) buckets[i].paid += p.amountValue;
    }
  }
  return buckets;
}
