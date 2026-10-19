# My Mentees

- **Route:** `/my-mentees`
- **Design:** [Figma section "Mentees"](https://www.figma.com/design/wWTRvKpJtFXrBomS3CxQkf/Talent-cona-Admin-Portal--Copy---Copy-?node-id=293-34929)

Only edit files inside this folder. Put this module's components in `_components/`.
Stuff shared by several modules goes in `src/components/` — tell the team before changing it.
Images for this module live in `public/my-mentees/`.

## Pages

| Route | File | Screen |
| --- | --- | --- |
| `/my-mentees` | `page.tsx` → `_components/MenteesView.tsx` | Mentee cards, grid / list toggle |
| `/my-mentees/[menteeId]` | `[menteeId]/page.tsx` → `_components/MenteeProfile.tsx` | Profile, upcoming sessions, history |
| `/my-mentees/[menteeId]/chat` | `[menteeId]/chat/page.tsx` → `_components/ChatView.tsx` | Chat with the mentee |

`_components/data.ts` holds the mock data. Messages you send only live in the browser until a chat API exists.
Two chat reference images are grey placeholders — export them from Figma (nodes 293:36320, 293:36321) into `public/my-mentees/`.
