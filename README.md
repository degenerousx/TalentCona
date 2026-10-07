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

`/` redirects to `/sign-in` for now.

## Structure

- `app/` — routes (`app/sign-in/page.tsx`), root layout and global styles
- `components/auth/AuthShell.tsx` — shared 1440 × 1024 auth artboard (waves, logo, illustration, badges); reuse it for sign-up / forgot-password screens
- `components/auth/SignInForm.tsx` — the sign-in card
- `components/auth/ForgotPasswordForm.tsx` — the forgot-password card
- `components/icons/` — inline SVG icons
- `public/images/` — design assets

Desktop screens render on a 1440 × 1024 artboard scaled to the viewport; below 900px wide they switch to a stacked mobile layout.

`PREVIEW_EXPORT=1 npm run build` writes a static export to `out/` for sharing previews.
