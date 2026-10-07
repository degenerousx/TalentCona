import type { Metadata } from "next";
import styles from "@/components/users/UserManagement.module.css";

export const metadata: Metadata = {
  title: "Financial Ops · TalentCona",
};

// Placeholder until the Financial Ops design is ready.
export default function FinancialOpsPage() {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Financial Ops</h1>
        <p className={styles.subtitle}>This page is coming soon.</p>
      </header>
    </div>
  );
}
