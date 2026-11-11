import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { naira, type PayoutRequest, type PayoutStatus } from "./data";

/**
 * Referrals ↔ backend. The only admin referral endpoints in Postman are the
 * withdrawals (payout) ones, so every number on the page comes from payout
 * records:
 *   GET   /withdrawals/admin?cursor=&limit=&status=
 *   PATCH /withdrawals/admin/:id/{approve|reject|disburse}  { note? }
 * (/referrals/me/* are for an ambassador's own dashboard, not for admins.)
 */

type ApiWithdrawal = {
  id: string;
  studentId?: string | null;
  userId?: string | null;
  amount: number;
  currency: string;
  minorUnit: number;
  status: PayoutStatus;
  bankName?: string | null;
  accountNumber?: string | null;
  accountName?: string | null;
  note?: string | null;
  reviewNote?: string | null;
  reviewedAt?: string | null;
  disbursedAt?: string | null;
  createdAt: string;
  student?: { id?: string; fullName?: string | null; email?: string | null } | null;
  user?: { id?: string; fullName?: string | null; email?: string | null } | null;
};

type CursorPage<T> = { items: T[]; limit: number; hasNext: boolean; nextCursor: string | null };

function toPayout(w: ApiWithdrawal): PayoutRequest {
  const value = w.amount / (w.minorUnit || 1);
  const person = w.student ?? w.user;
  const acct = w.accountNumber ?? "";
  return {
    id: w.id,
    payeeId: w.studentId || w.userId || person?.id || person?.email || w.accountName || w.id,
    name: person?.fullName || w.accountName || "Ambassador",
    email: person?.email || "",
    amount: w.currency === "NGN" ? naira(value) : `${w.currency} ${Math.round(value).toLocaleString()}`,
    amountValue: value,
    bank: w.bankName || "-",
    accountName: w.accountName || "",
    account: acct ? `•••• ${acct.slice(-4)}` : "-",
    status: w.status,
    note: w.note || "",
    reviewNote: w.reviewNote || "",
    requestedAt: w.createdAt,
    disbursedAt: w.disbursedAt ?? null,
  };
}

const keys = {
  all: ["referrals", "payouts"] as const,
  list: (status: string) => ["referrals", "payouts", "list", status] as const,
  everything: ["referrals", "payouts", "everything"] as const,
};

/** One status (or all), page by page — for the Payout requests tab. */
export function usePayoutRequests(status: PayoutStatus | "all") {
  return useInfiniteQuery({
    queryKey: keys.list(status),
    initialPageParam: null as string | null,
    queryFn: async ({ pageParam }) => {
      const page = await api<CursorPage<ApiWithdrawal>>("/withdrawals/admin", {
        query: { limit: 20, cursor: pageParam, status: status === "all" ? undefined : status },
      });
      return { ...page, items: page.items.map(toPayout) };
    },
    getNextPageParam: (last) => (last.hasNext ? last.nextCursor : null),
  });
}

/** Every payout record (all statuses, all pages) — for the stats, chart and ambassador list. */
export function useAllPayouts() {
  return useQuery({
    queryKey: keys.everything,
    queryFn: async () => {
      const all: PayoutRequest[] = [];
      let cursor: string | null = null;
      for (let i = 0; i < 50; i++) {
        const page: CursorPage<ApiWithdrawal> = await api<CursorPage<ApiWithdrawal>>("/withdrawals/admin", { query: { limit: 100, cursor } });
        all.push(...page.items.map(toPayout));
        if (!page.hasNext || !page.nextCursor) break;
        cursor = page.nextCursor;
      }
      return all;
    },
  });
}

export type PayoutAction = "approve" | "reject" | "disburse";

/** PATCH /withdrawals/admin/:id/{approve|reject|disburse} { note? } */
export function usePayoutAction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, action, note }: { id: string; action: PayoutAction; note?: string }) =>
      api(`/withdrawals/admin/${encodeURIComponent(id)}/${action}`, {
        method: "PATCH",
        body: note?.trim() ? { note: note.trim() } : {},
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: keys.all }),
  });
}
