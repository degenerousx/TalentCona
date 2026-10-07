"use client";

import { useLayoutEffect, useRef } from "react";

const STAGE_W = 1440;
const STAGE_H = 1024;
const MOBILE_BREAKPOINT = 900;

/** Scales a fixed 1440 × 1024 artboard to fit the viewport on desktop sizes. */
export default function ScaledStage({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    const stage = ref.current;
    if (!stage) return;
    const fit = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const scale = w < MOBILE_BREAKPOINT ? 1 : Math.min(w / STAGE_W, h / STAGE_H);
      stage.style.setProperty("--scale", String(scale));
      stage.dataset.scaled = "true";
    };
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, []);

  return (
    <main ref={ref} className={className}>
      {children}
    </main>
  );
}
