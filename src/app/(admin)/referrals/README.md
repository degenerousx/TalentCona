# Referrals — Ambassador Management

- **Route:** `/referrals` (needs `MANAGE_REFERRALS`, or super admin)
- **Design:** recreated from the Ambassador Management screen recording (no Figma/CSS provided).
- **Files:** `_components/ReferralsView.tsx` (page), `Overview.tsx` (stat cards, commission chart,
  pending payout card), `Tables.tsx` (Ambassadors tab), `PayoutRequests.tsx` (Payout requests tab,
  from its own screen recording), `api.ts`, `data.ts`.

## Data

| Part | Source |
|---|---|
| Payout requests tab, pending payout card | **Live:** `GET /withdrawals/admin?status=&cursor=&limit=` |
| Approve / Reject / Mark as disbursed | **Live:** `PATCH /withdrawals/admin/:id/{approve,reject,disburse}` `{ note? }` |
| Ambassadors table, stat cards, commission chart | **Sample** (`data.ts`): the backend has no admin ambassador/commission endpoints yet. The page says so in a banner. |

- **Payout requests tab:** "Awaiting review" cards (who, when, amount, receiving account) with
  **View evidence** (bank details, then Approve or Reject with a reason) and one-click **Approve**.
  Approved payouts wait below under "Approved — awaiting transfer" with **Mark as disbursed**
  (optional transfer reference). The design has no Reject button on the card, so Reject lives in
  View evidence.
- **Export report** shows "Report export started" and downloads the ambassadors CSV.
- Payout requests may need `MANAGE_FINANCIAL_OPERATIONS` on the backend; without it the tab shows
  the backend's "no access" message.
- Amounts are shown in naira (the backend's currency), not the cedis in the recording.
- Replace the sample parts with hooks in `api.ts` when ambassador endpoints exist.
