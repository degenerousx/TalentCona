import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, apiDownload, type Query } from "@/lib/api";

/**
 * Referral & Commission ↔ backend (Postman "Admin App → Referrals" and "withdrawals → admin").
 *
 *   GET   /admin/referrals/overview?range=                         stat cards + top referrers
 *   GET   /admin/referrals/overview/viral-growth?range=&from=&to=  Viral Growth Trend
 *   GET   /admin/referrals/overview/leaderboard/export?range=&limit=   leaderboard file
 *   GET   /admin/referrals/ledger?cursor=&limit=&search=&programIds=&status=   Referral Ledger
 *   GET   /admin/referrals/ledger/export?<same filters>            ledger file
 *   GET   /admin/referrals/settings · PATCH { rewardPercent }      Commission Settings
 *   GET   /admin/referrals/referrers/:userId                       referrer details
 *   GET   …/referrers/:userId/performance?range=&from=&to=         performance chart
 *   GET   …/referrers/:userId/history?cursor=&limit=               referral history
 *   GET   …/referrers/:userId/export                               referrer report (XLSX)
 *   POST  …/referrers/:userId/reset-code                           new referral code
 *   GET   /withdrawals/admin?cursor=&limit=&status=                Withdrawal Queue
 *   GET   /withdrawals/admin/summary-counts                        queue badge
 *   GET   /withdrawals/admin/:id                                   withdrawal details
 *   PATCH /withdrawals/admin/:id/{approve|reject|disburse} { note? }
 *   GET   /withdrawals/admin/users/:userId/payout-summary          referrer balances
 *   GET   /withdrawals/admin/users/:userId/requests?cursor=&limit= referrer withdrawal history
 *   GET   /programs/admin                                          ledger program filter
 */

type CursorPage<T> = { items: T[]; limit: number; hasNext: boolean; nextCursor: string | null };

/** The withdrawal queue and its badge refresh every 30 s while the tab is visible, and on focus. */
const LIVE = { staleTime: 0, refetchOnWindowFocus: true, refetchInterval: 30_000 } as const;

// ---- Money and dates ---------------------------------------------------------------

/** Minor units → "₦12,600" (or "USD 1,200"). */
export function money(minor: number | null | undefined, currency = "NGN", minorUnit = 100) {
  const value = (minor ?? 0) / (minorUnit || 1);
  const n = value.toLocaleString("en-NG", { maximumFractionDigits: 2 });
  return currency === "NGN" ? `₦${n}` : `${currency} ${n}`;
}

/** Minor units → "₦12.4M" / "₦198K" for stat cards. */
export function compactMoney(minor: number | null | undefined, currency = "NGN", minorUnit = 100) {
  const value = (minor ?? 0) / (minorUnit || 1);
  const sign = currency === "NGN" ? "₦" : `${currency} `;
  if (Math.abs(value) >= 1e6) return `${sign}${+(value / 1e6).toFixed(1)}M`;
  if (Math.abs(value) >= 1e3) return `${sign}${+(value / 1e3).toFixed(1)}K`;
  return `${sign}${Math.round(value).toLocaleString("en-NG")}`;
}

/** "2026-11-14" */
export const day = (iso: string | null | undefined) => (iso ? iso.slice(0, 10) : "—");
/** "2026-11-14 12:19" (local time) */
export function dayTime(iso: string | null | undefined) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

const ymd = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

/** Stats and leaderboard period. */
export const STATS_RANGE = "last_90d";
/** Trend charts: the last 7 calendar months, by month. */
function trendRange(): Query {
  const now = new Date();
  return { range: "custom", from: ymd(new Date(now.getFullYear(), now.getMonth() - 6, 1)), to: ymd(now) };
}

// ---- Overview -------------------------------------------------------------------------

export type TopReferrer = {
  rank: number;
  userId: string;
  truncatedUserId: string;
  fullName: string;
  email: string;
  userType: string;
  totalEarnedMinor: number;
  referralCount: number;
  paidConversionCount: number;
  currency: string;
  minorUnit: number;
};

export type Overview = {
  range: string;
  currency: string;
  minorUnit: number;
  viralCoefficient: number;
  conversionValueMinor: number;
  totalCommissionsPaidMinor: number;
  activeReferrers: number;
  topReferrers: TopReferrer[];
};

export function useOverview() {
  return useQuery({
    queryKey: ["referrals", "overview", STATS_RANGE],
    queryFn: () => api<Overview>("/admin/referrals/overview", { query: { range: STATS_RANGE } }),
  });
}

export type GrowthPoint = { period: string; periodLabel: string; referredSignups: number; paidConversions: number };
type Series = { range: string; from: string; toExclusive: string; granularity: string; points: GrowthPoint[] };

export function useViralGrowth() {
  return useQuery({
    queryKey: ["referrals", "viral-growth"],
    queryFn: () => api<Series>("/admin/referrals/overview/viral-growth", { query: trendRange() }),
  });
}

export const exportLeaderboard = () =>
  apiDownload("/admin/referrals/overview/leaderboard/export", { query: { range: STATS_RANGE, limit: 50 }, filename: "referral-leaderboard.csv" });

// ---- Ledger ---------------------------------------------------------------------------

export type LedgerEntry = {
  id: string;
  referrer: { userId: string; truncatedUserId: string; fullName: string; email: string; referralCode: string };
  referee: { userId: string; truncatedUserId: string; fullName: string; email: string };
  programId: string;
  programTitle: string;
  amountPaidMinor: number;
  commissionMinor: number;
  /** e.g. "Paid", "No Commission". */
  ledgerStatus: string;
  currency: string;
  minorUnit: number;
  creditedAt: string;
};

/** Backend status filter values (Postman: paid, no_commission). */
export const LEDGER_STATUSES = [
  { id: "paid", label: "Paid" },
  { id: "no_commission", label: "No Commission" },
] as const;
export type LedgerStatus = (typeof LEDGER_STATUSES)[number]["id"];

export type LedgerFilters = { search: string; programIds: string[]; statuses: LedgerStatus[] };

function ledgerQuery(f: LedgerFilters): Query {
  return {
    search: f.search.trim() || undefined,
    programIds: f.programIds.length ? f.programIds.join(",") : undefined,
    // One status filters; both (or none) means everything.
    status: f.statuses.length === 1 ? f.statuses[0] : undefined,
  };
}

export function useLedger(f: LedgerFilters) {
  return useInfiniteQuery({
    queryKey: ["referrals", "ledger", f],
    initialPageParam: null as string | null,
    queryFn: ({ pageParam }) => api<CursorPage<LedgerEntry>>("/admin/referrals/ledger", { query: { limit: 20, cursor: pageParam, ...ledgerQuery(f) } }),
    getNextPageParam: (last) => (last.hasNext ? last.nextCursor : null),
  });
}

export const exportLedger = (f: LedgerFilters) =>
  apiDownload("/admin/referrals/ledger/export", { query: ledgerQuery(f), filename: "referral-ledger.csv" });

/** Program filter options. */
export function usePrograms() {
  return useQuery({
    queryKey: ["referrals", "programs"],
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const all: { id: string; title: string }[] = [];
      for (let page = 1; page <= 20; page++) {
        const res = await api<{ items: { id: string; title: string }[]; total: number }>("/programs/admin", { query: { page, pageSize: 100 } });
        all.push(...res.items.map((p) => ({ id: p.id, title: p.title })));
        if (all.length >= res.total || res.items.length < 100) break;
      }
      return all.sort((a, b) => a.title.localeCompare(b.title));
    },
  });
}

// ---- Settings -------------------------------------------------------------------------

export type ReferralSettings = { rewardPercent: number; rewardBps: number; updatedAt: string | null; updatedByUserId: string | null };

export function useReferralSettings() {
  return useQuery({ queryKey: ["referrals", "settings"], queryFn: () => api<ReferralSettings>("/admin/referrals/settings") });
}

export function useSaveReferralSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (rewardPercent: number) => api<ReferralSettings>("/admin/referrals/settings", { method: "PATCH", body: { rewardPercent } }),
    onSuccess: (saved) => qc.setQueryData(["referrals", "settings"], saved),
  });
}

// ---- One referrer -----------------------------------------------------------------------

export type Referrer = {
  userId: string;
  truncatedUserId: string;
  fullName: string;
  email: string;
  userType: string;
  memberSince: string | null;
  referralCode: string;
  shareUrl: string;
  linkClicks: number;
  referrals: number;
  paidConversions: number;
  /** Percent; can exceed 100 (several paid programs per referral). */
  conversionRate: number;
  totalEarnedMinor: number;
};

const enc = encodeURIComponent;

export function useReferrer(userId: string | null) {
  return useQuery({
    queryKey: ["referrals", "referrer", userId],
    enabled: !!userId,
    queryFn: () => api<Referrer>(`/admin/referrals/referrers/${enc(userId!)}`),
  });
}

export function useReferrerPerformance(userId: string) {
  return useQuery({
    queryKey: ["referrals", "referrer", userId, "performance"],
    queryFn: () => api<Series>(`/admin/referrals/referrers/${enc(userId)}/performance`, { query: trendRange() }),
  });
}

export function useReferrerHistory(userId: string) {
  return useInfiniteQuery({
    queryKey: ["referrals", "referrer", userId, "history"],
    initialPageParam: null as string | null,
    queryFn: ({ pageParam }) => api<CursorPage<LedgerEntry>>(`/admin/referrals/referrers/${enc(userId)}/history`, { query: { limit: 20, cursor: pageParam } }),
    getNextPageParam: (last) => (last.hasNext ? last.nextCursor : null),
  });
}

export function useResetCode(userId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api<{ referralCode: string; shareUrl: string }>(`/admin/referrals/referrers/${enc(userId)}/reset-code`, { method: "POST" }),
    onSuccess: (next) => {
      qc.setQueryData<Referrer>(["referrals", "referrer", userId], (r) => r && { ...r, ...next });
      void qc.invalidateQueries({ queryKey: ["referrals", "ledger"] });
      void qc.invalidateQueries({ queryKey: ["referrals", "referrer", userId, "history"] });
    },
  });
}

export const exportReferrer = (userId: string, code: string) =>
  apiDownload(`/admin/referrals/referrers/${enc(userId)}/export`, { filename: `referrer-${code || userId}.xlsx` });

export type PayoutSummary = {
  userId: string;
  availableBalanceMinor: number;
  pendingBalanceMinor: number;
  totalWithdrawnMinor: number;
  disbursedWithdrawalCount: number;
  currency: string;
  minorUnit: number;
};

export function usePayoutSummary(userId: string) {
  return useQuery({
    queryKey: ["withdrawals", "user", userId, "summary"],
    queryFn: () => api<PayoutSummary>(`/withdrawals/admin/users/${enc(userId)}/payout-summary`),
  });
}

export type UserWithdrawal = {
  id: string;
  status: WithdrawalStatus;
  amountMinor: number;
  currency: string;
  minorUnit: number;
  bankName: string | null;
  accountName: string | null;
  accountNumberMasked: string | null;
  requestedAt: string;
  disbursedAt: string | null;
};

export function useUserWithdrawals(userId: string) {
  return useInfiniteQuery({
    queryKey: ["withdrawals", "user", userId, "requests"],
    initialPageParam: null as string | null,
    queryFn: ({ pageParam }) => api<CursorPage<UserWithdrawal>>(`/withdrawals/admin/users/${enc(userId)}/requests`, { query: { limit: 20, cursor: pageParam } }),
    getNextPageParam: (last) => (last.hasNext ? last.nextCursor : null),
  });
}

// ---- Withdrawal queue ---------------------------------------------------------------------

/** Postman: Pending, Approved, Rejected, Disbursing, Disbursed, Failed. */
export type WithdrawalStatus = "Pending" | "Approved" | "Rejected" | "Disbursing" | "Disbursed" | "Failed" | "PendingOtp";

/** What still needs an admin: review, transfer, a transfer in flight, or a failed transfer. */
export const QUEUE_STATUSES = ["Pending", "Approved", "Disbursing", "Failed"] as const satisfies readonly WithdrawalStatus[];

export type Withdrawal = {
  id: string;
  userId: string;
  amount: number;
  currency: string;
  minorUnit: number;
  status: WithdrawalStatus;
  bankName: string | null;
  bankCode: string | null;
  accountNumber: string | null;
  accountName: string | null;
  note: string | null;
  reviewNote: string | null;
  createdAt: string;
  user?: { id: string; fullName?: string | null; email?: string | null; phoneNumber?: string | null; userType?: string | null; createdAt?: string | null } | null;
};

/** Every withdrawal in the queue statuses, oldest request first. */
export function useWithdrawalQueue() {
  return useQuery({
    ...LIVE,
    queryKey: ["withdrawals", "queue"],
    queryFn: async () => {
      const lists = await Promise.all(
        QUEUE_STATUSES.map(async (status) => {
          const out: Withdrawal[] = [];
          let cursor: string | null = null;
          for (let i = 0; i < 20; i++) {
            const page: CursorPage<Withdrawal> = await api<CursorPage<Withdrawal>>("/withdrawals/admin", { query: { limit: 100, cursor, status } });
            out.push(...page.items);
            if (!page.hasNext || !page.nextCursor) break;
            cursor = page.nextCursor;
          }
          return out;
        }),
      );
      return lists.flat().sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    },
  });
}

export type WithdrawalCounts = { all: number; pending: number; approved: number; rejected: number; disbursing: number; disbursed: number; failed: number };

export function useWithdrawalCounts() {
  return useQuery({ ...LIVE, queryKey: ["withdrawals", "counts"], queryFn: () => api<WithdrawalCounts>("/withdrawals/admin/summary-counts") });
}

export type WithdrawalDetail = {
  id: string;
  status: WithdrawalStatus;
  amountMinor: number;
  currency: string;
  minorUnit: number;
  bankName: string | null;
  bankCode: string | null;
  accountNumberMasked: string | null;
  accountName: string | null;
  note: string | null;
  reviewNote: string | null;
  requestedAt: string;
  reviewedAt: string | null;
  disbursedAt: string | null;
  previousWithdrawalCount: number;
  user: { id: string; fullName: string | null; email: string | null; phoneNumber: string | null; userType: string | null };
};

export function useWithdrawal(id: string) {
  return useQuery({ queryKey: ["withdrawals", "one", id], queryFn: () => api<WithdrawalDetail>(`/withdrawals/admin/${enc(id)}`) });
}

export type WithdrawalAction = "approve" | "reject" | "disburse";

/** PATCH /withdrawals/admin/:id/{approve|reject|disburse} { note? }; refreshes the queue, counts and balances. */
export function useWithdrawalAction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, action, note }: { id: string; action: WithdrawalAction; note?: string }) =>
      api(`/withdrawals/admin/${enc(id)}/${action}`, { method: "PATCH", body: note?.trim() ? { note: note.trim() } : {} }),
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: ["withdrawals"] });
      void qc.invalidateQueries({ queryKey: ["referrals", "referrer"] });
    },
  });
}
