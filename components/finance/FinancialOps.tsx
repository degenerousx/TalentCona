"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { CircleAlertIcon, ClockIcon, CreditCardIcon, DollarSignIcon, TrendingUpIcon } from "@/components/app/icons";
import { Toast } from "@/components/users/ActionModals";
import page from "@/components/users/UserManagement.module.css";
import {
  EXPENSES,
  FINANCE_STATS as S,
  MONTHS,
  REVENUE,
  TRANSACTIONS,
  WALLETS,
  WITHDRAWALS,
  usd,
  type TxStatus,
  type WalletLine,
} from "./data";
import LoanRepayments from "./LoanRepayments";
import RevenueChart from "./RevenueChart";
import styles from "./FinancialOps.module.css";

const TABS = [
  { id: "ledger", label: "Transaction Ledger" },
  { id: "wallets", label: "Wallet Management" },
  { id: "withdrawals", label: "Withdrawal Requests" },
  { id: "loans", label: "Loan Repayments" },
] as const;
type Tab = (typeof TABS)[number]["id"];

const STATUS_CLASS: Record<TxStatus, string> = {
  Completed: styles.completed,
  Restricted: styles.restricted,
  Pending: styles.pending,
};

function Status({ value }: { value: TxStatus }) {
  return <span className={`${styles.status} ${STATUS_CLASS[value]}`}>{value}</span>;
}

function StatCard({
  label,
  value,
  note,
  noteClass,
  labelClass,
  icon,
}: {
  label: string;
  value: string;
  note: string;
  noteClass?: string;
  labelClass?: string;
  icon: ReactNode;
}) {
  return (
    <div className={styles.stat}>
      <div className={styles.statTop}>
        <div className={styles.statText}>
          <p className={`${styles.statLabel} ${labelClass ?? ""}`}>{label}</p>
          <p className={styles.statValue}>{value}</p>
        </div>
        <span className={styles.statIcons}>{icon}</span>
      </div>
      <p className={`${styles.statNote} ${noteClass ?? ""}`}>{note}</p>
    </div>
  );
}

function WalletCard({ title, total, tone, lines, note }: { title: string; total: number; tone: "green" | "orange"; lines: WalletLine[]; note?: string }) {
  return (
    <div className={styles.wallet}>
      <h3 className={styles.walletTitle}>{title}</h3>
      <p className={`${styles.walletTotal} ${tone === "green" ? styles.green : styles.orange}`}>{usd(total)}</p>
      <dl className={styles.walletLines}>
        {lines.map((l) => (
          <div key={l.label} className={styles.walletLine}>
            <dt>{l.label}</dt>
            <dd>{usd(l.amount)}</dd>
          </div>
        ))}
      </dl>
      {note && (
        <p className={styles.walletNote}>
          <CircleAlertIcon size={14} color="#9F2D00" strokeWidth={2} />
          {note}
        </p>
      )}
    </div>
  );
}

export default function FinancialOps() {
  const [tab, setTab] = useState<Tab>("ledger");
  const [toast, setToast] = useState<string | null>(null);
  const clearToast = useCallback(() => setToast(null), []);

  // The tab lives in the URL hash (e.g. #wallets) so links and Back keep it.
  useEffect(() => {
    const fromHash = window.location.hash.slice(1) as Tab;
    if (TABS.some((t) => t.id === fromHash)) setTab(fromHash);
  }, []);

  return (
    <div className={page.page}>
      <header className={page.header}>
        <h1 className={page.title}>Financial Operations</h1>
        <p className={page.subtitle}>Manage transactions, wallets, and loan repayments</p>
      </header>

      <div className={styles.stats}>
        <StatCard
          label="Total Revenue (MTD)"
          value={usd(S.revenueMtd)}
          note={`+${S.revenueMtdChange}% from last month`}
          noteClass={styles.noteGreen}
          icon={
            <>
              <TrendingUpIcon size={32} color="#00C950" />
              <DollarSignIcon size={32} color="#00C853" />
            </>
          }
        />
        <StatCard
          label="Total Revenue (YTD)"
          labelClass={styles.labelDark}
          value={usd(S.revenueYtd)}
          note={`+${S.revenueYtdChange}% from last year`}
          noteClass={styles.noteBrand}
          icon={<DollarSignIcon size={32} color="#302A91" />}
        />
        <StatCard label="Available Funds" value={usd(S.availableFunds)} note="Operational wallet" icon={<DollarSignIcon size={32} color="#2B7FFF" />} />
        <StatCard label="Restricted Funds" value={usd(S.restrictedFunds)} note="Fundraising & loans" icon={<CreditCardIcon size={32} color="#FF6900" />} />
        <StatCard
          label="Pending Payouts"
          value={usd(S.pendingPayouts)}
          note={`${S.pendingRequests} ${S.pendingRequests === 1 ? "request" : "requests"}`}
          icon={<ClockIcon size={32} color="#AD46FF" />}
        />
      </div>

      <section className={styles.chartCard} aria-labelledby="revenue-title">
        <div className={styles.chartHead}>
          <h2 id="revenue-title" className={styles.chartTitle}>
            Revenue vs Expenses
          </h2>
          <ul className={styles.legend}>
            <li>
              <span className={styles.dot} style={{ background: "#00C950" }} />
              Revenue ($)
            </li>
            <li>
              <span className={styles.dot} style={{ background: "#EF4444" }} />
              Expenses
            </li>
          </ul>
        </div>
        <RevenueChart
          months={MONTHS}
          series={[
            { name: "Revenue ($)", values: REVENUE, color: "#10B981" },
            { name: "Expenses", values: EXPENSES, color: "#EF4444" },
          ]}
        />
      </section>

      <section className={styles.tabsCard}>
        <div className={styles.tabs} role="tablist" aria-label="Financial operations">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              id={`tab-${t.id}`}
              aria-selected={tab === t.id}
              aria-controls={`panel-${t.id}`}
              className={styles.tab}
              onClick={() => {
                setTab(t.id);
                window.history.replaceState(null, "", t.id === "ledger" ? window.location.pathname : `#${t.id}`);
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div role="tabpanel" id="panel-ledger" aria-labelledby="tab-ledger" hidden={tab !== "ledger"} className={styles.panel}>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Type</th>
                  <th>User</th>
                  <th>Amount</th>
                  <th>Method</th>
                  <th>Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {TRANSACTIONS.map((t) => (
                  <tr key={t.id}>
                    <td className={styles.strong}>{t.type}</td>
                    <td>{t.user}</td>
                    <td className={styles.amount}>${t.amount}</td>
                    <td>{t.method}</td>
                    <td>{t.date}</td>
                    <td>
                      <Status value={t.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div role="tabpanel" id="panel-wallets" aria-labelledby="tab-wallets" hidden={tab !== "wallets"} className={`${styles.panel} ${styles.padded}`}>
          <div className={styles.wallets}>
            <WalletCard title={WALLETS.available.title} total={WALLETS.available.total} tone="green" lines={WALLETS.available.lines} />
            <WalletCard
              title={WALLETS.restricted.title}
              total={WALLETS.restricted.total}
              tone="orange"
              lines={WALLETS.restricted.lines}
              note={WALLETS.restricted.note}
            />
          </div>
        </div>

        <div
          role="tabpanel"
          id="panel-withdrawals"
          aria-labelledby="tab-withdrawals"
          hidden={tab !== "withdrawals"}
          className={`${styles.panel} ${styles.padded}`}
        >
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>User</th>
                  <th>Amount</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {WITHDRAWALS.map((w) => (
                  <tr key={w.id}>
                    <td>{w.user}</td>
                    <td className={styles.amount}>${w.amount}</td>
                    <td>{w.date}</td>
                    <td>
                      <Status value={w.status} />
                    </td>
                    <td>
                      <button type="button" className={styles.view} onClick={() => setToast(`Details for ${w.user}'s withdrawal are coming soon.`)}>
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div role="tabpanel" id="panel-loans" aria-labelledby="tab-loans" hidden={tab !== "loans"} className={`${styles.panel} ${styles.padded}`}>
          <LoanRepayments />
        </div>
      </section>

      {toast && <Toast message={toast} onDone={clearToast} />}
    </div>
  );
}
