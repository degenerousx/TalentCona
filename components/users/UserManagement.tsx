"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { FunnelIcon, LaptopIcon, SearchIcon } from "@/components/app/icons";
import { STUDENTS, type PaymentMethod } from "./data";
import FilterPanel from "./FilterPanel";
import MentorsPanel from "./MentorsPanel";
import PartnersPanel from "./PartnersPanel";
import { EMPTY_FILTERS, activeFilterCount, applyFilters, filterOptions, type StudentFilters } from "./filters";
import styles from "./UserManagement.module.css";

const TABS = ["students", "mentors", "partners"] as const;
type Tab = (typeof TABS)[number];

const PAYMENT_CLASS: Record<PaymentMethod, string> = {
  Direct: styles.pillGreen,
  Loan: styles.pillOrange,
  Fundraising: styles.pillBlue,
};

function Person({ name }: { name: string | null }) {
  return name ? <span className={styles.person}>{name}</span> : <span className={styles.unassigned}>Unassigned</span>;
}

const FILTER_OPTIONS = filterOptions(STUDENTS);

function StudentsTable({ query, filters }: { query: string; filters: StudentFilters }) {
  const router = useRouter();
  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = applyFilters(STUDENTS, filters);
    if (!q) return filtered;
    return filtered.filter((s) => [s.name, s.email, s.program].some((v) => v.toLowerCase().includes(q)));
  }, [query, filters]);

  return (
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        <colgroup>
          <col style={{ width: 167 }} />
          <col style={{ width: 140 }} />
          <col style={{ width: 153 }} />
          <col style={{ width: 91.71 }} />
          <col />
          <col style={{ width: 128 }} />
          <col style={{ width: 117 }} />
          <col />
          <col />
        </colgroup>
        <thead>
          <tr>
            <th>Student</th>
            <th>Program</th>
            <th>Method of Payment</th>
            <th>Amount Paid</th>
            <th className={styles.thLaptop}>Laptop</th>
            <th className={styles.thShift}>Instructor</th>
            <th className={styles.thAdvisor}>Program Advisor</th>
            <th className={styles.thShift}>Status</th>
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
                <span className={styles.program}>{s.program}</span>
              </td>
              <td>
                <span className={`${styles.pill} ${PAYMENT_CLASS[s.payment]}`}>{s.payment}</span>
              </td>
              <td className={styles.amount}>${s.amountPaid}</td>
              <td>
                <span className={`${styles.pill} ${styles.pillLaptop} ${s.hasLaptop ? styles.pillGreen : styles.pillGray}`}>
                  <LaptopIcon />
                  {s.hasLaptop ? "Yes" : "No"}
                </span>
              </td>
              <td>
                <Person name={s.instructor} />
              </td>
              <td>
                <Person name={s.advisor} />
              </td>
              <td>
                <span className={`${styles.pill} ${s.status === "Active" ? styles.pillGreen : styles.pillGray}`}>{s.status}</span>
              </td>
              <td>
                <Link href={`/user-management/${s.id}`} className={styles.manage} onClick={(e) => e.stopPropagation()}>
                  Manage
                </Link>
              </td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={9} className={styles.empty}>
                {query.trim() ? <>No students match “{query}”.</> : "No students match the selected filters."}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export default function UserManagement() {
  const [tab, setTab] = useState<Tab>("students");
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<StudentFilters>(EMPTY_FILTERS);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const filterCount = activeFilterCount(filters);

  // The tab lives in the URL hash (e.g. #mentors) so Back from a profile returns to it.
  useEffect(() => {
    const fromHash = window.location.hash.slice(1) as Tab;
    if (TABS.includes(fromHash)) setTab(fromHash);
  }, []);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>User Management</h1>
        <p className={styles.subtitle}>Manage students, mentors, and partners</p>
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
              aria-controls={`panel-${t}`}
              className={`${styles.tab} ${tab === t ? styles.tabActive : ""}`}
              onClick={() => {
                setTab(t);
                setQuery("");
                window.history.replaceState(null, "", t === "students" ? window.location.pathname : `#${t}`);
              }}
            >
              {t}
            </button>
          ))}
        </div>

        {tab !== "mentors" && (
          <div className={styles.toolbar}>
            <label className={styles.search}>
              <span className={styles.searchIcon}>
                <SearchIcon />
              </span>
              <input
                type="search"
                placeholder={`Search ${tab}...`}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                aria-label={`Search ${tab}`}
              />
            </label>
            {/* Only students have filters; the Partners design has search alone. */}
            {tab === "students" && (
              <button
                type="button"
                className={styles.filters}
                onClick={() => setFiltersOpen(true)}
                aria-haspopup="dialog"
                aria-expanded={filtersOpen}
              >
                <FunnelIcon />
                <span>Filters</span>
                {filterCount > 0 && <span className={styles.filterCount}>{filterCount}</span>}
              </button>
            )}
          </div>
        )}

        <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`}>
          {tab === "students" ? (
            <StudentsTable query={query} filters={filters} />
          ) : tab === "mentors" ? (
            <MentorsPanel />
          ) : (
            <PartnersPanel query={query} />
          )}
        </div>
      </section>

      {filtersOpen && (
        <FilterPanel
          initial={filters}
          options={FILTER_OPTIONS}
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
