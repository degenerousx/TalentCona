"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  AwardIcon,
  CheckboxIcon,
  ClockIcon,
  FunnelIcon,
  GraduationCapIcon,
  SearchIcon,
  StarIcon,
  TrophyIcon,
  UserCheckIcon,
} from "@/components/app/icons";
import { Toast } from "./ActionModals";
import {
  ASSIGNED_MENTORS,
  CAPACITIES,
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

/** Filters button with a checkbox list, styled like the student filter lists. */
function FilterMenu({
  allLabel,
  options,
  selected,
  onChange,
}: {
  allLabel: string;
  options: string[];
  selected: string[];
  onChange: (next: string[]) => void;
}) {
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

  return (
    <div ref={ref} className={styles.filterWrap}>
      <button type="button" className={styles.filters} aria-haspopup="true" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        <FunnelIcon />
        <span>Filters</span>
        {selected.length > 0 && <span className={styles.filterCount}>{selected.length}</span>}
      </button>
      {open && (
        <div className={styles.popover} role="group" aria-label={allLabel}>
          <button type="button" className={styles.allOption} onClick={() => onChange([])}>
            {allLabel}
          </button>
          {options.map((o) => (
            <label key={o} className={styles.option}>
              <input
                type="checkbox"
                className={styles.srOnly}
                checked={selected.includes(o)}
                onChange={() => onChange(selected.includes(o) ? selected.filter((s) => s !== o) : [...selected, o])}
              />
              <CheckboxIcon checked={selected.includes(o)} />
              <span>{o}</span>
            </label>
          ))}
        </div>
      )}
    </div>
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
  const [pendingF, setPendingF] = useState<string[]>([]);
  const [assignedQ, setAssignedQ] = useState("");
  const [assignedF, setAssignedF] = useState<string[]>([]);
  const [unassignedQ, setUnassignedQ] = useState("");
  const [unassignedF, setUnassignedF] = useState<string[]>([]);

  const pending = useMemo(
    () =>
      PENDING_MENTORS.filter(
        (m) => matches(pendingQ, m.name, ...m.expertise) && (!pendingF.length || m.expertise.some((e) => pendingF.includes(e))),
      ),
    [pendingQ, pendingF],
  );
  const assigned = useMemo(
    () =>
      ASSIGNED_MENTORS.filter(
        (m) => matches(assignedQ, m.name, m.programs) && (!assignedF.length || assignedF.includes(capacityOf(m))),
      ),
    [assignedQ, assignedF],
  );
  const unassigned = useMemo(
    () =>
      UNASSIGNED_MENTORS.filter(
        (m) => matches(unassignedQ, m.name, ...m.expertise) && (!unassignedF.length || m.expertise.some((e) => unassignedF.includes(e))),
      ),
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
          filter={<FilterMenu allLabel="All Expertise" options={expertiseOf(PENDING_MENTORS)} selected={pendingF} onChange={setPendingF} />}
        >
          <CandidateTable rows={pending} admin={false} action="View" hrefFor={reviewHref} empty="No mentors are waiting for review." />
        </Section>

        <Section
          title="Assigned Mentors"
          tone="assigned"
          query={assignedQ}
          onQuery={setAssignedQ}
          filter={<FilterMenu allLabel="All Capacities" options={CAPACITIES} selected={assignedF} onChange={setAssignedF} />}
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
          filter={<FilterMenu allLabel="All Expertise" options={expertiseOf(UNASSIGNED_MENTORS)} selected={unassignedF} onChange={setUnassignedF} />}
        >
          <CandidateTable rows={unassigned} admin action="Assign" onAction={(m) => soon(`Assigning ${m.name}`)} empty="No unassigned mentors match." />
        </Section>
      </div>

      {toast && <Toast message={toast} onDone={clearToast} />}
    </div>
  );
}
