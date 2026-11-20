# Referrals — Referral & Commission Engine

- **Route:** `/referrals` (needs `MANAGE_REFERRALS`, or super admin). Tabs are in the URL hash:
  `#ledger`, `#queue`, `#settings` (Overview has none).
- **Design:** the original "Referral & Commission Engine" frames ([Figma](https://www.figma.com/design/q8WJ8duI2FR5mc7ESAcUhi/Talent-cona-Admin-Portal--Copy-?node-id=293-10764)).
  Restored on 20 Nov 2026 after the Ambassador Management redesign (11–12 Nov) was reverted; same
  layout, styling and components, now on live data.
- **Files:** `_components/ReferralsContent.tsx` (the page), `_components/api.ts` (hooks). **No sample data.**

## Endpoints

| Part of the page | Endpoint |
| --- | --- |
| Overview stat cards: Viral Coefficient, Conversion Value, Active Referrers (last 90 days) | `GET /admin/referrals/overview?range=last_90d` |
| Overview stat card: Pending Payouts (withdrawals awaiting review or transfer) | sum of `Pending` + `Approved` from `GET /withdrawals/admin?status=` |
| Viral Growth Trend (last 7 months, signups vs paid conversions) | `GET /admin/referrals/overview/viral-growth?range=custom&from=&to=` |
| Top Referrers Leaderboard | `topReferrers` from the overview |
| Leaderboard → Export (file) | `GET /admin/referrals/overview/leaderboard/export?range=last_90d&limit=50` |
| Referral Ledger (20 per page, Load more) | `GET /admin/referrals/ledger?cursor=&limit=&search=&programIds=&status=` |
| Ledger filters | search (sent 350 ms after typing stops); programs from `GET /programs/admin` (`programIds`, comma-separated); status `paid` / `no_commission` (one picked = filter, both = all) |
| Ledger → Export CSV (file, same filters) | `GET /admin/referrals/ledger/export` |
| Withdrawal Queue (Pending, Approved, Disbursing, Failed; oldest first) | `GET /withdrawals/admin?status=` (each status, all pages) |
| Queue tab badge | `GET /withdrawals/admin/summary-counts` (pending + approved + disbursing + failed) |
| View Details | `GET /withdrawals/admin/:id` (email, phone, previous withdrawals) + the list item (full account number, account age) |
| Approve & Process | `PATCH /withdrawals/admin/:id/approve`, then `PATCH …/disburse`. If the transfer can't start, the request stays **Approved** in the queue with **Process Payout** (or **Retry Payout** when Failed) |
| Reject (reason required) | `PATCH /withdrawals/admin/:id/reject { note }` |
| Commission Settings | `GET /admin/referrals/settings` → `rewardPercent`; Save → `PATCH { rewardPercent }` (0–100, decimals allowed) |
| Referrer detail (leaderboard → View) | `GET /admin/referrals/referrers/:userId` (code, share link, clicks, referrals, conversions, rate, total earned) |
| Referral Performance Over Time | `GET …/referrers/:userId/performance?range=custom&from=&to=` |
| Reset Code (after a confirmation) | `POST …/referrers/:userId/reset-code` |
| Export Report (XLSX) | `GET …/referrers/:userId/export` |
| Referral History | `GET …/referrers/:userId/history?cursor=&limit=` |
| Available / Pending balance, Total Withdrawn | `GET /withdrawals/admin/users/:userId/payout-summary` |
| Withdrawal History | `GET /withdrawals/admin/users/:userId/requests?cursor=&limit=` |

Money is in minor units (`amount / minorUnit`), shown in naira. Exports are downloaded with the
admin's session (`apiDownload` in `src/lib/api.ts`), using the server's filename when it sends one.
The queue and its badge refresh every 30 s while the tab is visible and on focus; every action
refreshes the queue, counts and balances.

## Differences from the original mock-up (no fake data)

- **Pending Payouts** is open withdrawal requests (the overview has no "awaiting lock-in" figure).
- **Withdrawal Queue** also lists approved requests not yet transferred, transfers in progress, and
  failed transfers, and has **Reject**; the mock-up only had pending ones and approve.
- The referrer page's **Process Withdrawal** button and "Avg. 19 days until release" line are gone:
  there is no admin endpoint to start a withdrawal for someone, and no release-time data.
- Ledger statuses are the backend's two (Paid, No Commission); lists have **Load more** for pages.
