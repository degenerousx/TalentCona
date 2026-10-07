"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { DashboardIcon, LogoutIcon, SidebarToggleIcon, UserLinearIcon, WalletIcon } from "./icons";
import styles from "./AppShell.module.css";

const NAV = [
  { href: "/dashboard", label: "Dashboard", Icon: DashboardIcon },
  { href: "/user-management", label: "User Management", Icon: UserLinearIcon },
  { href: "/financial-ops", label: "Financial Ops", Icon: WalletIcon },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside className={styles.sidebar} data-collapsed={collapsed}>
      <nav className={styles.nav} aria-label="Main">
        {NAV.map(({ href, label, Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              className={`${styles.navItem} ${active ? styles.navActive : ""}`}
              aria-current={active ? "page" : undefined}
              title={collapsed ? label : undefined}
            >
              <Icon color={active ? "#FFFFFF" : "#0F172A"} />
              <span className={styles.navLabel}>{label}</span>
            </Link>
          );
        })}
      </nav>

      <Link href="/sign-in" className={styles.logout} title={collapsed ? "Logout" : undefined}>
        <LogoutIcon />
        <span className={styles.navLabel}>Logout</span>
      </Link>

      <button
        type="button"
        className={styles.toggle}
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        aria-expanded={!collapsed}
        onClick={() => setCollapsed((c) => !c)}
      >
        <SidebarToggleIcon />
      </button>
    </aside>
  );
}
