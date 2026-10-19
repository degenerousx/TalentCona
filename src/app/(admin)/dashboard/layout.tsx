/**
 * This module's CSS sets its own page padding to match Figma exactly, so cancel
 * the shared <main> padding (px-12 py-8 in MainScroll) instead of doubling it.
 */
export default function ModuleLayout({ children }: { children: React.ReactNode }) {
  return <div className="-mx-12 -my-8">{children}</div>;
}
