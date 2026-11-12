import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, ApiError } from "@/lib/api";
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
  bankCode?: string | null;
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
    bankCode: w.bankCode || "",
    studentId: w.studentId || null,
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

/** GET /students/admin/:studentId (Postman "User Management → Students → Single Student Overview"). */
export type StudentProfile = {
  fullName: string | null;
  email: string | null;
  phoneNumber: string | null;
  location: string;
  joinedAt: string | null;
  accountLabel: string | null;
};

type ApiStudent = {
  fullName?: string | null;
  email?: string | null;
  phoneNumber?: string | null;
  city?: string | null;
  stateRegion?: string | null;
  country?: string | null;
  joinedAt?: string | null;
  accountLabel?: string | null;
};

/**
 * The payee's account, when they are a student account (payouts carry their
 * studentId). Resolves to null — not an error — when there is none, e.g. a
 * mentor or ambassador account the students endpoint doesn't cover.
 */
export function useStudentProfile(studentId: string | null) {
  return useQuery({
    queryKey: ["referrals", "student", studentId ?? ""],
    enabled: !!studentId,
    retry: false,
    queryFn: async (): Promise<StudentProfile | null> => {
      try {
        const s = await api<ApiStudent>(`/students/admin/${encodeURIComponent(studentId!)}`, { expectedStatuses: [403, 404] });
        return {
          fullName: s.fullName ?? null,
          email: s.email ?? null,
          phoneNumber: s.phoneNumber ?? null,
          location: [s.city, s.stateRegion, s.country].filter(Boolean).join(", "),
          joinedAt: s.joinedAt ?? null,
          accountLabel: s.accountLabel ?? null,
        };
      } catch (e) {
        if (e instanceof ApiError && (e.status === 404 || e.status === 403)) return null;
        throw e;
      }
    },
  });
}
