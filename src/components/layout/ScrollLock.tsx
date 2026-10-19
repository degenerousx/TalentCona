"use client";

import { useEffect } from "react";

/**
 * The shell is meant to be unscrollable, but `overflow: hidden` only hides the
 * scrollbar — the document, the <body> and the shell itself can all still be
 * scrolled programmatically (focus(), scrollIntoView(), the router's own scroll
 * handling). When that happens the header slides off-screen and a blank strip
 * appears at the bottom, with no scrollbar to undo it.
 *
 * So: listen for scroll on the capture phase (it fires for every element, not
 * just window) and snap these three boxes back to 0. Real scroll boxes inside
 * the page — <main>, the sidebar nav, tables — are untouched.
 */
export default function ScrollLock() {
  useEffect(() => {
    const boxes = () => [
      document.documentElement,
      document.body,
      document.getElementById("app-shell"),
    ];

    const reset = () => {
      for (const el of boxes()) {
        if (!el) continue;
        if (el.scrollTop !== 0) el.scrollTop = 0;
        if (el.scrollLeft !== 0) el.scrollLeft = 0;
      }
    };

    reset();
    window.addEventListener("scroll", reset, true);
    window.addEventListener("resize", reset);
    return () => {
      window.removeEventListener("scroll", reset, true);
      window.removeEventListener("resize", reset);
    };
  }, []);

  return null;
}
