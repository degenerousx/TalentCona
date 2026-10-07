import Image from "next/image";
import Sidebar from "./Sidebar";
import { BellIcon } from "./icons";
import styles from "./AppShell.module.css";

/** Signed-in layout: top header, collapsible sidebar and page content. */
export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Image className={styles.logo} src="/images/talentcona-logo.png" alt="TalentCona" width={124} height={48} priority />
        <div className={styles.actions}>
          <button type="button" className={styles.iconButton} aria-label="Notifications">
            <BellIcon />
          </button>
          <Image className={styles.avatar} src="/images/avatar-john.png" alt="John" width={32} height={32} />
        </div>
      </header>

      <div className={styles.body}>
        <Sidebar />
        <main className={styles.main}>{children}</main>
      </div>
    </div>
  );
}
