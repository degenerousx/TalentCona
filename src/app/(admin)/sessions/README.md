# Sessions

- **Route:** `/sessions`
- **Design:** [Figma section "Mentees"](https://www.figma.com/design/wWTRvKpJtFXrBomS3CxQkf/Talent-cona-Admin-Portal--Copy---Copy-?node-id=293-35929)

Only edit files inside this folder. Put this module's components in `_components/`.
Stuff shared by several modules goes in `src/components/` — tell the team before changing it.
Images for this module live in `public/sessions/`.

## Pages

| Route | File | Screen |
| --- | --- | --- |
| `/sessions` | `page.tsx` → `_components/SessionsView.tsx` | Upcoming, pending requests, recent |
| `/sessions/[sessionId]/call` | `…/call/page.tsx` → `_components/CallView.tsx` | Live session (UI only, no video provider yet) |
| `/sessions/[sessionId]/ended` | `…/ended/page.tsx` → `_components/SessionEnded.tsx` | "You left the mentor session" summary |

- `_components/SessionModals.tsx` — review request (reschedule / session / cancellation), Reschedule, Cancel and the success popups.
- `_components/data.ts` — mock data. Approve / decline / reschedule / cancel only change browser state for now.
- The call photos are placeholders — export Figma nodes 293:36491 (student) and 293:36521 (self view) into `public/sessions/` if you want them.
