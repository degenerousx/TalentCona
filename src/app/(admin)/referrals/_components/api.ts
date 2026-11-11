import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { naira, type PayoutRequest, type PayoutStatus } from "./data";

/**
 * Payout requests ↔ backend: the withdrawals admin endpoints (Postman
 * "withdrawals → admin"). The ambassador list, stat cards and chart have no
 * admin endpoints yet, so they use sample data (data.ts).
 */

type ApiWithdrawal = {
  id: string;
  amount: number;
  currency: string;
  minorUnit: number;
  status: PayoutStatus;
  bankName?: string | null;
  accountNumber?: string | null;
  accountName?: string | null;
  note?: string | null;
  reviewNote?: string | null;
  createdAt: string;
  student?: { fullName?: string | null; email?: string | null } | null;
  user?: { fullName?: string | null; email?: string | null } | null;
};

type CursorPage<T> = { items: T[]; limit: number; hasNext: boolean; nextCursor: string | null };

function toPayout(w: ApiWithdrawal): PayoutRequest {
  const value = w.amount / (w.minorUnit || 1);
  const person = w.student ?? w.user;
  const acct = w.accountNumber ?? "";
  return {
    id: w.id,
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
  };
}

const keys = { all: ["referrals", "payouts"] as const, list: (status: string) => ["referrals", "payouts", status] as const };

/** Pending by default; "all" omits the status filter. */
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
