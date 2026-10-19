# Manage Programs

- **Route:** `/manage-programs`
- **Design:** [Figma section](https://www.figma.com/design/KOLH84zZQHfrfQjsGhLiZO/Talent-cona-Admin-Portal--Copy-?node-id=293-19524)
- **Branch:** `feature/manage-programs` (from `Int-Code`)

Only edit files inside this folder. Put this module's components in `_components/`.
Stuff shared by several modules goes in `src/components/` — tell the team before changing it.
When the page is ready, set `enabled: true` for this item in `src/config/navigation.ts`.

## Pages

| Route | File | Screen |
| --- | --- | --- |
| `/manage-programs` | `page.tsx` → `_components/ProgramsView.tsx` | Schools list + Programs table |
| `/manage-programs/new` | `new/page.tsx` → `_components/ProgramWizard.tsx` | Create New Program (3 steps) |
| `/manage-programs/[programId]` | `[programId]/page.tsx` → `_components/ProgramDetailView.tsx` | Modules & Content, Mini Project + Final Project Grading Rubrics |
| `/manage-programs/[programId]/edit` | `[programId]/edit/page.tsx` → `_components/ProgramWizard.tsx` | Edit Program |
| `/manage-programs/[programId]/assessment/[moduleId]` | `…/page.tsx` → `_components/AssessmentView.tsx` | Module test preview |

## Components

- `data.ts` — all mock data and types. Replace with API calls when the backend is ready.
- `ModuleCard.tsx` — expandable module (lessons, scripts, resources, MCQs, mini projects).
- `ProgramModals.tsx` — every Add/Edit popup (module, lesson, resource/script, question, mini project, criterion, school) + delete confirmation.
- `FormFields.tsx` — inputs, selects, upload boxes and buttons used by the popups and the wizard.

Add/edit/delete currently only change in-browser state (lost on refresh) — there is no API yet.
