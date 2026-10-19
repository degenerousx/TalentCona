# Dashboard

- **Route:** `/dashboard`
- **Design:** [Figma section "Dashboard"](https://www.figma.com/design/q8WJ8duI2FR5mc7ESAcUhi/Talent-cona-Admin-Portal--Copy-?node-id=293-8768) (first frame; the other frames in that section belong to Reports & Insights and Referrals)

Only edit files inside this folder. Put this module's components in `_components/`.
Stuff shared by several modules goes in `src/components/` — tell the team before changing it.
Styling is CSS Modules (`*.module.css` next to each component), sized to the Figma frames.

## Pages

| Route | File | Screen |
| --- | --- | --- |
| `/dashboard` | `page.tsx` → `_components/DashboardView.tsx` | Welcome, stat cards, Platform Growth, Recent Activity, Pending Reviews, Performance |

`layout.tsx` cancels the shared `<main>` padding, because this page sets its own Figma padding.

- `_components/GrowthChart.tsx` — the area chart (plain SVG, no chart library).
- `_components/data.ts` — mock data.
