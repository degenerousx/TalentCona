# Referrals

- **Route:** `/referrals`
- **Design:** [Figma, "Referral & Commission Engine" frames in the Dashboard section](https://www.figma.com/design/q8WJ8duI2FR5mc7ESAcUhi/Talent-cona-Admin-Portal--Copy-?node-id=293-10764)
- **Status:** Migrated to the Next.js App Router; the sidebar route is enabled.

The page includes the overview dashboard, referral ledger, withdrawal queue, commission
settings, and referrer details. Ledger and withdrawal records remain in route-local UI
state because there is no connected persistent backend. Processing a withdrawal only
marks the demo request as processed; it does not transfer funds.
