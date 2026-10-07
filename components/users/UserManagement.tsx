"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { FunnelIcon, LaptopIcon, SearchIcon } from "@/components/app/icons";
import { STUDENTS, type PaymentMethod } from "./data";
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

function StudentsTable({ query }: { query: string }) {
  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return STUDENTS;
    return STUDENTS.filter((s) => [s.name, s.email, s.program].some((v) => v.toLowerCase().includes(q)));
  }, [query]);

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
            <tr key={s.email}>
              <td>
                <span className={styles.name}>{s.name}</span>
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
                <span className={`${styles.pill} ${styles.pillGreen}`}>{s.status}</span>
              </td>
              <td>
                <Link href="#" className={styles.manage}>
                  Manage
                </Link>
              </td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={9} className={styles.empty}>
                No students match “{query}”.
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
              }}
            >
              {t}
            </button>
          ))}
        </div>

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
          <button type="button" className={styles.filters}>
            <FunnelIcon />
            <span>Filters</span>
          </button>
        </div>

        <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`}>
          {tab === "students" ? (
            <StudentsTable query={query} />
          ) : (
            <p className={styles.empty}>The {tab} list is coming soon.</p>
          )}
        </div>
      </section>
    </div>
  );
}
