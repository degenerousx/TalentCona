# Referrals — Ambassador Management

- **Route:** `/referrals` (needs `MANAGE_REFERRALS`, or super admin)
- **Design:** recreated from the Ambassador Management screen recording (no Figma/CSS provided).
- **Files:** `_components/ReferralsView.tsx` (page), `Overview.tsx` (stat cards, commission chart,
  pending payout card), `Tables.tsx` (Ambassadors and Payout requests tabs), `api.ts`, `data.ts`.

## Data

| Part | Source |
|---|---|
| Payout requests tab, pending payout card | **Live:** `GET /withdrawals/admin?status=&cursor=&limit=` |
| Approve / Reject / Mark as disbursed | **Live:** `PATCH /withdrawals/admin/:id/{approve,reject,disburse}` `{ note? }` |
| Ambassadors table, stat cards, commission chart | **Sample** (`data.ts`): the backend has no admin ambassador/commission endpoints yet. The page says so in a banner. |

- Pending requests can be approved or rejected; approved ones can be marked as disbursed or rejected.
  Each action asks for confirmation and an optional note.
- Payout requests may need `MANAGE_FINANCIAL_OPERATIONS` on the backend; without it the tab shows
  the backend's "no access" message.
- Amounts are shown in naira (the backend's currency), not the cedis in the recording.
- Replace the sample parts with hooks in `api.ts` when ambassador endpoints exist.
