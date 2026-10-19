"use client";

import { useRef } from "react";
import { cn } from "@/lib/cn";

export type TabItem<T extends string> = {
  id: T;
  label: string;
  /** Small pill after the label (Admissions & Routing). */
  count?: number;
};

type TabsProps<T extends string> = {
  /** Prefix for element ids, unique per page. */
  idBase: string;
  label: string;
  tabs: TabItem<T>[];
  value: T;
  onChange: (id: T) => void;
  /** Admissions uses regular-weight labels, the other modules medium. */
  weight?: "regular" | "medium";
  className?: string;
};

export const tabId = (idBase: string, id: string) => `${idBase}-tab-${id}`;
export const panelId = (idBase: string, id: string) => `${idBase}-panel-${id}`;

/**
 * Underlined tab strip from the Figma "Navigation" frames.
 * Implements the WAI-ARIA tabs pattern: arrow keys, Home and End move focus.
 */
export function Tabs<T extends string>({
  idBase,
  label,
  tabs,
  value,
  onChange,
  weight = "medium",
  className,
}: TabsProps<T>) {
  const refs = useRef<Array<HTMLButtonElement | null>>([]);

  const onKeyDown = (e: React.KeyboardEvent, index: number) => {
    const last = tabs.length - 1;
    const next =
      e.key === "ArrowRight" ? (index === last ? 0 : index + 1)
      : e.key === "ArrowLeft" ? (index === 0 ? last : index - 1)
      : e.key === "Home" ? 0
      : e.key === "End" ? last
      : null;
    if (next === null) return;
    e.preventDefault();
    refs.current[next]?.focus();
    onChange(tabs[next].id);
  };

  return (
    <div
      role="tablist"
      aria-label={label}
      className={cn(
        "flex gap-8 overflow-x-auto border-b border-gray-300 pl-6 [scrollbar-width:none]",
        className,
      )}
    >
      {tabs.map((tab, i) => {
        const selected = tab.id === value;
        return (
          <button
            key={tab.id}
            ref={(el) => {
              refs.current[i] = el;
            }}
            type="button"
            role="tab"
            id={tabId(idBase, tab.id)}
            aria-selected={selected}
            aria-controls={panelId(idBase, tab.id)}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(tab.id)}
            onKeyDown={(e) => onKeyDown(e, i)}
            className={cn(
              "-mb-px flex h-[58px] shrink-0 items-center gap-2 border-b-2 px-1.5 text-base leading-6 whitespace-nowrap transition-colors",
              weight === "medium" && "font-medium",
              selected
                ? "border-primary text-primary"
                : cn(
                    "border-transparent hover:text-primary",
                    weight === "medium" ? "text-slate-900" : "text-gray-600",
                  ),
            )}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-xs leading-4 font-normal",
                  selected ? "bg-primary-soft text-primary" : "bg-gray-100 text-gray-600",
                )}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

type TabPanelProps = {
  idBase: string;
  id: string;
  className?: string;
  children: React.ReactNode;
};

export function TabPanel({ idBase, id, className, children }: TabPanelProps) {
  return (
    <div
      role="tabpanel"
      id={panelId(idBase, id)}
      aria-labelledby={tabId(idBase, id)}
      tabIndex={0}
      className={cn("focus:outline-none", className)}
    >
      {children}
    </div>
  );
}
