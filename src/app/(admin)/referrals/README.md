# Referrals — Ambassador Management

- **Route:** `/referrals` (needs `MANAGE_REFERRALS`, or super admin)
- **Design:** recreated from the Ambassador Management and Payout Requests screen recordings.
- **Files:** `_components/ReferralsView.tsx` (page), `Overview.tsx` (stat cards, payout chart, pending
  payout card), `Tables.tsx` (Ambassadors tab), `PayoutRequests.tsx` (Payout requests tab),
  `api.ts` (hooks), `data.ts` (types and the calculations). **No sample data.**

## Endpoints (Postman "withdrawals → admin")

| Method | Path | Used for |
|---|---|---|
| GET | `/withdrawals/admin?cursor=&limit=&status=` | Everything: `useAllPayouts` loads every record (limit 100, follows `nextCursor`); `usePayoutRequests(status)` pages one status for the Payout requests tab |
| PATCH | `/withdrawals/admin/:id/approve` | Approve (`{}`) |
| PATCH | `/withdrawals/admin/:id/reject` | Reject, with optional `{ note }` reason |
| PATCH | `/withdrawals/admin/:id/disburse` | Mark as disbursed, with optional `{ note }` transfer reference |

Statuses: `PendingOtp`, `Pending`, `Approved`, `Rejected`, `Disbursed`. Amounts are minor units
(`amount / minorUnit`), shown in naira.

## Why everything comes from payouts

The backend has **no admin endpoints** for the ambassador list, referred students, student payments
or commission. `/referrals/me*` only return the signed-in ambassador's own dashboard, and the admin
user lists can't filter by ambassador. So the page is built from payout records:

- **Stat cards:** ambassadors with payouts (and requests this month), paid out, awaiting review,
  approved but not yet sent.
- **Payout overview chart:** amount requested (by request month, rejected excluded) vs paid out (by
  disbursement month), last 3/6/12 months.
- **Ambassadors tab:** one row per person who has requested a payout: requests, requested, paid out,
  outstanding, last request, status (Payout due / Awaiting transfer / Nothing due). **Manage**
  shows their payout history. **Export report** downloads these rows.
- **Payout requests tab:** see `PayoutRequests.tsx`. Every action refreshes all of the above.

When the backend adds ambassador/commission endpoints, add hooks to `api.ts` and bring back the
design's Students / Student payments / Commission columns.

Payouts may need `MANAGE_FINANCIAL_OPERATIONS` on the backend; without it the page shows the
backend's "no access" message.
