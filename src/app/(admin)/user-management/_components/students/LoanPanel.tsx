"use client";

import PanelState from "../shared/PanelState";
import { humanize, shortDate, useStudentLoan } from "../api";
import styles from "./LoanPanel.module.css";

/** The student's loan covering this program: /admin/loans + its repayment schedule. */
export default function LoanPanel({ studentId, programId }: { studentId: string; programId: string }) {
  const query = useStudentLoan(studentId, programId);
  if (query.isPending || query.isError) return <PanelState query={query} noun="loan" />;
  const loan = query.data;
  if (!loan) return <p className={styles.none}>This student has no loan for this program.</p>;

  const stats = [
    { label: "Loan Amount", value: loan.total ?? "—", tone: styles.green },
    { label: "Total Paid", value: loan.paid ?? "—", tone: styles.green },
    { label: "Total Due", value: loan.due ?? "—", tone: styles.blue },
    { label: "Next Payment", value: loan.nextDue ? (shortDate(loan.nextDue) ?? "—") : loan.schedule ? "None due" : "—", tone: `${styles.orange} ${styles.date}` },
  ];

  return (
    <div className={styles.panel}>
      <div className={styles.stats}>
        {stats.map((s) => (
          <div key={s.label} className={`${styles.stat} ${s.tone}`}>
            <p className={styles.label}>{s.label}</p>
            <p className={styles.value}>{s.value}</p>
          </div>
        ))}
      </div>
      <p className={styles.note}>
        Status: <strong>{humanize(loan.status)}</strong>
        {loan.principal && ` · Borrowed ${loan.principal}`}
        {loan.monthly && loan.months ? ` · ${loan.monthly} a month for ${loan.months} months` : ""}
        {loan.items.length > 0 && ` · Covers ${loan.items.join(", ")}`}
      </p>

      <div className={styles.history}>
        <h2 className={styles.heading}>Repayment Schedule</h2>
        {loan.schedule === null ? (
          <p className={styles.note}>The backend doesn&apos;t share this loan&apos;s repayment schedule with admins yet.</p>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th scope="col">Due Date</th>
                  <th scope="col">Amount</th>
                  <th scope="col">Paid On</th>
                  <th scope="col">Status</th>
                </tr>
              </thead>
              <tbody>
                {loan.schedule.length === 0 ? (
                  <tr>
                    <td colSpan={4} className={styles.empty}>
                      No repayments scheduled yet.
                    </td>
                  </tr>
                ) : (
                  loan.schedule.map((r) => (
                    <tr key={r.id}>
                      <td className={styles.date}>
                        <time dateTime={r.dueDate}>{shortDate(r.dueDate)}</time>
                      </td>
                      <td className={styles.amount}>{r.amount}</td>
                      <td className={styles.method}>{r.paidAt ? shortDate(r.paidAt) : "—"}</td>
                      <td>
                        <span className={r.paidAt ? styles.pill : `${styles.pill} ${styles.pillPending}`}>{r.paidAt ? "Paid" : "Upcoming"}</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
