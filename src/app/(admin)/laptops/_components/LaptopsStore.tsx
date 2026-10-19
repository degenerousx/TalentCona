"use client";

import { createContext, useContext, useState } from "react";
import { initialLaptops, today, type Laptop, type LaptopDraft, type LaptopStatus } from "./data";

type LaptopsStore = {
  laptops: Laptop[];
  add: (draft: LaptopDraft, status: LaptopStatus) => void;
  update: (id: string, draft: LaptopDraft, status: LaptopStatus) => void;
  remove: (id: string) => void;
};

const Context = createContext<LaptopsStore | null>(null);

/**
 * Holds the inventory for every /laptops page (list, add, edit), so a laptop
 * added on /laptops/new shows up in the list. Mock state until the API exists;
 * it resets on a full page reload.
 */
export function LaptopsProvider({ children }: { children: React.ReactNode }) {
  const [laptops, setLaptops] = useState(initialLaptops);

  const store: LaptopsStore = {
    laptops,
    add: (draft, status) =>
      setLaptops((list) => [...list, { ...draft, id: `laptop-${Date.now()}`, status, updated: today() }]),
    update: (id, draft, status) =>
      setLaptops((list) => list.map((l) => (l.id === id ? { ...l, ...draft, status, updated: today() } : l))),
    remove: (id) => setLaptops((list) => list.filter((l) => l.id !== id)),
  };

  return <Context.Provider value={store}>{children}</Context.Provider>;
}

export function useLaptops() {
  const store = useContext(Context);
  if (!store) throw new Error("useLaptops must be used inside <LaptopsProvider> (laptops/layout.tsx)");
  return store;
}
