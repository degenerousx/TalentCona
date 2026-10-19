"use client";

import { useSession, type Session } from "./session";

/**
 * Admin privileges, as the backend names them (login/refresh `admin.privileges`,
 * and the Admin Management "Catalog" request in Postman).
 *
 * These checks are UX only — they hide what an admin can't use. The backend
 * must still reject unauthorised requests (403) on every endpoint.
 */
export const PRIVILEGES = [
  "DASHBOARD_VIEW_AUDIT_LOG",
  "DASHBOARD_VIEW_PENDING_APPROVALS",
  "VIEW_AUDIT_LOG",
  "MANAGE_USERS",
  "MANAGE_ADMINS",
  "MANAGE_ADMISSIONS_ROUTING",
  "MANAGE_PROGRAMS",
  "MANAGE_TALENT_COMPANY_REQUESTS",
  "MANAGE_SUPPORT",
  "MANAGE_FINANCIAL_OPERATIONS",
  "MANAGE_LAPTOPS",
  "MANAGE_COMMUNITIES",
  "MANAGE_REFERRALS",
  "VIEW_REPORTS_INSIGHTS",
] as const;

export type Privilege = (typeof PRIVILEGES)[number];

/** Super admins can do everything; everyone else needs the privilege in their list. */
export function can(session: Session | null, privilege: Privilege) {
  const admin = session?.admin;
  if (!admin) return false;
  return admin.isSuperAdmin || admin.privileges.includes(privilege);
}

/** `const canApprove = useCan("MANAGE_FINANCIAL_OPERATIONS")` — re-renders when the session changes. */
export function useCan(privilege: Privilege) {
  return can(useSession(), privilege);
}

/**
 * Renders children only if the signed-in admin has the privilege.
 *
 *   <Can privilege="MANAGE_LAPTOPS"><Button>Delete</Button></Can>
 *
 * Use `fallback` to show something else, e.g. a disabled button with a tooltip.
 */
export function Can({
  privilege,
  fallback = null,
  children,
}: {
  privilege: Privilege;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}) {
  return useCan(privilege) ? children : fallback;
}
