"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, EllipsisVertical, type LucideIcon } from "lucide-react";
import { Pill } from "@/components/ui/Pill";
import { tabId, panelId } from "@/components/ui/Tabs";
import { cn } from "@/lib/cn";

/** Closes a popover on outside click or Escape. */
function usePopover() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return { open, setOpen, ref };
}

const menuClasses =
  "absolute top-full right-0 z-20 mt-1 flex w-53.75 flex-col gap-1 rounded-lg bg-white p-2 shadow-sm";
const itemClasses =
  "rounded-md px-1 py-1 text-left text-sm leading-4 text-gray-600 hover:bg-gray-50 hover:text-gray-900";

export type MenuItem = { label: string; onSelect: () => void; danger?: boolean };

/**
 * The ⋮ button with its dropdown (Figma "Filter" frames 293:33497 and siblings).
 * The menu is `fixed` so table wrappers with overflow don't clip it; it closes
 * when anything scrolls rather than drifting away from its button.
 */
export function ActionMenu({ label, items }: { label: string; items: MenuItem[] }) {
  const { open, setOpen, ref } = usePopover();
  const [pos, setPos] = useState<React.CSSProperties>({});

  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    return () => {
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    };
  }, [open, setOpen]);

  return (
    <div ref={ref} className="relative w-fit" onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          const right = window.innerWidth - r.right;
          // Open upwards when there isn't room for the menu below the button.
          const roomBelow = window.innerHeight - r.bottom > 40 * items.length + 24;
          setPos(roomBelow ? { top: r.bottom + 4, right } : { bottom: window.innerHeight - r.top + 4, right, top: "auto" });
          setOpen((o) => !o);
        }}
        className="grid size-8 place-items-center rounded-lg text-gray-900 hover:bg-gray-100"
      >
        <EllipsisVertical aria-hidden className="size-4" />
      </button>
      {open && (
        <div role="menu" style={pos} className={cn(menuClasses, "fixed mt-0")}>
          {items.map((item) => (
            <button
              key={item.label}
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                item.onSelect();
              }}
              className={cn(itemClasses, item.danger && "text-red-600 hover:text-red-700")}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/** "All Statuses" dropdown on the Members tab (Figma 293:33486). */
export function SelectMenu<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { id: T; label: string }[];
  value: T;
  onChange: (id: T) => void;
}) {
  const { open, setOpen, ref } = usePopover();
  const current = options.find((o) => o.id === value)?.label;
  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-label={label}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="flex h-10.25 items-center gap-8 rounded-[10px] border border-gray-300 bg-white px-3 text-base text-slate-500"
      >
        {current}
        <ChevronDown aria-hidden className="size-5 text-slate-900" />
      </button>
      {open && (
        <div role="listbox" aria-label={label} className={menuClasses}>
          {options.map((o) => (
            <button
              key={o.id}
              type="button"
              role="option"
              aria-selected={o.id === value}
              onClick={() => {
                onChange(o.id);
                setOpen(false);
              }}
              className={cn(itemClasses, o.id === value && "font-medium text-gray-900")}
            >
              {o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

const statusStyles: Record<string, string> = {
  active: "bg-green-100 text-green-800",
  suspended: "bg-red-100 text-red-800",
  inactive: "bg-gray-100 text-gray-800",
  muted: "bg-orange-100 text-orange-800",
};

/**
 * Channel statuses are capitalised in Figma ("Active"), member ones are not
 * ("active", "Suspended"), so the caller passes the label.
 */
export function StatusPill({ status, children }: { status: string; children: React.ReactNode }) {
  return <Pill tone="neutral" className={cn("px-3 py-1", statusStyles[status])}>{children}</Pill>;
}

/** Round lilac avatar with a single initial (Figma 293:33208). */
export function Initial({ name, size = "md" }: { name: string; size?: "md" | "lg" }) {
  return (
    <span
      aria-hidden
      className={cn(
        "grid shrink-0 place-items-center rounded-full bg-purple-100 font-semibold text-purple-600",
        size === "md" ? "size-10 text-base" : "size-12 text-lg",
      )}
    >
      {name[0]?.toUpperCase()}
    </span>
  );
}

export function PersonCell({ name, email }: { name: string; email: string }) {
  return (
    <div className="flex items-center gap-3">
      <Initial name={name} />
      <div className="min-w-0">
        <p className="truncate text-base leading-6 font-medium text-gray-900">{name}</p>
        <p className="truncate text-sm leading-5 text-gray-500">{email}</p>
      </div>
    </div>
  );
}

export type IconTab<T extends string> = { id: T; label: string; icon: LucideIcon };

/** Overview / Channels / Members strip. Same ARIA pattern as ui/Tabs, plus icons. */
export function IconTabs<T extends string>({
  idBase,
  tabs,
  value,
  onChange,
}: {
  idBase: string;
  tabs: IconTab<T>[];
  value: T;
  onChange: (id: T) => void;
}) {
  const refs = useRef<Array<HTMLButtonElement | null>>([]);

  const onKeyDown = (e: React.KeyboardEvent, index: number) => {
    const last = tabs.length - 1;
    const next =
      e.key === "ArrowRight" ? (index === last ? 0 : index + 1)
      : e.key === "ArrowLeft" ? (index === 0 ? last : index - 1)
      : null;
    if (next === null) return;
    e.preventDefault();
    refs.current[next]?.focus();
    onChange(tabs[next]!.id);
  };

  return (
    <div
      role="tablist"
      aria-label="Community sections"
      className="flex gap-8 overflow-x-auto border-b border-gray-300 bg-white px-8 scrollbar-none"
    >
      {tabs.map(({ id, label, icon: Icon }, i) => {
        const selected = id === value;
        return (
          <button
            key={id}
            ref={(el) => {
              refs.current[i] = el;
            }}
            type="button"
            role="tab"
            id={tabId(idBase, id)}
            aria-selected={selected}
            aria-controls={panelId(idBase, id)}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(id)}
            onKeyDown={(e) => onKeyDown(e, i)}
            className={cn(
              "-mb-px flex h-14.5 shrink-0 items-center gap-2 border-b-2 text-base leading-6 font-medium whitespace-nowrap transition-colors",
              selected ? "border-primary text-primary" : "border-transparent text-gray-600 hover:text-primary",
            )}
          >
            <Icon aria-hidden className="size-4.5" />
            {label}
          </button>
        );
      })}
    </div>
  );
}

export const tableClasses = {
  wrap: "overflow-x-auto rounded-lg border border-gray-200 bg-white",
  table: "w-full min-w-180 border-collapse text-left",
  head: "bg-gray-50 text-xs leading-4 font-medium tracking-[0.6px] text-gray-500 uppercase",
  th: "px-6 py-3 font-medium",
  row: "border-t border-gray-200",
  td: "px-6 py-4 text-sm leading-5 text-gray-900",
};
