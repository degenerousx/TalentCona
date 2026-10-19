"use client";

import { Download, Search } from "lucide-react";
import { Card } from "./Card";
import { Button } from "./Button";
import { cn } from "@/lib/cn";

type SearchInputProps = {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
};

export function SearchInput({ label, placeholder, value, onChange }: SearchInputProps) {
  return (
    <div className="relative min-w-0 flex-1">
      <Search
        aria-hidden
        className="pointer-events-none absolute top-1/2 left-3 size-5 -translate-y-1/2 text-muted"
        strokeWidth={1.67}
      />
      <input
        type="search"
        aria-label={label}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-[42px] w-full rounded-lg border border-hairline bg-white py-2 pr-4 pl-10 text-base text-slate-700 placeholder:text-slate-700 focus:border-accent focus:outline-none"
      />
    </div>
  );
}

export type FilterOption<T extends string> = { id: T; label: string };

type FilterChipsProps<T extends string> = {
  label: string;
  options: FilterOption<T>[];
  value: T;
  onChange: (id: T) => void;
};

/** Single-select chip group ("All (6)", "Available (3)"…). */
export function FilterChips<T extends string>({ label, options, value, onChange }: FilterChipsProps<T>) {
  return (
    <div role="group" aria-label={label} className="flex flex-wrap gap-2">
      {options.map((o) => {
        const active = o.id === value;
        return (
          <button
            key={o.id}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(o.id)}
            className={cn(
              "h-9 rounded-lg px-4 text-sm leading-5 font-medium transition-colors",
              active ? "bg-accent text-white" : "bg-hairline text-muted hover:text-slate-700",
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

type ListToolbarProps = {
  search: React.ReactNode;
  filters: React.ReactNode;
  exportLabel: string;
  onExport: () => void;
};

/** White bar holding search, filter chips and the export button. */
export function ListToolbar({ search, filters, exportLabel, onExport }: ListToolbarProps) {
  return (
    <Card tone="hairline" className="flex flex-col gap-4 p-6 lg:flex-row lg:items-center lg:gap-6">
      {search}
      <div className="flex flex-wrap items-center justify-between gap-4 lg:gap-6">
        {filters}
        <Button
          variant="outline-accent"
          onClick={onExport}
          icon={<Download aria-hidden className="size-4" strokeWidth={1.33} />}
          className="font-medium"
        >
          {exportLabel}
        </Button>
      </div>
    </Card>
  );
}
