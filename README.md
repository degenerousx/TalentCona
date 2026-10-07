# TalentCona

Next.js (App Router, TypeScript) front end for TalentCona.

## Getting started

```bash
npm install
npm run dev      # http://localhost:3000
```

## Pages

| Route      | Design            |
| ---------- | ----------------- |
| `/sign-in` | Universal Sign In |
| `/forgot-password` | Forgot Password |
| `/reset-password` | Reset Password |
| `/dashboard` | Admin Dashboard |
| `/user-management` | User Management (Students tab with search and the Filter drawer; Mentors tab with stats and the Pending / Assigned / Unassigned tables; Partners tab with search and partner cards) |
| `/user-management/[studentId]` | Student profile (one page per student) |
| `/user-management/mentors/review/[applicationId]` | Mentor Details for a pending application: profile, expertise, system rating, reviewer trophy rating, Reject (asks for feedback first, `RejectDialog.tsx`) / Approve, each followed by a success dialog (`SuccessDialog.tsx`) |
| `/user-management/mentors/[mentorId]` | A mentor's profile: header with Edit Role / Notify / Suspend and the Programs Assigned card |
| `/user-management/mentors/[mentorId]/[programId]` | A mentor's program: Overview (recent activity, expertise, avg session, response time, last active) and Performance (sessions, avg duration, response time, satisfaction, current mentees) tabs |
| `/user-management/[studentId]/[programId]` | A student's program: Overview, Performance, Engagement, Loan and Campaign tabs |
| `/financial-ops` | Placeholder (design pending) |

Sign In → Dashboard; the sidebar's Logout returns to Sign In.

Password flow: Sign In → "Forgot password?" → Proceed → Reset Password → Proceed → success modal → Login → Sign In. The Proceed steps always succeed until the backend (reset email, token) is wired up.

`/` redirects to `/sign-in` for now.

## Structure

- `app/` — routes (`app/sign-in/page.tsx`), root layout and global styles
- `components/auth/AuthShell.tsx` — shared 1440 × 1024 auth artboard (waves, logo, illustration, badges); reuse it for sign-up / forgot-password screens
- `components/auth/SignInForm.tsx` — the sign-in card
- `components/auth/ForgotPasswordForm.tsx` — the forgot-password card
- `components/auth/ResetPasswordForm.tsx` — the reset-password card
- `components/auth/SuccessModal.tsx` — reusable success dialog (shown after a password reset)
- `app/(app)/` — signed-in routes sharing `components/app/AppShell.tsx` (header, collapsible sidebar)
- `components/users/` — User Management (tabs, search, students table, `FilterPanel.tsx` drawer (its shared parts also build the mentor drawers in `MentorFilterPanel.tsx`, with `mentorFilters.ts` logic) with `filters.ts` logic, `PartnersPanel.tsx` with `partners.ts`, `MentorsPanel.tsx` (each table's Filters button opens its own drawer), `MentorReview.tsx` (with `mentorApplications.ts`), `MentorProfile.tsx` and `MentorProgram.tsx` (with `MentorPerformance.tsx`) and the shared `MentorHero.tsx` header and `mentors.ts` data) `StudentProfile.tsx`, `ProgramDetail.tsx` (with `PerformancePanel.tsx`, `EngagementPanel.tsx`, `LoanPanel.tsx` and `CampaignPanel.tsx`) and the shared `StudentHero.tsx` header (its Assign Mentor, Notify and Suspend buttons open the dialogs in `ActionModals.tsx`); `data.ts` holds placeholder student records
- `components/dashboard/` — dashboard widgets; `data.ts` holds the placeholder figures and `GrowthChart.tsx` the area chart
- `components/icons/`, `components/app/icons.tsx` — inline SVG icons
- `public/images/` — design assets

Desktop screens render on a 1440 × 1024 artboard scaled to the viewport; below 900px wide they switch to a stacked mobile layout.

`PREVIEW_EXPORT=1 npm run build` writes a static export to `out/` for sharing previews.
