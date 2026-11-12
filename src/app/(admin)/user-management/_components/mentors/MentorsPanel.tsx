"use client";

import Link from "next/link";
import { useCallback, useState, type ReactNode } from "react";
import { AwardIcon, ClockIcon, FunnelIcon, GraduationCapIcon, SearchIcon, StarIcon, TrophyIcon, UserCheckIcon } from "@/components/icons";
import { ErrorState, LoadingState } from "@/components/ui/States";
import { AssignedFilterPanel, CandidateFilterPanel } from "./MentorFilterPanel";
import ListFooter from "../shared/ListFooter";
import {
  EMPTY_ASSIGNED_FILTERS,
  EMPTY_CANDIDATE_FILTERS,
  assignedFilterCount,
  assignedQuery,
  candidateFilterCount,
  candidateQuery,
  type AssignedFilters,
  type CandidateFilters,
} from "../filters";
import { useMentorSummary, useMentors, usePrograms, type Capacity, type MentorQuery, type MentorRow, type MentorSection } from "../api";
import { useDebounced } from "../useDebounced";
import styles from "./MentorsPanel.module.css";

const CAPACITY: Record<Capacity, { label: string; className: string }> = {
  Available: { label: "Available", className: styles.capAvailable },
  NearFull: { label: "Near Full", className: styles.capNear },
  Full: { label: "Full", className: styles.capFull },
};

const mentorHref = (id: string) => `/user-management/mentors/${id}`;
const reviewHref = (id: string) => `/user-management/mentors/review/${id}`;
const assignHref = (id: string) => `/user-management/mentors/assign/${id}`;

function Rating({ value, admin = false }: { value: number | null; admin?: boolean }) {
  if (value == null) return <span className={styles.muted}>—</span>;
  return (
    <span className={styles.rating} aria-label={`${admin ? "Admin" : "System"} rating ${value}`}>
      {admin ? <TrophyIcon /> : <StarIcon />}
      <span>{Math.round(value * 10) / 10}</span>
    </span>
  );
}

function Tags({ items }: { items: string[] }) {
  if (!items.length) return <span className={styles.muted}>—</span>;
  return (
    <span className={styles.tags}>
      {items.map((t) => (
        <span key={t} className={styles.tag}>
          {t}
        </span>
      ))}
    </span>
  );
}

function FiltersButton({ count, open, onOpen }: { count: number; open: boolean; onOpen: () => void }) {
  return (
    <button type="button" className={styles.filters} aria-haspopup="dialog" aria-expanded={open} onClick={onOpen}>
      <FunnelIcon />
      <span>Filters</span>
      {count > 0 && <span className={styles.filterCount}>{count}</span>}
    </button>
  );
}

/** One section's server query + table, with search, loading, error, empty and Load more. */
function Section({
  title,
  tone,
  section,
  filtered,
  filter,
  query: q,
  onQuery,
  render,
  colSpan,
  emptyText,
}: {
  title: string;
  tone: MentorSection;
  section: MentorSection;
  query: string;
  filtered: MentorQuery & { active: boolean };
  filter: ReactNode;
  onQuery: (q: string) => void;
  render: (rows: MentorRow[], empty: ReactNode) => ReactNode;
  colSpan: number;
  emptyText: string;
}) {
  const search = useDebounced(q);
  const { active, ...params } = filtered;
  const list = useMentors(section, { ...params, search });
  const rows = list.data?.pages.flatMap((p) => p.items) ?? [];
  const empty = (
    <tr>
      <td colSpan={colSpan} className={styles.empty}>
        {search.trim() || active ? "No mentors match." : emptyText}
      </td>
    </tr>
  );

  return (
    <section className={styles.section} aria-label={title}>
      <h2 className={`${styles.sectionHeader} ${styles[tone]}`}>{title}</h2>
      <div className={styles.toolbar}>
        <label className={styles.search}>
          <span className={styles.searchIcon}>
            <SearchIcon />
          </span>
          <input type="search" placeholder="Search mentors..." value={q} onChange={(e) => onQuery(e.target.value)} aria-label={`Search ${title.toLowerCase()}`} />
        </label>
        {filter}
      </div>
      {list.isPending ? (
        <LoadingState className={styles.tableState} rows={3} label={`Loading ${title.toLowerCase()}…`} />
      ) : list.isError && !rows.length ? (
        <div className={styles.tableState}>
          <ErrorState error={list.error} title={`Couldn't load ${title.toLowerCase()}`} onRetry={() => void list.refetch()} retrying={list.isFetching} />
        </div>
      ) : (
        <>
          <div className={styles.tableWrap}>{render(rows, empty)}</div>
          <ListFooter shown={rows.length} noun="mentors" hasMore={!!list.hasNextPage} loading={list.isFetchingNextPage} onMore={() => void list.fetchNextPage()} />
        </>
      )}
    </section>
  );
}

function CandidateTable({ rows, admin, action, hrefFor, empty }: { rows: MentorRow[]; admin: boolean; action: string; hrefFor: (id: string) => string; empty: ReactNode }) {
  return (
    <table className={`${styles.table} ${admin ? styles.unassignedTable : styles.pendingTable}`}>
      <thead>
        <tr>
          <th>Mentor</th>
          <th>Expertise</th>
          <th>Total Experience</th>
          <th>System Rating</th>
          {admin && <th>Admin Rating</th>}
          <th className={styles.thActions}>Actions</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((m) => (
          <tr key={m.id}>
            <td>
              <Link href={hrefFor(m.id)} className={`${styles.name} ${styles.nameLink}`}>
                {m.name}
              </Link>
            </td>
            <td>
              <Tags items={m.expertise} />
            </td>
            <td>
              <span className={styles.small}>{m.experience != null ? `${m.experience} ${m.experience === 1 ? "year" : "years"}` : "—"}</span>
            </td>
            <td>
              <Rating value={m.systemRating} />
            </td>
            {admin && (
              <td>
                <Rating value={m.adminRating} admin />
              </td>
            )}
            <td className={styles.tdAction}>
              <Link href={hrefFor(m.id)} className={styles.greenButton}>
                {action}
              </Link>
            </td>
          </tr>
        ))}
        {rows.length === 0 && empty}
      </tbody>
    </table>
  );
}

function AssignedTable({ rows, empty }: { rows: MentorRow[]; empty: ReactNode }) {
  return (
    <table className={`${styles.table} ${styles.assignedTable}`}>
      <thead>
        <tr>
          <th>Mentor</th>
          <th>Programs</th>
          <th>Mentees</th>
          <th>Average Rating</th>
          <th>Capacity</th>
          <th className={styles.thActions}>Actions</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((m) => {
          const cap = m.capacity ? CAPACITY[m.capacity] : null;
          return (
            <tr key={m.id}>
              <td>
                <Link href={mentorHref(m.id)} className={`${styles.name} ${styles.nameLink}`}>
                  {m.name}
                </Link>
              </td>
              <td className={styles.tdPrograms}>
                <span className={styles.programs}>{m.programs.length ? m.programs.join(" & ") : "—"}</span>
              </td>
              <td>
                <span className={styles.small}>{m.mentees == null ? "—" : m.maxMentees != null ? `${m.mentees}/${m.maxMentees}` : m.mentees}</span>
              </td>
              <td>
                <Rating value={m.averageRating} />
              </td>
              <td>{cap ? <span className={`${styles.capacity} ${cap.className}`}>{cap.label}</span> : <span className={styles.muted}>—</span>}</td>
              <td>
                <Link href={mentorHref(m.id)} className={styles.manage}>
                  Manage
                </Link>
              </td>
            </tr>
          );
        })}
        {rows.length === 0 && empty}
      </tbody>
    </table>
  );
}

export default function MentorsPanel() {
  const summary = useMentorSummary();
  const programs = usePrograms();
  const [pendingQ, setPendingQ] = useState("");
  const [pendingF, setPendingF] = useState<CandidateFilters>(EMPTY_CANDIDATE_FILTERS);
  const [assignedQ, setAssignedQ] = useState("");
  const [assignedF, setAssignedF] = useState<AssignedFilters>(EMPTY_ASSIGNED_FILTERS);
  const [unassignedQ, setUnassignedQ] = useState("");
  const [unassignedF, setUnassignedF] = useState<CandidateFilters>(EMPTY_CANDIDATE_FILTERS);
  const [drawer, setDrawer] = useState<MentorSection | null>(null);
  const closeDrawer = useCallback(() => setDrawer(null), []);

  const s = summary.data;
  const stats = [
    { label: "Pending Review", value: s?.pendingReviewCount, color: "#FB8C00", Icon: ClockIcon },
    { label: "Total Mentors", value: s?.totalMentors, color: "#722FFF", Icon: UserCheckIcon },
    { label: "Instructors", value: s?.mentorCount, color: "#2196F3", Icon: GraduationCapIcon },
    { label: "Program Advisors", value: s?.programAdvisorCount, color: "#00C853", Icon: AwardIcon },
  ];
  const programOptions = (programs.data ?? []).map((p) => ({ value: p.id, label: p.title }));

  return (
    <div className={styles.panel}>
      <div className={styles.stats} aria-busy={summary.isPending}>
        {stats.map(({ label, value, color, Icon }) => (
          <div key={label} className={styles.stat}>
            <div>
              <p className={styles.statLabel}>{label}</p>
              <p className={styles.statValue} style={{ color }} title={summary.isError ? "Couldn't load the summary" : undefined}>
                {value ?? (summary.isPending ? "…" : "—")}
              </p>
            </div>
            <Icon size={32} color={color} strokeWidth={2} />
          </div>
        ))}
      </div>

      <div className={styles.sections}>
        <Section
          title="Pending Reviews"
          tone="pending"
          section="pending"
          query={pendingQ}
          onQuery={setPendingQ}
          filtered={{ ...candidateQuery("", pendingF), active: candidateFilterCount(pendingF) > 0 }}
          filter={<FiltersButton count={candidateFilterCount(pendingF)} open={drawer === "pending"} onOpen={() => setDrawer("pending")} />}
          colSpan={5}
          emptyText="No mentors are waiting for review."
          render={(rows, empty) => <CandidateTable rows={rows} admin={false} action="View" hrefFor={reviewHref} empty={empty} />}
        />

        <Section
          title="Assigned Mentors"
          tone="assigned"
          section="assigned"
          query={assignedQ}
          onQuery={setAssignedQ}
          filtered={{ ...assignedQuery("", assignedF), active: assignedFilterCount(assignedF) > 0 }}
          filter={<FiltersButton count={assignedFilterCount(assignedF)} open={drawer === "assigned"} onOpen={() => setDrawer("assigned")} />}
          colSpan={6}
          emptyText="No mentors are assigned to programs yet."
          render={(rows, empty) => <AssignedTable rows={rows} empty={empty} />}
        />

        <Section
          title="Unassigned Mentors"
          tone="unassigned"
          section="unassigned"
          query={unassignedQ}
          onQuery={setUnassignedQ}
          filtered={{ ...candidateQuery("", unassignedF), active: candidateFilterCount(unassignedF) > 0 }}
          filter={<FiltersButton count={candidateFilterCount(unassignedF)} open={drawer === "unassigned"} onOpen={() => setDrawer("unassigned")} />}
          colSpan={6}
          emptyText="Every approved mentor is assigned to a program."
          render={(rows, empty) => <CandidateTable rows={rows} admin action="Assign" hrefFor={assignHref} empty={empty} />}
        />
      </div>

      {drawer === "pending" && (
        <CandidateFilterPanel
          initial={pendingF}
          withAdminRating={false}
          onClose={closeDrawer}
          onApply={(f) => {
            setPendingF(f);
            closeDrawer();
          }}
        />
      )}
      {drawer === "assigned" && (
        <AssignedFilterPanel
          initial={assignedF}
          programs={programOptions}
          programsNote={programs.isPending ? "Loading programs…" : programs.isError ? "Couldn't load programs." : undefined}
          onClose={closeDrawer}
          onApply={(f) => {
            setAssignedF(f);
            closeDrawer();
          }}
        />
      )}
      {drawer === "unassigned" && (
        <CandidateFilterPanel
          initial={unassignedF}
          withAdminRating
          onClose={closeDrawer}
          onApply={(f) => {
            setUnassignedF(f);
            closeDrawer();
          }}
        />
      )}
    </div>
  );
}
