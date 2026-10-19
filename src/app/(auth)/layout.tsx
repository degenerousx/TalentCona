/**
 * Sign-in, forgot and reset password: no admin header or sidebar.
 *
 * No scroll box here — AuthShell is exactly one viewport tall and its card
 * scrolls internally if the window is too short, so the page never scrolls.
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return children;
}
