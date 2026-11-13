"use client";

import { useCallback, useState } from "react";
import { FilterDrawer, MultiSelect, RangeField, TextField, type FilterOption } from "../shared/FilterPanel";
import {
  CAPACITY_OPTIONS,
  EMPTY_ASSIGNED_FILTERS,
  EMPTY_CANDIDATE_FILTERS,
  RATING_OPTIONS,
  APPLICATION_STATUS_OPTIONS,
  type AssignedFilters,
  type CandidateFilters,
} from "../filters";

/** Common expertise areas from the mentor application (the API filters by their slug). */
const EXPERTISE_SUGGESTIONS = [
  "Frontend Development",
  "Backend Development",
  "Full Stack Development",
  "Mobile Development",
  "UI/UX Design",
  "Data Science",
  "DevOps",
  "System Architecture",
  "API Development",
  "Code Review",
  "Agile/Scrum",
  "Game Development",
];

/** Keeps one dropdown open at a time within a drawer. */
function useOpenList<K extends string>() {
  const [openList, setOpenList] = useState<K | null>(null);
  const closeList = useCallback(() => setOpenList(null), []);
  const toggle = (key: K) => () => setOpenList((o) => (o === key ? null : key));
  return { openList, closeList, toggle };
}

/** Pending Reviews (system rating only) and Unassigned Mentors (plus admin rating). */
export function CandidateFilterPanel({
  initial,
  withAdminRating,
  withStatuses = false,
  onApply,
  onClose,
}: {
  initial: CandidateFilters;
  withAdminRating: boolean;
  /** Applications by Status: adds the Application Status filter (several can be picked). */
  withStatuses?: boolean;
  onApply: (f: CandidateFilters) => void;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState(initial);
  const { openList, closeList, toggle } = useOpenList<"system" | "admin" | "status">();
  const set = <K extends keyof CandidateFilters>(key: K, value: CandidateFilters[K]) => setDraft((d) => ({ ...d, [key]: value }));

  return (
    <FilterDrawer
      variant="mentors"
      listOpen={openList !== null}
      onCloseList={closeList}
      onClose={onClose}
      onReset={() => setDraft(EMPTY_CANDIDATE_FILTERS)}
      onApply={() => onApply(draft)}
    >
      {withStatuses && (
        <MultiSelect
          label="Application Status"
          allLabel="All Statuses"
          options={APPLICATION_STATUS_OPTIONS}
          selected={draft.statuses}
          onChange={(v) => set("statuses", v)}
          open={openList === "status"}
          onToggle={toggle("status")}
        />
      )}
      <TextField label="Expertise" value={draft.expertise} onChange={(v) => set("expertise", v)} suggestions={EXPERTISE_SUGGESTIONS} />
      <RangeField
        label="Total Experience"
        type="number"
        from={draft.experienceFrom}
        to={draft.experienceTo}
        onFrom={(v) => set("experienceFrom", v)}
        onTo={(v) => set("experienceTo", v)}
      />
      <MultiSelect
        label="System Rating"
        allLabel="All Ratings"
        options={RATING_OPTIONS}
        selected={draft.systemRatings}
        onChange={(v) => set("systemRatings", v)}
        open={openList === "system"}
        onToggle={toggle("system")}
        compact
        single
      />
      {withAdminRating && (
        <MultiSelect
          label="Admin Rating"
          allLabel="All Ratings"
          options={RATING_OPTIONS}
          selected={draft.adminRatings}
          onChange={(v) => set("adminRatings", v)}
          open={openList === "admin"}
          onToggle={toggle("admin")}
          compact
          single
        />
      )}
    </FilterDrawer>
  );
}

export function AssignedFilterPanel({
  initial,
  programs,
  programsNote,
  onApply,
  onClose,
}: {
  initial: AssignedFilters;
  programs: FilterOption[];
  /** "Loading programs…" / error text for the Programs list. */
  programsNote?: string;
  onApply: (f: AssignedFilters) => void;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState(initial);
  const { openList, closeList, toggle } = useOpenList<"programs" | "capacity" | "rating">();
  const set = <K extends keyof AssignedFilters>(key: K, value: AssignedFilters[K]) => setDraft((d) => ({ ...d, [key]: value }));

  return (
    <FilterDrawer
      variant="mentors"
      listOpen={openList !== null}
      onCloseList={closeList}
      onClose={onClose}
      onReset={() => setDraft(EMPTY_ASSIGNED_FILTERS)}
      onApply={() => onApply(draft)}
    >
      <RangeField
        label="Date Approved"
        type="date"
        from={draft.approvedFrom}
        to={draft.approvedTo}
        onFrom={(v) => set("approvedFrom", v)}
        onTo={(v) => set("approvedTo", v)}
      />
      <MultiSelect
        label="Programs"
        allLabel="All Programs"
        options={programs}
        selected={draft.programs}
        onChange={(v) => set("programs", v)}
        open={openList === "programs"}
        onToggle={toggle("programs")}
        searchPlaceholder="Search programs..."
        note={programsNote}
      />
      <MultiSelect
        label="Capacity"
        allLabel="All"
        options={CAPACITY_OPTIONS}
        selected={draft.capacities}
        onChange={(v) => set("capacities", v)}
        open={openList === "capacity"}
        onToggle={toggle("capacity")}
        compact
        single
      />
      <RangeField
        label="Number of Mentees"
        type="number"
        from={draft.menteesFrom}
        to={draft.menteesTo}
        onFrom={(v) => set("menteesFrom", v)}
        onTo={(v) => set("menteesTo", v)}
      />
      <MultiSelect
        label="Average Rating"
        allLabel="All Ratings"
        options={RATING_OPTIONS}
        selected={draft.ratings}
        onChange={(v) => set("ratings", v)}
        open={openList === "rating"}
        onToggle={toggle("rating")}
        compact
        single
      />
    </FilterDrawer>
  );
}
