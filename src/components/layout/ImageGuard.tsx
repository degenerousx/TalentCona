"use client";

import { useEffect } from "react";

/**
 * Blocks the right-click menu ("Save image as…") and drag-and-drop on every
 * image in the app, including ones added later. The rest of the page keeps its
 * normal right-click menu. Rendered once in the root layout; see globals.css
 * for the CSS half (dragging in WebKit, long-press on phones).
 *
 * This deters casual saving only — screenshots and developer tools can't be blocked.
 */
export default function ImageGuard() {
  useEffect(() => {
    const isImage = (target: EventTarget | null) =>
      target instanceof Element && target.closest("img, picture, svg image") !== null;
    const block = (e: Event) => {
      if (isImage(e.target)) e.preventDefault();
    };
    document.addEventListener("contextmenu", block);
    document.addEventListener("dragstart", block);
    return () => {
      document.removeEventListener("contextmenu", block);
      document.removeEventListener("dragstart", block);
    };
  }, []);

  return null;
}
