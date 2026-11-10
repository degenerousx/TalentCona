/**
 * UI types for Admin Management. `api.ts` maps the backend's shapes onto these,
 * so components never see API field names.
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
