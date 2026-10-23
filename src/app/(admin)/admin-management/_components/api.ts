import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Admin, AdminForm, Invitation, Page, ProgramOption, Role } from "./data";

/**
 * Admin Management ↔ backend. Shapes copied from the Postman examples
 * (Admin App → Admin Management). Components import only the hooks below.
 */

// ---- Backend shapes ---------------------------------------------------------

type ApiPage<T> = { items: T[]; page: number; pageSize: number; total: number; totalPages?: number };

type ApiCatalog = {
  privileges: { privilege: string; label: string; group: string; description?: string }[];
};

/**
 * A program attached to a member or invitation. Every Postman example has an
 * empty list, so the item shape isn't documented — accept the likely forms.
 */
type ApiProgramRef = {
  id?: string;
  programId?: string;
  title?: string;
  program?: { id: string; title?: string };
};

type ApiInvitation = {
  id: string;
  email: string;
  fullName: string | null;
  status: string;
  expiresAt: string;
  isProgramAdvisor: boolean;
  isExpired?: boolean;
  privileges: { privilege: string }[];
  programs: ApiProgramRef[];
};

type ApiMember = {
  id: string;
  email: string;
  fullName: string | null;
  status: "Active" | "Inactive" | string;
  lastLoginAt: string | null;
  isSuperAdmin: boolean;
  privileges: string[];
  isProgramAdvisor: boolean;
  programs: ApiProgramRef[];
};

type ApiProgram = { id: string; title: string; school?: { name: string } | null };

// ---- Mapping ----------------------------------------------------------------

/** Lists have no pagination UI; the backend's page size tops out at 100. */
const PAGE_SIZE = 100;

function programOf(ref: ApiProgramRef) {
  const id = ref.program?.id ?? ref.programId ?? ref.id ?? "";
  return { id, title: ref.program?.title ?? ref.title ?? "" };
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

/** "2024-02-16 08:30" in the viewer's time zone, like the design. */
function formatLogin(iso: string | null) {
  if (!iso) return "Never";
  const d = new Date(iso);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** Time left on an invitation: "18 hours", "6 days", or "Expired". */
function timeLeft(iso: string, expired: boolean) {
  const ms = new Date(iso).getTime() - Date.now();
  if (expired || ms <= 0) return "Expired";
  const hours = Math.ceil(ms / 3_600_000);
  if (hours < 48) return `${hours} ${hours === 1 ? "hour" : "hours"}`;
  return `${Math.floor(hours / 24)} days`;
}

function toInvitation(i: ApiInvitation): Invitation {
  const expired = i.isExpired ?? i.status === "Expired";
  return {
    id: i.id,
    name: i.fullName || i.email,
    email: i.email,
    roles: i.privileges.map((p) => p.privilege),
    status: expired ? "Expired" : "Pending",
    expires: timeLeft(i.expiresAt, expired),
  };
}

function toAdmin(m: ApiMember): Admin {
  const programs = m.programs.map(programOf);
  const titles = programs.map((p) => p.title).filter(Boolean);
  return {
    id: m.id,
    name: m.fullName || m.email,
    email: m.email,
    isSuperAdmin: m.isSuperAdmin,
    roles: m.privileges,
    status: m.status === "Active" ? "Active" : "Inactive",
    advisor: m.isProgramAdvisor ? "Yes" : "No",
    programIds: programs.map((p) => p.id).filter(Boolean),
    programs: titles.length ? titles.join(", ") : "-",
    lastLogin: formatLogin(m.lastLoginAt),
  };
}

// ---- Queries ----------------------------------------------------------------

const keys = {
  roles: ["admin-management", "roles"] as const,
  invitations: ["admin-management", "invitations"] as const,
  members: ["admin-management", "members"] as const,
  programs: ["admin-management", "programs"] as const,
};

/** Roles = the privileges an admin can be granted (Postman "Catalog"). */
export function useRoles() {
  return useQuery({
    queryKey: keys.roles,
    queryFn: async (): Promise<Role[]> => (await api<ApiCatalog>("/admin-portal/team/catalog")).privileges,
    staleTime: Infinity,
  });
}

export function usePendingInvitations() {
  return useQuery({
    queryKey: keys.invitations,
    queryFn: async (): Promise<Page<Invitation>> => {
      const res = await api<ApiPage<ApiInvitation>>("/admin-portal/team/invitations/pending", {
        query: { page: 1, pageSize: PAGE_SIZE },
      });
      return { items: res.items.map(toInvitation), total: res.total };
    },
  });
}

export function useTeamMembers() {
  return useQuery({
    queryKey: keys.members,
    queryFn: async (): Promise<Page<Admin>> => {
      const res = await api<ApiPage<ApiMember>>("/admin-portal/team/members", {
        query: { page: 1, pageSize: PAGE_SIZE },
      });
      return { items: res.items.map(toAdmin), total: res.total };
    },
  });
}

/** Programs an advisor can be assigned to. Only fetched once the picker is used. */
export function useProgramOptions(enabled: boolean) {
  return useQuery({
    queryKey: keys.programs,
    queryFn: async (): Promise<ProgramOption[]> => {
      const res = await api<ApiPage<ApiProgram>>("/programs/admin", { query: { page: 1, pageSize: PAGE_SIZE } });
      return res.items.map((p) => ({ id: p.id, name: p.title, category: p.school?.name ?? "" }));
    },
    enabled,
    staleTime: 5 * 60_000,
  });
}

// ---- Mutations --------------------------------------------------------------

function useInvalidate(key: readonly string[]) {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: key });
}

export function useInviteAdmin() {
  const invalidate = useInvalidate(keys.invitations);
  return useMutation({
    mutationFn: (form: AdminForm) =>
      api("/admin-portal/team/invitations", {
        method: "POST",
        body: {
          fullName: form.name,
          email: form.email,
          privileges: form.roles,
          isProgramAdvisor: form.isProgramAdvisor,
          programIds: form.isProgramAdvisor ? form.programIds : [],
        },
      }),
    onSuccess: invalidate,
  });
}

export function useUpdateAdmin() {
  const invalidate = useInvalidate(keys.members);
  return useMutation({
    mutationFn: ({ id, form }: { id: string; form: AdminForm }) =>
      api(`/admin-portal/team/members/${encodeURIComponent(id)}`, {
        method: "PUT",
        body: {
          privileges: form.roles,
          isProgramAdvisor: form.isProgramAdvisor,
          programIds: form.isProgramAdvisor ? form.programIds : [],
        },
      }),
    onSuccess: invalidate,
  });
}

export function useResendInvitation() {
  const invalidate = useInvalidate(keys.invitations);
  return useMutation({
    mutationFn: (id: string) =>
      api(`/admin-portal/team/invitations/${encodeURIComponent(id)}/resend`, { method: "PATCH" }),
    onSuccess: invalidate,
  });
}

export function useRevokeInvitation() {
  const invalidate = useInvalidate(keys.invitations);
  return useMutation({
    mutationFn: (id: string) =>
      api(`/admin-portal/team/invitations/${encodeURIComponent(id)}/revoke`, { method: "PATCH" }),
    onSuccess: invalidate,
  });
}

/** Deactivate or reactivate a team member. */
export function useSetAdminActive() {
  const invalidate = useInvalidate(keys.members);
  return useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      api(`/admin-portal/team/members/${encodeURIComponent(id)}/${active ? "reactivate" : "deactivate"}`, {
        method: "PATCH",
      }),
    onSuccess: invalidate,
  });
}
