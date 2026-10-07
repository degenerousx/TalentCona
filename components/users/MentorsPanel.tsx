"use client";

import Link from "next/link";
import { useCallback, useMemo, useState, type ReactNode } from "react";
import {
  AwardIcon,
  ClockIcon,
  FunnelIcon,
  GraduationCapIcon,
  SearchIcon,
  StarIcon,
  TrophyIcon,
  UserCheckIcon,
} from "@/components/app/icons";
import { Toast } from "./ActionModals";
import { AssignedFilterPanel, CandidateFilterPanel } from "./MentorFilterPanel";
import {
  EMPTY_ASSIGNED_FILTERS,
  EMPTY_CANDIDATE_FILTERS,
  applyAssignedFilters,
  applyCandidateFilters,
  assignedFilterCount,
  candidateFilterCount,
  programOptions,
} from "./mentorFilters";
import {
  ASSIGNED_MENTORS,
  MENTOR_STATS,
  PENDING_MENTORS,
  UNASSIGNED_MENTORS,
  capacityOf,
  getMentor,
  type Capacity,
  type MentorCandidate,
} from "./mentors";
import styles from "./MentorsPanel.module.css";

const STATS = [
  { label: "Pending Review", value: MENTOR_STATS.pendingReview, color: "#FB8C00", Icon: ClockIcon },
  { label: "Total Mentors", value: MENTOR_STATS.totalMentors, color: "#722FFF", Icon: UserCheckIcon },
  { label: "Instructors", value: MENTOR_STATS.instructors, color: "#2196F3", Icon: GraduationCapIcon },
  { label: "Program Advisors", value: MENTOR_STATS.programAdvisors, color: "#00C853", Icon: AwardIcon },
];

const CAPACITY_CLASS: Record<Capacity, string> = {
  Available: styles.capAvailable,
  "Near Full": styles.capNear,
  Full: styles.capFull,
};

const expertiseOf = (list: MentorCandidate[]) => [...new Set(list.flatMap((m) => m.expertise))].sort((a, b) => a.localeCompare(b));

const mentorHref = (id: string) => `/user-management/mentors/${id}`;

const reviewHref = (id: string) => `/user-management/mentors/review/${id}`;

/** Mentor name, linking to `href` (or the mentor's profile when one exists). */
function MentorName({ id, name, href }: { id: string; name: string; href?: string }) {
  const target = href ?? (getMentor(id) ? mentorHref(id) : undefined);
  return target ? (
    <Link href={target} className={`${styles.name} ${styles.nameLink}`}>
      {name}
    </Link>
  ) : (
    <span className={styles.name}>{name}</span>
  );
}

function Rating({ value, admin = false }: { value: number; admin?: boolean }) {
  return (
    <span className={styles.rating} aria-label={`${admin ? "Admin" : "System"} rating ${value}`}>
      {admin ? <TrophyIcon /> : <StarIcon />}
      <span>{value}</span>
    </span>
  );
}

function Tags({ items }: { items: string[] }) {
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

/** Opens the section's filter drawer; shows how many filters are active. */
function FiltersButton({ count, open, onOpen }: { count: number; open: boolean; onOpen: () => void }) {
  return (
    <button type="button" className={styles.filters} aria-haspopup="dialog" aria-expanded={open} onClick={onOpen}>
      <FunnelIcon />
      <span>Filters</span>
      {count > 0 && <span className={styles.filterCount}>{count}</span>}
    </button>
  );
}

function Section({
  title,
  tone,
  query,
  onQuery,
  filter,
  children,
}: {
  title: string;
  tone: "pending" | "assigned" | "unassigned";
  query: string;
  onQuery: (q: string) => void;
  filter: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className={styles.section} aria-label={title}>
      <h2 className={`${styles.sectionHeader} ${styles[tone]}`}>{title}</h2>
      <div className={styles.toolbar}>
        <label className={styles.search}>
          <span className={styles.searchIcon}>
            <SearchIcon />
          </span>
          <input type="search" placeholder="Search mentors..." value={query} onChange={(e) => onQuery(e.target.value)} aria-label={`Search ${title.toLowerCase()}`} />
        </label>
        {filter}
      </div>
      <div className={styles.tableWrap}>{children}</div>
    </section>
  );
}

const matches = (q: string, ...values: string[]) => {
  const s = q.trim().toLowerCase();
  return !s || values.some((v) => v.toLowerCase().includes(s));
};

function CandidateTable({
  rows,
  admin,
  action,
  onAction,
  hrefFor,
  empty,
}: {
  rows: MentorCandidate[];
  admin: boolean;
  action: string;
  /** Without a handler the button links to `hrefFor` (or the mentor's profile). */
  onAction?: (m: MentorCandidate) => void;
  hrefFor?: (id: string) => string;
  empty: string;
}) {
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
        {rows.map((m, i) => (
          <tr key={`${m.id}-${i}`}>
            <td>
              <MentorName id={m.id} name={m.name} href={hrefFor?.(m.id)} />
            </td>
            <td>
              <Tags items={m.expertise} />
            </td>
            <td>
              <span className={styles.small}>{m.experience} years</span>
            </td>
            <td>
              <Rating value={m.systemRating} />
            </td>
            {admin && <td>{m.adminRating !== undefined ? <Rating value={m.adminRating} admin /> : "—"}</td>}
            <td className={styles.tdAction}>
              {!onAction ? (
                <Link href={(hrefFor ?? mentorHref)(m.id)} className={styles.greenButton}>
                  {action}
                </Link>
              ) : (
                <button type="button" className={styles.greenButton} onClick={() => onAction(m)}>
                  {action}
                </button>
              )}
            </td>
          </tr>
        ))}
        {rows.length === 0 && (
          <tr>
            <td colSpan={admin ? 6 : 5} className={styles.empty}>
              {empty}
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );
}

export default function MentorsPanel() {
  const [toast, setToast] = useState<string | null>(null);
  const clearToast = useCallback(() => setToast(null), []);
  const soon = (what: string) => setToast(`${what} is coming soon.`);

  const [pendingQ, setPendingQ] = useState("");
  const [pendingF, setPendingF] = useState(EMPTY_CANDIDATE_FILTERS);
  const [assignedQ, setAssignedQ] = useState("");
  const [assignedF, setAssignedF] = useState(EMPTY_ASSIGNED_FILTERS);
  const [unassignedQ, setUnassignedQ] = useState("");
  const [unassignedF, setUnassignedF] = useState(EMPTY_CANDIDATE_FILTERS);
  const [drawer, setDrawer] = useState<"pending" | "assigned" | "unassigned" | null>(null);
  const closeDrawer = useCallback(() => setDrawer(null), []);

  const pending = useMemo(
    () => applyCandidateFilters(PENDING_MENTORS, pendingF).filter((m) => matches(pendingQ, m.name, ...m.expertise)),
    [pendingQ, pendingF],
  );
  const assigned = useMemo(
    () => applyAssignedFilters(ASSIGNED_MENTORS, assignedF).filter((m) => matches(assignedQ, m.name, m.programs)),
    [assignedQ, assignedF],
  );
  const unassigned = useMemo(
    () => applyCandidateFilters(UNASSIGNED_MENTORS, unassignedF).filter((m) => matches(unassignedQ, m.name, ...m.expertise)),
    [unassignedQ, unassignedF],
  );

  return (
    <div className={styles.panel}>
      <div className={styles.stats}>
        {STATS.map(({ label, value, color, Icon }) => (
          <div key={label} className={styles.stat}>
            <div>
              <p className={styles.statLabel}>{label}</p>
              <p className={styles.statValue} style={{ color }}>
                {value}
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
          query={pendingQ}
          onQuery={setPendingQ}
          filter={<FiltersButton count={candidateFilterCount(pendingF)} open={drawer === "pending"} onOpen={() => setDrawer("pending")} />}
        >
          <CandidateTable rows={pending} admin={false} action="View" hrefFor={reviewHref} empty="No mentors are waiting for review." />
        </Section>

        <Section
          title="Assigned Mentors"
          tone="assigned"
          query={assignedQ}
          onQuery={setAssignedQ}
          filter={<FiltersButton count={assignedFilterCount(assignedF)} open={drawer === "assigned"} onOpen={() => setDrawer("assigned")} />}
        >
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
              {assigned.map((m) => {
                const cap = capacityOf(m);
                return (
                  <tr key={m.id}>
                    <td>
                      <MentorName id={m.id} name={m.name} />
                    </td>
                    <td className={styles.tdPrograms}>
                      <span className={styles.programs}>{m.programs}</span>
                    </td>
                    <td>
                      <span className={styles.small}>
                        {m.mentees}/{m.maxMentees}
                      </span>
                    </td>
                    <td>
                      <Rating value={m.averageRating} />
                    </td>
                    <td>
                      <span className={`${styles.capacity} ${CAPACITY_CLASS[cap]}`}>{cap}</span>
                    </td>
                    <td>
                      <Link href={mentorHref(m.id)} className={styles.manage}>
                        Manage
                      </Link>
                    </td>
                  </tr>
                );
              })}
              {assigned.length === 0 && (
                <tr>
                  <td colSpan={6} className={styles.empty}>
                    No assigned mentors match.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </Section>

        <Section
          title="Unassigned Mentors"
          tone="unassigned"
          query={unassignedQ}
          onQuery={setUnassignedQ}
          filter={<FiltersButton count={candidateFilterCount(unassignedF)} open={drawer === "unassigned"} onOpen={() => setDrawer("unassigned")} />}
        >
          <CandidateTable rows={unassigned} admin action="Assign" onAction={(m) => soon(`Assigning ${m.name}`)} empty="No unassigned mentors match." />
        </Section>
      </div>

      {drawer === "pending" && (
        <CandidateFilterPanel
          initial={pendingF}
          expertise={expertiseOf(PENDING_MENTORS)}
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
          programs={programOptions(ASSIGNED_MENTORS)}
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
          expertise={expertiseOf(UNASSIGNED_MENTORS)}
          withAdminRating
          onClose={closeDrawer}
          onApply={(f) => {
            setUnassignedF(f);
            closeDrawer();
          }}
        />
      )}
      {toast && <Toast message={toast} onDone={clearToast} />}
    </div>
  );
}
