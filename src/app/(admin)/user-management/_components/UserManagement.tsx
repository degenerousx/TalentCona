"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Suspense, useState } from "react";
import { useHashTab } from "@/lib/useHashTab";
import { FunnelIcon, LaptopIcon, SearchIcon } from "@/components/icons";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/States";
import { shortDate, usePrograms, useStudents, type StudentRow } from "./api";
import { EMPTY_FILTERS, activeFilterCount, studentQuery, type StudentFilters } from "./filters";
import FilterPanel from "./shared/FilterPanel";
import FindUserDialog from "./shared/FindUserDialog";
import ListFooter from "./shared/ListFooter";
import MentorsPanel from "./mentors/MentorsPanel";
import PartnersPanel from "./partners/PartnersPanel";
import { useDebounced } from "./useDebounced";
import styles from "./UserManagement.module.css";

const TABS = ["students", "mentors", "partners"] as const;

/** "Direct-Full" → green, "Fundraising…" → blue, anything loan-like → orange. */
function paymentClass(label: string) {
  const l = label.toLowerCase();
  if (l.startsWith("direct")) return styles.pillGreen;
  if (l.startsWith("fund")) return styles.pillBlue;
  if (l.includes("loan")) return styles.pillOrange;
  return styles.pillGray;
}

const statusClass = (s: string) => (s === "Active" ? styles.pillGreen : styles.pillGray);

function StudentsTable({ query, filters, filtered }: { query: string; filters: StudentFilters; filtered: boolean }) {
  const router = useRouter();
  const search = useDebounced(query);
  const list = useStudents(studentQuery(search, filters));
  const rows: StudentRow[] = list.data?.pages.flatMap((p) => p.items) ?? [];

  if (list.isPending) return <LoadingState className={styles.state} rows={6} label="Loading students…" />;
  if (list.isError && !rows.length)
    return (
      <div className={styles.state}>
        <ErrorState error={list.error} title="Couldn't load students" onRetry={() => void list.refetch()} retrying={list.isFetching} />
      </div>
    );
  if (!rows.length)
    return (
      <div className={styles.state}>
        <EmptyState
          title={search.trim() || filtered ? "No students match" : "No students yet"}
          description={search.trim() || filtered ? "Try another name, email or filter." : "Students appear here once they sign up."}
        />
      </div>
    );

  return (
    <>
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <colgroup>
            <col style={{ width: 200 }} />
            <col style={{ width: 170 }} />
            <col style={{ width: 160 }} />
            <col style={{ width: 120 }} />
            <col style={{ width: 110 }} />
            <col style={{ width: 130 }} />
            <col style={{ width: 120 }} />
            <col />
          </colgroup>
          <thead>
            <tr>
              <th>Student</th>
              <th>Program</th>
              <th>Method of Payment</th>
              <th>Amount Paid</th>
              <th className={styles.thLaptop}>Laptop</th>
              <th>Joined</th>
              <th>Status</th>
              <th className={styles.thActions}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((s) => (
              <tr key={s.id} className={styles.row} onClick={() => router.push(`/user-management/${s.id}`)}>
                <td>
                  <Link href={`/user-management/${s.id}`} className={styles.name} onClick={(e) => e.stopPropagation()}>
                    {s.name}
                  </Link>
                  <span className={styles.email}>{s.email}</span>
                </td>
                <td className={styles.tdProgram}>
                  {s.programs.length ? (
                    <span className={`${styles.program} ${styles.programList}`}>
                      {s.programs.map((p) => (
                        <span key={p.enrollmentId}>{p.title}</span>
                      ))}
                    </span>
                  ) : (
                    <span className={styles.muted}>Not enrolled</span>
                  )}
                </td>
                <td>{s.payment ? <span className={`${styles.pill} ${paymentClass(s.payment)}`}>{s.payment}</span> : <span className={styles.muted}>—</span>}</td>
                <td className={styles.amount}>{s.amountPaid ?? <span className={styles.muted}>—</span>}</td>
                <td>
                  {s.laptop === null ? (
                    <span className={styles.muted}>—</span>
                  ) : (
                    <span className={`${styles.pill} ${styles.pillLaptop} ${s.laptop ? styles.pillGreen : styles.pillGray}`}>
                      <LaptopIcon />
                      {s.laptop ? "Yes" : "No"}
                    </span>
                  )}
                </td>
                <td className={styles.muted}>{shortDate(s.joinedAt) ?? "—"}</td>
                <td>
                  <span className={`${styles.pill} ${statusClass(s.status)}`}>{s.status}</span>
                </td>
                <td>
                  <Link href={`/user-management/${s.id}`} className={styles.manage} onClick={(e) => e.stopPropagation()}>
                    Manage
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ListFooter shown={rows.length} noun="students" hasMore={!!list.hasNextPage} loading={list.isFetchingNextPage} onMore={() => void list.fetchNextPage()} />
    </>
  );
}

export default function UserManagement() {
  const [tab, setTab] = useHashTab(TABS);
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<StudentFilters>(EMPTY_FILTERS);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [findOpen, setFindOpen] = useState(false);
  const filterCount = activeFilterCount(filters);
  const programs = usePrograms();

  return (
    <div className={styles.page}>
      <header className={`${styles.header} ${styles.headerRow}`}>
        <div className={styles.headerText}>
          <h1 className={styles.title}>User Management</h1>
          <p className={styles.subtitle}>Manage students, mentors, and partners</p>
        </div>
        <button type="button" className={styles.findButton} onClick={() => setFindOpen(true)} aria-haspopup="dialog">
          <SearchIcon />
          Find a user
        </button>
      </header>

      <section className={styles.card}>
        <div className={styles.tabs} role="tablist" aria-label="User type">
          {TABS.map((t) => (
            <button
              key={t}
              type="button"
              role="tab"
              id={`tab-${t}`}
              aria-selected={tab === t}
              aria-controls={tab === t ? `panel-${t}` : undefined}
              className={`${styles.tab} ${tab === t ? styles.tabActive : ""}`}
              onClick={() => {
                setTab(t);
                setQuery("");
              }}
            >
              {t}
            </button>
          ))}
        </div>

        {tab === "students" && (
          <div className={styles.toolbar}>
            <label className={styles.search}>
              <span className={styles.searchIcon}>
                <SearchIcon />
              </span>
              <input type="search" placeholder="Search students..." value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Search students" />
            </label>
            <button type="button" className={styles.filters} onClick={() => setFiltersOpen(true)} aria-haspopup="dialog" aria-expanded={filtersOpen}>
              <FunnelIcon />
              <span>Filters</span>
              {filterCount > 0 && <span className={styles.filterCount}>{filterCount}</span>}
            </button>
          </div>
        )}

        <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`}>
          {tab === "students" ? <StudentsTable query={query} filters={filters} filtered={filterCount > 0} /> : tab === "mentors" ? (
            <Suspense fallback={<LoadingState className={styles.state} rows={4} label="Loading mentors…" />}>
              <MentorsPanel />
            </Suspense>
          ) : <PartnersPanel />}
        </div>
      </section>

      {findOpen && <FindUserDialog onClose={() => setFindOpen(false)} />}
      {filtersOpen && (
        <FilterPanel
          initial={filters}
          programs={(programs.data ?? []).map((p) => ({ value: p.id, label: p.title }))}
          programsNote={programs.isPending ? "Loading programs…" : programs.isError ? "Couldn't load programs." : undefined}
          onClose={() => setFiltersOpen(false)}
          onApply={(f) => {
            setFilters(f);
            setFiltersOpen(false);
          }}
        />
      )}
    </div>
  );
}
