"use client";

import { useState } from "react";
import { CircleAlertIcon } from "@/components/app/icons";
import { LOAN_REPAYMENTS, LOAN_REQUESTS, usd, type Loan, type LoanStatus } from "./data";
import styles from "./FinancialOps.module.css";

const VIEWS: { id: string; label: string; rows: Loan[] }[] = [
  { id: "all", label: "All Requests", rows: LOAN_REQUESTS },
  { id: "pending", label: "Pending", rows: LOAN_REQUESTS.filter((l) => l.status === "Pending") },
  { id: "approved", label: "Approved", rows: LOAN_REQUESTS.filter((l) => l.status === "Approved") },
  { id: "rejected", label: "Rejected", rows: LOAN_REQUESTS.filter((l) => l.status === "Rejected") },
  { id: "tracking", label: "Repayment Tracking", rows: LOAN_REPAYMENTS.filter((l) => l.status === "In Repayment") },
  { id: "paid", label: "Fully Paid", rows: LOAN_REPAYMENTS.filter((l) => l.status === "Fully Paid") },
];

const STATUS_CLASS: Record<LoanStatus, string> = {
  Pending: styles.pending,
  Approved: styles.completed,
  Rejected: styles.rejected,
  "In Repayment": styles.restricted,
  "Fully Paid": styles.completed,
};

/** Loan Repayments tab: monitoring-only notice, status filters and the loan table. */
export default function LoanRepayments() {
  const [view, setView] = useState("all");

  return (
    <>
      <div className={styles.loanNoticeWrap}>
        <div className={styles.loanNotice}>
          <CircleAlertIcon size={20} color="#155DFC" strokeWidth={1.67} />
          <div>
            <p className={styles.loanNoticeTitle}>Loan Monitoring Only</p>
            <p className={styles.loanNoticeText}>
              Loans are managed by external partners. This dashboard provides oversight of loan requests, approval status, repayment tracking,
              and completion records.
            </p>
          </div>
        </div>
      </div>

      <div className={styles.subTabs} role="tablist" aria-label="Loan status">
        {VIEWS.map((v) => (
          <button
            key={v.id}
            type="button"
            role="tab"
            id={`loan-tab-${v.id}`}
            aria-selected={view === v.id}
            aria-controls={`loan-panel-${v.id}`}
            className={styles.subTab}
            onClick={() => setView(v.id)}
          >
            {v.label} <span className={styles.count}>({v.rows.length})</span>
          </button>
        ))}
      </div>

      {VIEWS.map((v) => (
        <div key={v.id} role="tabpanel" id={`loan-panel-${v.id}`} aria-labelledby={`loan-tab-${v.id}`} hidden={view !== v.id} className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Student</th>
                <th>Program</th>
                <th>Amount</th>
                <th>Provider</th>
                <th>{v.id === "tracking" || v.id === "paid" ? "Last Payment" : "Request Date"}</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {v.rows.map((l) => (
                <tr key={l.id}>
                  <td className={styles.student}>{l.student}</td>
                  <td>{l.program}</td>
                  <td className={styles.amount}>{usd(l.amount)}</td>
                  <td>{l.provider}</td>
                  <td>{l.date}</td>
                  <td>
                    <span className={`${styles.status} ${STATUS_CLASS[l.status]}`}>{l.status}</span>
                  </td>
                </tr>
              ))}
              {v.rows.length === 0 && (
                <tr>
                  <td colSpan={6} className={styles.emptyRow}>
                    No loans here yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      ))}
    </>
  );
}
