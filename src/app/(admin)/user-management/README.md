# User Management

- **Route:** `/user-management`
- **Design:** [Figma section "User management"](https://www.figma.com/design/q8WJ8duI2FR5mc7ESAcUhi/Talent-cona-Admin-Portal--Copy-?node-id=293-13034)

Only edit files inside this folder. Put this module's components in `_components/`.
Stuff shared by several modules goes in `src/components/` — tell the team before changing it.
Styling is CSS Modules (`*.module.css` next to each component), sized to the Figma frames.

## Pages

| Route | File | Screen |
| --- | --- | --- |
| `/user-management` | `page.tsx` → `_components/UserManagement.tsx` | Students / Mentors / Partners tabs (tab kept in the URL hash, e.g. `#mentors`) |
| `/user-management/[studentId]` | `[studentId]/page.tsx` → `students/StudentProfile.tsx` | Student profile and program enrollments |
| `/user-management/[studentId]/[programId]` | `…/[programId]/page.tsx` → `students/ProgramDetail.tsx` | Overview, Performance, Engagement, Loan, Campaign tabs |
| `/user-management/mentors/[mentorId]` | `mentors/[mentorId]/page.tsx` → `mentors/MentorProfile.tsx` | Mentor profile, programs assigned |
| `/user-management/mentors/[mentorId]/[programId]` | `…/[programId]/page.tsx` → `mentors/MentorProgram.tsx` | Mentor's program: Overview, Performance |
| `/user-management/mentors/review/[applicationId]` | `mentors/review/…/page.tsx` → `mentors/MentorReview.tsx` | Review a mentor application |
| `/user-management/mentors/assign/[mentorId]` | `mentors/assign/…/page.tsx` → `mentors/MentorAssign.tsx` | Assign a mentor to programs |

`layout.tsx` cancels the shared `<main>` padding, because these pages set their own Figma padding.

## `_components/`

```
_components/
├── UserManagement.tsx        list page with the three tabs
├── students/                 student profile, program detail and its tab panels
├── mentors/                  mentors tab, mentor profile/program, review and assign flows
├── partners/                 partners tab
├── shared/                   filter drawer, action modals, success / reject dialogs
└── data/                     mock data and filter logic (students, mentors, partners, …)
```

Mock data lives in `data/`. Actions (approve, assign, suspend, …) only change browser state for now.
