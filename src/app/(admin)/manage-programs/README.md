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
| `/manage-programs/grading` | `grading/page.tsx` → `_components/GradingView.tsx` | **Grading Rubrics** (live API): pick a real program, edit its Mini Project and Final Project rubrics; shows the portal's grade scale |

## Grading (live API)

`_components/gradingApi.ts`, from Postman "programs → admin → rubrics":

| Action | Endpoint |
|---|---|
| Program picker | `GET /programs/admin?page=&pageSize=100` |
| List a rubric | `GET /programs/admin/:programId/rubrics/:scope/criteria` (`scope` = `MiniProject` or `FinalProject`) |
| Add criterion | `POST …/rubrics/:scope/criteria` `{ title, description?, weightPercent (1–100), maxScore }` |
| Edit / reorder | `PATCH /programs/admin/:programId/rubrics/criteria/:criterionId` (`{ order }` to move) |
| Delete | `DELETE /programs/admin/:programId/rubrics/criteria/:criterionId` |

- Mentors score submissions per criterion; the **backend** weights the scores into the submission's
  percent and the student's final grade. The portal never calculates grades.
- Weights may not go over 100% (checked before saving); the summary flags any total other than 100%.
- An empty rubric is flagged: the backend won't publish a program until both rubrics have a criterion.
- Grades are shown with the shared scale in `src/config/grading.ts` (`GradeBadge`, `StarRating` in
  `src/components/ui/Grade.tsx`).
- The rubric tabs on the Program Details page still use the sample programs; this page is the live one.

## Components

- `data.ts` — all mock data and types. Replace with API calls when the backend is ready.
- `ModuleCard.tsx` — expandable module (lessons, scripts, resources, MCQs, mini projects).
- `ProgramModals.tsx` — every Add/Edit popup (module, lesson, resource/script, question, mini project, criterion, school) + delete confirmation.
- `FormFields.tsx` — inputs, selects, upload boxes and buttons used by the popups and the wizard.

Add/edit/delete currently only change in-browser state (lost on refresh) — there is no API yet.
