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
| `/user-management` | User Management (Students tab; Mentors/Partners pending) |
| `/user-management/[studentId]` | Student profile (one page per student) |
| `/user-management/[studentId]/[programId]` | A student's program: Overview, Performance, Engagement and Loan tabs (Campaign pending) |
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
- `components/users/` — User Management (tabs, search, students table) `StudentProfile.tsx`, `ProgramDetail.tsx` (with `PerformancePanel.tsx`, `EngagementPanel.tsx` and `LoanPanel.tsx`) and the shared `StudentHero.tsx` header; `data.ts` holds placeholder student records
- `components/dashboard/` — dashboard widgets; `data.ts` holds the placeholder figures and `GrowthChart.tsx` the area chart
- `components/icons/`, `components/app/icons.tsx` — inline SVG icons
- `public/images/` — design assets

Desktop screens render on a 1440 × 1024 artboard scaled to the viewport; below 900px wide they switch to a stacked mobile layout.

`PREVIEW_EXPORT=1 npm run build` writes a static export to `out/` for sharing previews.
