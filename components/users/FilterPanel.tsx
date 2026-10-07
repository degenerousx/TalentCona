"use client";

import { useCallback, useEffect, useId, useRef, useState, type ReactNode } from "react";
import { CalendarIcon, CheckboxIcon, ChevronDownBoldIcon, FilterIcon, SearchIcon, XIcon } from "@/components/app/icons";
import { EMPTY_FILTERS, type StudentFilters } from "./filters";
import styles from "./FilterPanel.module.css";

type Options = Record<"programs" | "statuses" | "methods" | "laptop" | "instructors" | "advisors", string[]>;
type ListKey = keyof Options;

export type SelectProps = {
  label: string;
  allLabel: string;
  options: string[];
  selected: string[];
  onChange: (next: string[]) => void;
  open: boolean;
  onToggle: () => void;
  searchPlaceholder?: string;
  /** Let the list shrink to its options (the mentor rating lists are only 99px wide). */
  compact?: boolean;
};

export function MultiSelect({ label, allLabel, options, selected, onChange, open, onToggle, searchPlaceholder, compact }: SelectProps) {
  const id = useId();
  const [search, setSearch] = useState("");
  const popRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    setSearch("");
    popRef.current?.scrollIntoView({ block: "nearest" });
  }, [open]);

  const q = search.trim().toLowerCase();
  const visible = q ? options.filter((o) => o.toLowerCase().includes(q)) : options;
  const summary = selected.length === 0 ? allLabel : selected.length === 1 ? selected[0] : `${selected.length} selected`;
  const toggle = (o: string) => onChange(selected.includes(o) ? selected.filter((s) => s !== o) : [...selected, o]);

  return (
    <div className={styles.field}>
      <span className={styles.label} id={`${id}-label`}>
        {label}
      </span>
      <div className={styles.selectWrap}>
        <button
          type="button"
          className={styles.dropdown}
          aria-haspopup="true"
          aria-expanded={open}
          aria-controls={`${id}-pop`}
          aria-labelledby={`${id}-label ${id}-value`}
          onClick={onToggle}
        >
          <span id={`${id}-value`} className={selected.length ? styles.valueSet : styles.value}>
            {summary}
          </span>
          <span className={styles.chevron}>
            <ChevronDownBoldIcon />
          </span>
        </button>

        {open && (
          <div ref={popRef} id={`${id}-pop`} className={`${styles.popover} ${compact ? styles.popoverCompact : ""}`} role="group" aria-labelledby={`${id}-label`}>
            {searchPlaceholder && (
              <label className={styles.popSearch}>
                <span className={styles.popSearchIcon}>
                  <SearchIcon size={20} />
                </span>
                <input
                  type="text"
                  placeholder={searchPlaceholder}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  aria-label={searchPlaceholder.replace("...", "")}
                  autoFocus
                />
              </label>
            )}
            <button type="button" className={styles.allOption} onClick={() => onChange([])}>
              {allLabel}
            </button>
            {visible.map((o) => (
              <label key={o} className={styles.option}>
                <input type="checkbox" className={styles.srOnly} checked={selected.includes(o)} onChange={() => toggle(o)} />
                <CheckboxIcon checked={selected.includes(o)} />
                <span>{o}</span>
              </label>
            ))}
            {visible.length === 0 && <p className={styles.noMatch}>No matches</p>}
          </div>
        )}
      </div>
    </div>
  );
}

export function RangeField({
  label,
  type,
  from,
  to,
  onFrom,
  onTo,
}: {
  label: string;
  type: "date" | "number";
  from: string;
  to: string;
  onFrom: (v: string) => void;
  onTo: (v: string) => void;
}) {
  const id = useId();
  const input = (part: "From" | "To", value: string, set: (v: string) => void) => (
    <div className={styles.rangePart}>
      <label className={styles.subLabel} htmlFor={`${id}-${part}`}>
        {part}
      </label>
      <div className={styles.inputWrap}>
        <input
          id={`${id}-${part}`}
          type={type}
          min={type === "number" ? 0 : undefined}
          inputMode={type === "number" ? "decimal" : undefined}
          className={`${styles.input} ${type === "date" ? styles.dateInput : ""} ${value ? "" : styles.empty}`}
          value={value}
          onChange={(e) => set(e.target.value)}
          aria-label={`${label} ${part.toLowerCase()}`}
        />
        {type === "date" && (
          <span className={styles.calendar}>
            <CalendarIcon size={24} color="#364153" strokeWidth={1.33} />
          </span>
        )}
      </div>
    </div>
  );

  return (
    <div className={`${styles.field} ${styles.rangeField}`}>
      <span className={`${styles.label} ${styles.labelShift}`}>{label}</span>
      <div className={styles.range}>
        {input("From", from, onFrom)}
        {input("To", to, onTo)}
      </div>
    </div>
  );
}

/** Text field with suggestions, e.g. the mentor Expertise filter. */
export function TextField({
  label,
  value,
  onChange,
  suggestions = [],
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  suggestions?: string[];
}) {
  const id = useId();
  return (
    <div className={styles.field}>
      <label className={styles.label} htmlFor={id}>
        {label}
      </label>
      <input
        id={id}
        type="text"
        className={`${styles.input} ${styles.textInput}`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        list={suggestions.length ? `${id}-list` : undefined}
        autoComplete="off"
      />
      {suggestions.length > 0 && (
        <datalist id={`${id}-list`}>
          {suggestions.map((s) => (
            <option key={s} value={s} />
          ))}
        </datalist>
      )}
    </div>
  );
}

/**
 * The Filter drawer shell: header, scrolling body and Reset / Apply footer.
 * `listOpen` / `onCloseList` let Escape and outside clicks close an open dropdown first.
 */
export function FilterDrawer({
  listOpen,
  onCloseList,
  onClose,
  onReset,
  onApply,
  variant = "students",
  children,
}: {
  listOpen: boolean;
  onCloseList: () => void;
  onClose: () => void;
  onReset: () => void;
  onApply: () => void;
  /** Mentor drawers fit their content and use the purple Apply button. */
  variant?: "students" | "mentors";
  children: ReactNode;
}) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (listOpen) onCloseList();
      else onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [listOpen, onCloseList, onClose]);

  useEffect(() => {
    panelRef.current?.focus();
  }, []);

  return (
    <div className={styles.overlay} onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div
        ref={panelRef}
        className={`${styles.panel} ${variant === "mentors" ? styles.mentors : ""}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="filter-title"
        tabIndex={-1}
        onMouseDown={(e) => {
          // Clicking anywhere outside an open list closes it.
          if (listOpen && !(e.target as HTMLElement).closest(`.${styles.selectWrap}`)) onCloseList();
        }}
      >
        <header className={styles.header}>
          <h2 id="filter-title" className={styles.title}>
            <FilterIcon size={24} color="#101828" strokeWidth={1.67} />
            <span>Filter</span>
          </h2>
          <button type="button" className={styles.close} onClick={onClose} aria-label="Close filters">
            <XIcon size={20} color="#4A5565" strokeWidth={1.67} />
          </button>
        </header>

        <div className={styles.body}>{children}</div>

        <footer className={styles.footer}>
          <button
            type="button"
            className={styles.reset}
            onClick={() => {
              onReset();
              onCloseList();
            }}
          >
            Reset
          </button>
          <button type="button" className={styles.apply} onClick={onApply}>
            Apply Filters
          </button>
        </footer>
      </div>
    </div>
  );
}

export default function FilterPanel({
  initial,
  options,
  onApply,
  onClose,
}: {
  initial: StudentFilters;
  options: Options;
  onApply: (f: StudentFilters) => void;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState<StudentFilters>(initial);
  const [openList, setOpenList] = useState<ListKey | null>(null);
  const closeList = useCallback(() => setOpenList(null), []);

  const set = <K extends keyof StudentFilters>(key: K, value: StudentFilters[K]) => setDraft((d) => ({ ...d, [key]: value }));

  const select = (key: ListKey, label: string, allLabel: string, searchPlaceholder?: string) => (
    <MultiSelect
      label={label}
      allLabel={allLabel}
      options={options[key]}
      selected={draft[key]}
      onChange={(v) => set(key, v)}
      open={openList === key}
      onToggle={() => setOpenList((o) => (o === key ? null : key))}
      searchPlaceholder={searchPlaceholder}
    />
  );

  return (
    <FilterDrawer listOpen={openList !== null} onCloseList={closeList} onClose={onClose} onReset={() => setDraft(EMPTY_FILTERS)} onApply={() => onApply(draft)}>
      <RangeField
        label="Join Date"
        type="date"
        from={draft.joinFrom}
        to={draft.joinTo}
        onFrom={(v) => set("joinFrom", v)}
        onTo={(v) => set("joinTo", v)}
      />
      {select("programs", "Programs", "All Programs", "Search programs...")}
      {select("statuses", "Status", "All Statuses")}
      {select("methods", "Method of Payment", "All Methods")}
      <RangeField
        label="Amount Paid"
        type="number"
        from={draft.amountFrom}
        to={draft.amountTo}
        onFrom={(v) => set("amountFrom", v)}
        onTo={(v) => set("amountTo", v)}
      />
      {select("laptop", "Laptop Status", "All Statuses")}
      {select("instructors", "Instructor", "All Instructors", "Search program instructors...")}
      {select("advisors", "Program Advisor", "All Program Advisors", "Search program advisors...")}
    </FilterDrawer>
  );
}
