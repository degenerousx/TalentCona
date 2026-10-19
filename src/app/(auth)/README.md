# Auth

- **Routes:** `/sign-in`, `/forgot-password`, `/reset-password` (`/` redirects to `/sign-in`)
- **Design:** [Figma section "Authentication"](https://www.figma.com/design/q8WJ8duI2FR5mc7ESAcUhi/Talent-cona-Admin-Portal--Copy-?node-id=293-7246) — the "Universal Sign In" frames. The older "Sign Up" frames in other copies of the file are outdated.

These pages sit outside `(admin)`, so they have no header or sidebar. `layout.tsx` lets them scroll on small screens.
Styling is CSS Modules (`*.module.css` next to each component).

## Pages

| Route | File | Screen |
| --- | --- | --- |
| `/sign-in` | `sign-in/page.tsx` → `_components/SignInForm.tsx` | Welcome Back form |
| `/forgot-password` | `forgot-password/page.tsx` → `_components/ForgotPasswordForm.tsx` | Request a reset email |
| `/reset-password` | `reset-password/page.tsx` → `_components/ResetPasswordForm.tsx` | New password, then the "Congratulations!" modal (`_components/SuccessModal.tsx`) |

- `_components/AuthShell.tsx` — the responsive page layout (Tailwind). Two columns at Figma width (illustration 569px, card 567px) with Figma side margins. Each column has flexible spacers in the Figma ratio of space above/below it (never less than a minimum margin), so a 1440 × 1024 window shows the Figma layout and any other window fits without scrolling. Type and the card stay at design size; the illustration is what shrinks on short windows. Below `lg` (1024px) it stacks: logo, then card.
- `_components/AuthArt.tsx` — the Figma artwork as SVG: purple band, line art, dots and stars (`BandArt`), and the waves behind and in front of the illustration (`BackWaves`, `FrontWave`). Paths are exported from Figma; AuthShell places them in Figma coordinates relative to the logo and illustration.
- `_components/icons.tsx` — icons used only by these pages.

Admins can't create their own accounts, so there is no sign-up link and no Google sign-in.

## Sign-in flow

Sign In calls `login()` (`src/lib/auth.ts`), then goes to `/verify-identity` (`_components/MfaForm.tsx`, no Figma frame yet):

- **Already enrolled** (`mfaChallengePurpose: "verify"`): enter the 6-digit authenticator code.
- **First sign-in**: scan the QR code (or type the key), then enter the first code.

Either way the admin lands on `?next=` (set by the admin layout's gate) or `/dashboard`. Reloading `/verify-identity` returns to sign-in — the challenge is kept in memory only.

## Password reset

- `/forgot-password` → `POST /auth/forgot-password { email }`, then a "Check Your Email" message (no Figma frame). The backend returns 200 for unknown emails too, so the message never confirms an account exists.
- `/reset-password?token=…` → `POST /auth/reset-password { token, newPassword }`, then the success modal. A bad or expired token is a 401 ("Invalid or expired reset token") and offers a new link; 400s show the backend's message (e.g. new password same as current). Minimum 8 characters.
- **Unverified:** that the emailed link points at this portal with `?token=`. The backend builds the link — confirm with the backend team, or request a reset and inspect the email.
