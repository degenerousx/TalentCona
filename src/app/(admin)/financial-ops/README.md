# Financial Ops

- **Route:** `/financial-ops`
- **Design:** [Figma section "Financial Operations"](https://www.figma.com/design/q8WJ8duI2FR5mc7ESAcUhi/Talent-cona-Admin-Portal--Copy-?node-id=293-26308)

Only edit files inside this folder. Put this module's components in `_components/`.
Stuff shared by several modules goes in `src/components/` — tell the team before changing it.
Styling is CSS Modules (`*.module.css` next to each component), sized to the Figma frames.

## Pages

| Route | File | Screen |
| --- | --- | --- |
| `/financial-ops` | `page.tsx` → `_components/FinancialOps.tsx` | Stat cards, Revenue vs Expenses chart, and the Transaction Ledger / Wallet Management / Withdrawal Requests / Loan Repayments tabs (tab kept in the URL hash, e.g. `#wallets`) |

`layout.tsx` cancels the shared `<main>` padding, because this page sets its own Figma padding.

- `_components/LoanRepayments.tsx` — the Loan Repayments tab and its sub-tabs (All, Pending, Approved, Rejected, Repayment Tracking, Fully Paid).
- `_components/RevenueChart.tsx` — the line chart (plain SVG, no chart library).
- `_components/data.ts` — mock data. The page is read-only for now; "View" on a withdrawal shows a "coming soon" toast.
