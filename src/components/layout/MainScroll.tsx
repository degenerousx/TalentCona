"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

/**
 * The <main> scroll box lives in the layout, so it survives route changes and
 * would otherwise open the next module already scrolled halfway down. Reset it
 * on navigation — but only this box, never the document.
 */
export default function MainScroll({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const ref = useRef<HTMLElement | null>(null);

  useEffect(() => {
    ref.current?.scrollTo({ top: 0 });
  }, [pathname]);

  // min-w-0 lets <main> shrink below its content's natural width, so wide
  // children (e.g. DataTable's 720px minimum) scroll inside their own box
  // instead of stretching the page sideways.
  return (
    // 16px gutters on phones, the design's 48px from md up (modules that cancel it match: -mx-4 md:-mx-12).
    <main ref={ref} className="min-w-0 flex-1 overflow-y-auto px-4 py-6 md:px-12 md:py-8">
      {children}
    </main>
  );
}
