/**
 * UI types for Admin Management. `api.ts` maps the backend's shapes onto these,
 * so components never see API field names. The fixtures below are the original
 * demo records, kept as test data.
 */

/** A privilege the backend can grant, as listed by its catalog. */
export type Role = {
  privilege: string;
  label: string;
  group: string;
  description?: string;
};

export type InvitationStatus = "Pending" | "Expired";

export type Invitation = {
  id: string;
  name: string;
  email: string;
  /** Privilege codes; shown with their catalog labels. */
  roles: string[];
  status: InvitationStatus;
  /** e.g. "18 hours", or "Expired". */
  expires: string;
};

export type AdminStatus = "Active" | "Inactive";

export type Admin = {
  id: string;
  name: string;
  email: string;
  isSuperAdmin: boolean;
  roles: string[];
  status: AdminStatus;
  advisor: "Yes" | "No";
  programIds: string[];
  /** Program titles, or "-" when there are none. */
  programs: string;
  lastLogin: string;
};

export type ProgramOption = { id: string; name: string; category: string };

/** What the create/edit dialog submits. */
export type AdminForm = {
  name: string;
  email: string;
  roles: string[];
  isProgramAdvisor: boolean;
  programIds: string[];
};

export type Page<T> = { items: T[]; total: number };

// ---- Fixtures (the original demo data) -------------------------------------

export const invitationFixtures: Invitation[] = [
  { id: "inv-1", name: "John Smith", email: "john.smith@angt.hub", roles: ["MANAGE_COMMUNITIES"], status: "Pending", expires: "18 hours" },
  { id: "inv-2", name: "Sarah Johnson", email: "sarah.j@angt.hub", roles: ["MANAGE_FINANCIAL_OPERATIONS"], status: "Pending", expires: "18 hours" },
  { id: "inv-3", name: "Mike Chen", email: "mike.chen@angt.hub", roles: ["MANAGE_SUPPORT"], status: "Expired", expires: "Expired" },
];

export const adminFixtures: Admin[] = [
  { id: "adm-1", name: "John Smith", email: "john.smith@angt.hub", isSuperAdmin: false, roles: ["MANAGE_COMMUNITIES"], status: "Active", advisor: "Yes", programIds: ["prg-1", "prg-2"], programs: "Frontend Engineering, Backend Development", lastLogin: "2024-02-16 08:30" },
  { id: "adm-2", name: "Sarah Johnson", email: "sarah.j@angt.hub", isSuperAdmin: false, roles: ["MANAGE_FINANCIAL_OPERATIONS"], status: "Active", advisor: "Yes", programIds: ["prg-2"], programs: "Backend Development", lastLogin: "2024-02-16 08:30" },
  { id: "adm-3", name: "Mike Chen", email: "mike.chen@angt.hub", isSuperAdmin: false, roles: ["MANAGE_SUPPORT"], status: "Active", advisor: "No", programIds: [], programs: "-", lastLogin: "2024-02-16 08:30" },
];

export const programFixtures: ProgramOption[] = [
  { id: "prg-1", name: "Frontend Engineering", category: "Web Development" },
  { id: "prg-2", name: "Backend Development", category: "Web Development" },
  { id: "prg-3", name: "Data Science", category: "Data & AI" },
  { id: "prg-4", name: "UX/UI Design", category: "Design" },
  { id: "prg-5", name: "Mobile Development", category: "Mobile" },
  { id: "prg-6", name: "DevOps Engineering", category: "Infrastructure" },
];
