import type { Privilege } from "@/lib/permissions";

/**
 * Sidebar menu — single source of truth.
 *
 * Every item is DISABLED by default: it shows in the sidebar but does nothing
 * when clicked. When your module is ready, flip `enabled` to `true` for your
 * item only (keep that change in its own small commit to avoid conflicts).
 *
 * Icons are Iconify names taken straight from the Figma layer names.
 * Browse more at https://icon-sets.iconify.design
 */
export type NavItem = {
  label: string;
  href: string;
  icon: string;
  enabled: boolean;
  /**
   * Privilege needed to see the item AND open any page under `href` (enforced
   * in the admin layout by RequirePrivilege). Omitted = every admin.
   * My Mentees and Sessions have no matching privilege in the backend catalog —
   * confirm with the backend who should see them.
   */
  privilege?: Privilege;
};

export const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: "material-symbols:dashboard-outline", enabled: true },
  { label: "User Management", href: "/user-management", icon: "solar:user-linear", enabled: true, privilege: "MANAGE_USERS" },
  { label: "Admin Management", href: "/admin-management", icon: "mingcute:user-star-line", enabled: true, privilege: "MANAGE_ADMINS" },
  { label: "My Mentees", href: "/my-mentees", icon: "lucide:calendar", enabled: true },
  { label: "Sessions", href: "/sessions", icon: "simple-icons:codementor", enabled: true },
  { label: "Admissions & Routing", href: "/admissions-routing", icon: "carbon:task-complete", enabled: true, privilege: "MANAGE_ADMISSIONS_ROUTING" },
  { label: "Manage Programs", href: "/manage-programs", icon: "mynaui:academic-hat", enabled: true, privilege: "MANAGE_PROGRAMS" },
  { label: "Talent Corner", href: "/talent-corner", icon: "mingcute:sparkles-line", enabled: true, privilege: "MANAGE_TALENT_COMPANY_REQUESTS" },
  { label: "Financial Ops", href: "/financial-ops", icon: "iconoir:wallet", enabled: true, privilege: "MANAGE_FINANCIAL_OPERATIONS" },
  { label: "Laptops", href: "/laptops", icon: "ic:baseline-laptop", enabled: true, privilege: "MANAGE_LAPTOPS" },
  { label: "Communities", href: "/communities", icon: "fluent:people-community-24-regular", enabled: true, privilege: "MANAGE_COMMUNITIES" },
  { label: "Referrals", href: "/referrals", icon: "tabler:transfer", enabled: true, privilege: "MANAGE_REFERRALS" },
  { label: "Reports & Insights", href: "/reports-insights", icon: "iconoir:stats-report", enabled: true, privilege: "VIEW_REPORTS_INSIGHTS" },
];

/** The nav item a path belongs to (`/laptops/new` → Laptops), or undefined. */
export function navItemFor(pathname: string) {
  return NAV_ITEMS.find((item) => pathname === item.href || pathname.startsWith(`${item.href}/`));
}
