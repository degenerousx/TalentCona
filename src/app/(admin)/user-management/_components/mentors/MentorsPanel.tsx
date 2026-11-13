"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState, type ReactNode } from "react";
import {
  AwardIcon,
  ClockIcon,
  FunnelIcon,
  GraduationCapIcon,
  SearchIcon,
  StarIcon,
  TrophyIcon,
  UserCheckIcon,
} from "@/components/icons";
import { ErrorState, LoadingState } from "@/components/ui/States";
import { AssignedFilterPanel, CandidateFilterPanel } from "./MentorFilterPanel";
import ListFooter from "../shared/ListFooter";
import {
  DEFAULT_STATUS_FILTERS,
  EMPTY_ASSIGNED_FILTERS,
  EMPTY_CANDIDATE_FILTERS,
  applicationStatusLabel,
  assignedFilterCount,
  assignedQuery,
  candidateFilterCount,
  candidateQuery,
  type AssignedFilters,
  type CandidateFilters,
} from "../filters";
import {
  shortDate,
  useMentorSummary,
  useMentors,
  useMentorsByRole,
  usePrograms,
  type ApplicationStatus,
  type Capacity,
  type MentorQuery,
  type MentorRow,
  type MentorSection,
} from "../api";
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

function Rating({
  value,
  admin = false,
}: {
  value: number | null;
  admin?: boolean;
}) {
  if (value == null) return <span className={styles.muted}>—</span>;
  return (
    <span
      className={styles.rating}
      aria-label={`${admin ? "Admin" : "System"} rating ${value}`}
    >
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

function FiltersButton({
  count,
  open,
  onOpen,
}: {
  count: number;
  open: boolean;
  onOpen: () => void;
}) {
  return (
    <button
      type="button"
      className={styles.filters}
      aria-haspopup="dialog"
      aria-expanded={open}
      onClick={onOpen}
    >
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
  statuses,
  filtered,
  filter,
  query: q,
  onQuery,
  render,
  colSpan,
  emptyText,
}: {
  title: string;
  tone: MentorSection | "status";
  /** A directory section, or "status" for the free status filter queue. */
  section: MentorSection | "status";
  /** With section "status": the application statuses to list. */
  statuses?: ApplicationStatus[];
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
  const list = useMentors(section, { ...params, search }, statuses);
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
          <input
            type="search"
            placeholder="Search mentors..."
            value={q}
            onChange={(e) => onQuery(e.target.value)}
            aria-label={`Search ${title.toLowerCase()}`}
          />
        </label>
        {filter}
      </div>
      {list.isPending ? (
        <LoadingState
          className={styles.tableState}
          rows={3}
          label={`Loading ${title.toLowerCase()}…`}
        />
      ) : list.isError && !rows.length ? (
        <div className={styles.tableState}>
          <ErrorState
            error={list.error}
            title={`Couldn't load ${title.toLowerCase()}`}
            onRetry={() => void list.refetch()}
            retrying={list.isFetching}
          />
        </div>
      ) : (
        <>
          <div className={styles.tableWrap}>{render(rows, empty)}</div>
          <ListFooter
            shown={rows.length}
            noun="mentors"
            hasMore={!!list.hasNextPage}
            loading={list.isFetchingNextPage}
            onMore={() => void list.fetchNextPage()}
          />
        </>
      )}
    </section>
  );
}

function CandidateTable({
  rows,
  admin,
  action,
  hrefFor,
  empty,
}: {
  rows: MentorRow[];
  admin: boolean;
  action: string;
  hrefFor: (id: string) => string;
  empty: ReactNode;
}) {
  return (
    <table
      className={`${styles.table} ${admin ? styles.unassignedTable : styles.pendingTable}`}
    >
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
              <Link
                href={hrefFor(m.id)}
                className={`${styles.name} ${styles.nameLink}`}
              >
                {m.name}
              </Link>
            </td>
            <td>
              <Tags items={m.expertise} />
            </td>
            <td>
              <span className={styles.small}>
                {m.experience != null
                  ? `${m.experience} ${m.experience === 1 ? "year" : "years"}`
                  : "—"}
              </span>
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

function AssignedTable({
  rows,
  empty,
  programsHeading = "Programs",
}: {
  rows: MentorRow[];
  empty: ReactNode;
  programsHeading?: string;
}) {
  return (
    <table className={`${styles.table} ${styles.assignedTable}`}>
      <thead>
        <tr>
          <th>Mentor</th>
          <th>{programsHeading}</th>
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
                <Link
                  href={mentorHref(m.id)}
                  className={`${styles.name} ${styles.nameLink}`}
                >
                  {m.name}
                </Link>
              </td>
              <td className={styles.tdPrograms}>
                <span className={styles.programs}>
                  {m.programs.length ? m.programs.join(" & ") : "—"}
                </span>
              </td>
              <td>
                <span className={styles.small}>
                  {m.mentees == null
                    ? "—"
                    : m.maxMentees != null
                      ? `${m.mentees}/${m.maxMentees}`
                      : m.mentees}
                </span>
              </td>
              <td>
                <Rating value={m.averageRating} />
              </td>
              <td>
                {cap ? (
                  <span className={`${styles.capacity} ${cap.className}`}>
                    {cap.label}
                  </span>
                ) : (
                  <span className={styles.muted}>—</span>
                )}
              </td>
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

const STATUS_CLASS: Record<string, string> = {
  Draft: styles.stDraft,
  Submitted: styles.stSubmitted,
  UnderReview: styles.stSubmitted,
  ChangesRequested: styles.stChanges,
  Approved: styles.stApproved,
  Rejected: styles.stRejected,
};

/** Applications by Status: each mentor's application status, with when it was submitted. */
function StatusTable({ rows, empty }: { rows: MentorRow[]; empty: ReactNode }) {
  return (
    <table className={`${styles.table} ${styles.statusTable}`}>
      <thead>
        <tr>
          <th>Mentor</th>
          <th>Status</th>
          <th>Expertise</th>
          <th>Total Experience</th>
          <th>Submitted</th>
          <th className={styles.thActions}>Actions</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((m) => (
          <tr key={m.id}>
            <td>
              <Link href={reviewHref(m.id)} className={`${styles.name} ${styles.nameLink}`}>
                {m.name}
              </Link>
              {m.email && <span className={styles.muted}>{m.email}</span>}
            </td>
            <td>
              <span className={`${styles.capacity} ${STATUS_CLASS[m.applicationStatus ?? ""] ?? styles.stDraft}`}>
                {applicationStatusLabel(m.applicationStatus)}
              </span>
            </td>
            <td>
              <Tags items={m.expertise} />
            </td>
            <td>
              <span className={styles.small}>{m.experience != null ? `${m.experience} ${m.experience === 1 ? "year" : "years"}` : "—"}</span>
            </td>
            <td>
              <span className={styles.small}>{m.submittedAt ? shortDate(m.submittedAt) : "Not yet"}</span>
            </td>
            <td className={styles.tdAction}>
              <Link href={reviewHref(m.id)} className={styles.greenButton}>
                View
              </Link>
            </td>
          </tr>
        ))}
        {rows.length === 0 && empty}
      </tbody>
    </table>
  );
}

/** What the summary cards filter the lists to; kept in `?view=` so it can be linked to. */
export const MENTOR_VIEWS = [
  "pending",
  "all",
  "instructors",
  "advisors",
] as const;
export type MentorView = (typeof MENTOR_VIEWS)[number];

const VIEW_LABEL: Record<MentorView, string> = {
  pending: "applications waiting for review",
  all: "all mentors",
  instructors: "mentors who are Instructors on at least one program",
  advisors: "mentors who are Program Advisors on at least one program",
};

/** Instructors or Program Advisors, with the programs they hold that role on. */
function RoleSection({ role }: { role: "instructors" | "advisors" }) {
  const list = useMentorsByRole(role);
  const title = role === "instructors" ? "Instructors" : "Program Advisors";
  const rows = list.data ?? [];
  return (
    <section className={styles.section} aria-label={title}>
      <h2 className={`${styles.sectionHeader} ${styles.assigned}`}>
        {title}
        {list.data ? ` (${rows.length})` : ""}
      </h2>
      {list.isPending ? (
        <LoadingState
          className={styles.tableState}
          rows={3}
          label={`Loading ${title.toLowerCase()}…`}
        />
      ) : list.isError ? (
        <div className={styles.tableState}>
          <ErrorState
            error={list.error}
            title={`Couldn't load ${title.toLowerCase()}`}
            onRetry={() => void list.refetch()}
            retrying={list.isFetching}
          />
        </div>
      ) : (
        <div className={styles.tableWrap}>
          <AssignedTable
            rows={rows}
            programsHeading={`Programs (as ${role === "instructors" ? "Instructor" : "Program Advisor"})`}
            empty={
              <tr>
                <td colSpan={6} className={styles.empty}>
                  No mentors hold this role yet.
                </td>
              </tr>
            }
          />
        </div>
      )}
    </section>
  );
}

export default function MentorsPanel() {
  const summary = useMentorSummary();
  const programs = usePrograms();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const raw = params.get("view");
  const view: MentorView | null = MENTOR_VIEWS.includes(raw as MentorView)
    ? (raw as MentorView)
    : null;
  const setView = (v: MentorView | null) => {
    const next = new URLSearchParams(params.toString());
    if (v && v !== view) next.set("view", v);
    else next.delete("view");
    const qs = next.toString();
    router.replace(`${pathname}${qs ? `?${qs}` : ""}#mentors`, {
      scroll: false,
    });
  };
  const [pendingQ, setPendingQ] = useState("");
  const [pendingF, setPendingF] = useState<CandidateFilters>(
    EMPTY_CANDIDATE_FILTERS,
  );
  const [assignedQ, setAssignedQ] = useState("");
  const [assignedF, setAssignedF] = useState<AssignedFilters>(
    EMPTY_ASSIGNED_FILTERS,
  );
  const [unassignedQ, setUnassignedQ] = useState("");
  const [unassignedF, setUnassignedF] = useState<CandidateFilters>(
    EMPTY_CANDIDATE_FILTERS,
  );
  const [statusQ, setStatusQ] = useState("");
  const [statusF, setStatusF] = useState<CandidateFilters>(DEFAULT_STATUS_FILTERS);
  const [drawer, setDrawer] = useState<MentorSection | "status" | null>(null);
  const closeDrawer = useCallback(() => setDrawer(null), []);

  const s = summary.data;
  const stats: {
    view: MentorView;
    label: string;
    value: number | undefined;
    color: string;
    Icon: typeof ClockIcon;
  }[] = [
    {
      view: "pending",
      label: "Pending Review",
      value: s?.pendingReviewCount,
      color: "#FB8C00",
      Icon: ClockIcon,
    },
    {
      view: "all",
      label: "Total Mentors",
      value: s?.totalMentors,
      color: "#722FFF",
      Icon: UserCheckIcon,
    },
    {
      view: "instructors",
      label: "Instructors",
      value: s?.mentorCount,
      color: "#2196F3",
      Icon: GraduationCapIcon,
    },
    {
      view: "advisors",
      label: "Program Advisors",
      value: s?.programAdvisorCount,
      color: "#00C853",
      Icon: AwardIcon,
    },
  ];
  const showLists = view === null || view === "all" || view === "pending";
  const programOptions = (programs.data ?? []).map((p) => ({
    value: p.id,
    label: p.title,
  }));

  return (
    <div className={styles.panel}>
      <div className={styles.stats} aria-busy={summary.isPending}>
        {stats.map(({ view: v, label, value, color, Icon }) => (
          <button
            key={label}
            type="button"
            className={`${styles.stat} ${view === v ? styles.statActive : ""}`}
            aria-pressed={view === v}
            aria-label={`${label}: ${value ?? "loading"}. Show ${VIEW_LABEL[v]}`}
            onClick={() => setView(v)}
          >
            <div>
              <p className={styles.statLabel}>{label}</p>
              <p
                className={styles.statValue}
                style={{ color }}
                title={
                  summary.isError ? "Couldn't load the summary" : undefined
                }
              >
                {value ?? (summary.isPending ? "…" : "—")}
              </p>
            </div>
            <Icon size={32} color={color} strokeWidth={2} />
          </button>
        ))}
      </div>

      {summary.isError && (
        <p role="alert" className={styles.viewBar}>
          Couldn&apos;t load the mentor counts.{" "}
          <button
            type="button"
            className={styles.viewClear}
            onClick={() => void summary.refetch()}
          >
            Try again
          </button>
        </p>
      )}

      {view && (
        <p className={styles.viewBar} aria-live="polite">
          <span>Showing {VIEW_LABEL[view]}.</span>
          <button
            type="button"
            className={styles.viewClear}
            onClick={() => setView(null)}
          >
            Show everything
          </button>
        </p>
      )}

      <div className={styles.sections}>
        {(view === "instructors" || view === "advisors") && (
          <RoleSection role={view} />
        )}
        {showLists && (
          <Section
            title="Pending Reviews"
            tone="pending"
            section="pending"
            query={pendingQ}
            onQuery={setPendingQ}
            filtered={{
              ...candidateQuery("", pendingF),
              active: candidateFilterCount(pendingF) > 0,
            }}
            filter={
              <FiltersButton
                count={candidateFilterCount(pendingF)}
                open={drawer === "pending"}
                onOpen={() => setDrawer("pending")}
              />
            }
            colSpan={5}
            emptyText="No mentors are waiting for review."
            render={(rows, empty) => (
              <CandidateTable
                rows={rows}
                admin={false}
                action="View"
                hrefFor={reviewHref}
                empty={empty}
              />
            )}
          />
        )}
        {showLists && view !== "pending" && (
          <Section
            title="Assigned Mentors"
            tone="assigned"
            section="assigned"
            query={assignedQ}
            onQuery={setAssignedQ}
            filtered={{
              ...assignedQuery("", assignedF),
              active: assignedFilterCount(assignedF) > 0,
            }}
            filter={
              <FiltersButton
                count={assignedFilterCount(assignedF)}
                open={drawer === "assigned"}
                onOpen={() => setDrawer("assigned")}
              />
            }
            colSpan={6}
            emptyText="No mentors are assigned to programs yet."
            render={(rows, empty) => (
              <AssignedTable rows={rows} empty={empty} />
            )}
          />
        )}
        {showLists && view !== "pending" && (
          <Section
            title="Unassigned Mentors"
            tone="unassigned"
            section="unassigned"
            query={unassignedQ}
            onQuery={setUnassignedQ}
            filtered={{
              ...candidateQuery("", unassignedF),
              active: candidateFilterCount(unassignedF) > 0,
            }}
            filter={
              <FiltersButton
                count={candidateFilterCount(unassignedF)}
                open={drawer === "unassigned"}
                onOpen={() => setDrawer("unassigned")}
              />
            }
            colSpan={6}
            emptyText="Every approved mentor is assigned to a program."
            render={(rows, empty) => (
              <CandidateTable
                rows={rows}
                admin
                action="Assign"
                hrefFor={assignHref}
                empty={empty}
              />
            )}
          />
        )}
        {showLists && view !== "pending" && (
          <Section
            title="Applications by Status"
            tone="status"
            section="status"
            statuses={statusF.statuses as ApplicationStatus[]}
            query={statusQ}
            onQuery={setStatusQ}
            filtered={{
              ...candidateQuery("", statusF),
              active: candidateFilterCount(statusF) > 0,
            }}
            filter={
              <FiltersButton
                count={candidateFilterCount(statusF)}
                open={drawer === "status"}
                onOpen={() => setDrawer("status")}
              />
            }
            colSpan={6}
            emptyText="No mentor applications have these statuses."
            render={(rows, empty) => <StatusTable rows={rows} empty={empty} />}
          />
        )}
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
          programsNote={
            programs.isPending
              ? "Loading programs…"
              : programs.isError
                ? "Couldn't load programs."
                : undefined
          }
          onClose={closeDrawer}
          onApply={(f) => {
            setAssignedF(f);
            closeDrawer();
          }}
        />
      )}
      {drawer === "status" && (
        <CandidateFilterPanel
          initial={statusF}
          withAdminRating
          withStatuses
          onClose={closeDrawer}
          onApply={(f) => {
            setStatusF(f);
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
