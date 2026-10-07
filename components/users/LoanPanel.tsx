import { totalPaid, type Student } from "./data";
import styles from "./LoanPanel.module.css";

const money = (n: number) => `$${n.toLocaleString("en-US")}`;

export default function LoanPanel({ student }: { student: Student }) {
  const { loan } = student;
  const paid = totalPaid(loan);
  const due = Math.max(loan.programFee - paid, 0);

  const stats = [
    { label: "Program Fee", value: money(loan.programFee), tone: styles.green },
    { label: "Total Paid", value: money(paid), tone: styles.green },
    { label: "Total Due", value: money(due), tone: styles.blue },
    { label: "Next Payment", value: loan.nextPayment, tone: `${styles.orange} ${styles.date}` },
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

      <div className={styles.history}>
        <h2 className={styles.heading}>Payment History</h2>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th scope="col">Date</th>
                <th scope="col">Amount</th>
                <th scope="col">Method</th>
                <th scope="col">Status</th>
              </tr>
            </thead>
            <tbody>
              {loan.payments.length === 0 ? (
                <tr>
                  <td colSpan={4} className={styles.empty}>No payments yet.</td>
                </tr>
              ) : (
                loan.payments.map((p) => (
                  <tr key={`${p.date}-${p.amount}`}>
                    <td className={styles.date}>
                      <time dateTime={p.date}>{p.date}</time>
                    </td>
                    <td className={styles.amount}>${p.amount}</td>
                    <td className={styles.method}>{p.method}</td>
                    <td>
                      <span className={styles.pill}>{p.status}</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
