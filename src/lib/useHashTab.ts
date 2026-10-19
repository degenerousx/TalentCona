"use client";

import { useCallback, useSyncExternalStore } from "react";

// replaceState doesn't fire "hashchange", so setTab announces its own changes.
const TAB_EVENT = "hashtab";

function subscribe(onChange: () => void) {
  window.addEventListener("hashchange", onChange);
  window.addEventListener(TAB_EVENT, onChange);
  return () => {
    window.removeEventListener("hashchange", onChange);
    window.removeEventListener(TAB_EVENT, onChange);
  };
}

const readHash = () => window.location.hash.slice(1);
const serverHash = () => "";

/**
 * Tab state kept in the URL hash (e.g. `#mentors`), so links and Back return
 * to the same tab. The first tab is the default and has no hash.
 *
 * Pass a module-level array so its identity stays stable.
 */
export function useHashTab<T extends string>(tabs: readonly T[]): [T, (tab: T) => void] {
  const hash = useSyncExternalStore(subscribe, readHash, serverHash);
  const tab = (tabs as readonly string[]).includes(hash) ? (hash as T) : tabs[0];

  const setTab = useCallback(
    (next: T) => {
      const { pathname, search } = window.location;
      window.history.replaceState(null, "", next === tabs[0] ? pathname + search : `#${next}`);
      window.dispatchEvent(new Event(TAB_EVENT));
    },
    [tabs],
  );

  return [tab, setTab];
}
