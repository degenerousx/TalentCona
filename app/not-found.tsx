import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import styles from "./not-found.module.css";

export const metadata: Metadata = { title: "Page not found · TalentCona" };

/** Shown for unknown routes and for ids (students, mentors, programs) that don't exist. */
export default function NotFound() {
  return (
    <main className={styles.page}>
      <Image src="/images/talentcona-logo.png" alt="TalentCona" width={124} height={48} priority />
      <p className={styles.code}>404</p>
      <h1 className={styles.title}>Page not found</h1>
      <p className={styles.text}>The page you’re looking for doesn’t exist or may have been moved.</p>
      <Link href="/dashboard" className={styles.action}>
        Back to Dashboard
      </Link>
    </main>
  );
}
