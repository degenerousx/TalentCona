"use client";

import { useState } from "react";
import { CircleAlertIcon, CircleCheckIcon } from "@/components/app/icons";
import { LOAN_REPAYMENTS, LOAN_REQUESTS, usd, type Loan, type LoanStatus } from "./data";
import styles from "./FinancialOps.module.css";

type Field = { label: string; value: (l: Loan) => string; big?: boolean };

const AMOUNT: Field = { label: "Loan Amount", value: (l) => usd(l.amount), big: true };
const REQUESTED: Field = { label: "Request Date", value: (l) => l.date };
const PROVIDER: Field = { label: "Loan Provider", value: (l) => l.provider };

/** All Requests and Repayment Tracking are tables; the other filters list the loans as cards (fields per the designs). */
const VIEWS: { id: string; label: string; rows: Loan[]; fields?: Field[]; tracking?: boolean }[] = [
  { id: "all", label: "All Requests", rows: LOAN_REQUESTS },
  { id: "pending", label: "Pending", rows: LOAN_REQUESTS.filter((l) => l.status === "Pending"), fields: [AMOUNT, REQUESTED, PROVIDER] },
  {
    id: "approved",
    label: "Approved",
    rows: LOAN_REQUESTS.filter((l) => l.status === "Approved"),
    fields: [AMOUNT, REQUESTED, { label: "Approval Date", value: (l) => l.approvalDate ?? "—" }, PROVIDER],
  },
  { id: "rejected", label: "Rejected", rows: LOAN_REQUESTS.filter((l) => l.status === "Rejected"), fields: [AMOUNT, REQUESTED, PROVIDER] },
  {
    id: "tracking",
    label: "Repayment Tracking",
    rows: LOAN_REPAYMENTS.filter((l) => l.status === "In Repayment"),
    tracking: true,
  },
  {
    id: "paid",
    label: "Fully Paid",
    rows: LOAN_REPAYMENTS.filter((l) => l.status === "Fully Paid"),
    fields: [
      { ...AMOUNT, label: "Total Loan Amount" },
      { label: "Completion Date", value: (l) => l.date },
      { label: "Repayment Duration", value: (l) => (l.repayment ? `${l.repayment.installments} months` : "—") },
      PROVIDER,
    ],
  },
];

const STATUS_CLASS: Record<LoanStatus, string> = {
  Pending: styles.pending,
  Approved: styles.completed,
  Rejected: styles.rejected,
  "In Repayment": styles.restricted,
  "Fully Paid": styles.completed,
};

const CARD_CLASS: Record<LoanStatus, string> = {
  Pending: styles.cardPending,
  Approved: styles.cardGreen,
  Rejected: styles.cardRed,
  "In Repayment": styles.cardBlue,
  "Fully Paid": styles.cardGray,
};

function LoanTable({ rows }: { rows: Loan[] }) {
  return (
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Student</th>
            <th>Program</th>
            <th>Amount</th>
            <th>Provider</th>
            <th>Request Date</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((l) => (
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
        </tbody>
      </table>
    </div>
  );
}

function RepaymentTable({ rows }: { rows: Loan[] }) {
  return (
    <div className={styles.tableWrap}>
      <table className={`${styles.table} ${styles.trackTable}`}>
        <thead>
          <tr>
            <th>Student</th>
            <th>Program</th>
            <th>Total Loan</th>
            <th>Paid</th>
            <th>Remaining</th>
            <th>Progress</th>
            <th>Next Due</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((l) => {
            const r = l.repayment;
            const paid = r?.paid ?? 0;
            const pct = r && r.installments ? (r.installmentsPaid / r.installments) * 100 : 0;
            return (
              <tr key={l.id}>
                <td className={styles.student}>{l.student}</td>
                <td>{l.program}</td>
                <td className={styles.amount}>{usd(l.amount)}</td>
                <td className={styles.paid}>{usd(paid)}</td>
                <td>{usd(l.amount - paid)}</td>
                <td>
                  <div className={styles.progress}>
                    <span className={styles.progressBar}>
                      <span style={{ width: `${pct}%` }} />
                    </span>
                    <span className={styles.progressText}>
                      {r?.installmentsPaid ?? 0}/{r?.installments ?? 0}
                    </span>
                  </div>
                </td>
                <td>{r?.nextDue ?? "—"}</td>
                <td>
                  <span className={`${styles.status} ${r?.standing === "Overdue" ? styles.rejected : styles.completed}`}>
                    {r?.standing ?? "On Track"}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function LoanCards({ rows, fields }: { rows: Loan[]; fields: Field[] }) {
  if (rows.length === 0) return <p className={styles.loanEmpty}>No loans here yet.</p>;
  return (
    <ul className={styles.loanCards}>
      {rows.map((l) => (
        <li key={l.id} className={`${styles.loanCard} ${CARD_CLASS[l.status]}`}>
          <div className={styles.loanCardHead}>
            <div>
              <h3 className={styles.loanStudent}>{l.student}</h3>
              <p className={styles.loanProgram}>{l.program}</p>
            </div>
            <span className={`${styles.loanPill} ${STATUS_CLASS[l.status]}`}>
              {l.status === "Fully Paid" && <CircleCheckIcon size={16} color="currentColor" strokeWidth={2} />}
              {l.status}
            </span>
          </div>
          <dl className={styles.loanFields} style={{ gridTemplateColumns: `repeat(${fields.length}, minmax(0, 1fr))` }}>
            {fields.map((f) => (
              <div key={f.label}>
                <dt>{f.label}</dt>
                <dd className={f.big ? styles.loanBig : undefined}>{f.value(l)}</dd>
              </div>
            ))}
          </dl>
        </li>
      ))}
    </ul>
  );
}

/** Loan Repayments tab: monitoring-only notice, status filters, and the loans as a table or cards. */
export default function LoanRepayments() {
  const [view, setView] = useState("all");

  return (
    <div className={styles.loans}>
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
            data-layout={v.fields ? "cards" : v.tracking ? "tracking" : "table"}
            className={styles.subTab}
            onClick={() => setView(v.id)}
          >
            {v.label} <span className={styles.count}>({v.rows.length})</span>
          </button>
        ))}
      </div>

      {VIEWS.map((v) => (
        <div key={v.id} role="tabpanel" id={`loan-panel-${v.id}`} aria-labelledby={`loan-tab-${v.id}`} hidden={view !== v.id}>
          {v.fields ? (
            <LoanCards rows={v.rows} fields={v.fields} />
          ) : v.tracking ? (
            <RepaymentTable rows={v.rows} />
          ) : (
            <LoanTable rows={v.rows} />
          )}
        </div>
      ))}
    </div>
  );
}
