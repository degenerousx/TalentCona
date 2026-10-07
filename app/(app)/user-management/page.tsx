import type { Metadata } from "next";
import styles from "@/components/dashboard/Dashboard.module.css";

export const metadata: Metadata = {
  title: "User Management · TalentCona",
};

// Placeholder until the User Management design is ready.
export default function UserManagementPage() {
  return (
    <div className={styles.dashboard}>
      <header>
        <h1 className={styles.welcomeTitle}>User Management</h1>
        <p className={styles.welcomeText}>This page is coming soon.</p>
      </header>
    </div>
  );
}
