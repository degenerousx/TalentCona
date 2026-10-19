"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "./api";
import { can } from "./permissions";
import { isMfaComplete, useSession } from "./session";

/**
 * The signed-in admin's display name, email and initials.
 *
 * There's no admin "me" endpoint: /account/profile is for students (403 for
 * admins), and the token only carries `sub` and `email`. The name comes from
 * the team members list, which needs admin-management rights — admins without
 * them get `name: null` and the UI falls back to the email.
 * TODO(backend): include `fullName` in the login/refresh response.
 */

type TeamMember = { id: string; fullName: string | null };

export type CurrentAdmin = {
  id: string | null;
  name: string | null;
  email: string | null;
  /** One or two letters for the avatar. */
  initials: string;
};

function initialsOf(name: string | null, email: string | null) {
  if (name) {
    const parts = name.trim().split(/\s+/);
    return (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase();
  }
  return email?.[0]?.toUpperCase() ?? "?";
}

export function useCurrentAdmin(): CurrentAdmin {
  const session = useSession();
  const id = typeof session?.claims.sub === "string" ? session.claims.sub : null;
  const email = typeof session?.claims.email === "string" ? session.claims.email : null;
  const canListTeam = can(session, "MANAGE_ADMINS");

  const { data: name = null } = useQuery({
    queryKey: ["current-admin", id],
    queryFn: async () => {
      const page = await api<{ items: TeamMember[] }>("/admin-portal/team/members", { query: { pageSize: 100 } });
      return page.items.find((m) => m.id === id)?.fullName ?? null;
    },
    enabled: isMfaComplete(session) && !!id && canListTeam,
    staleTime: Infinity,
  });

  return { id, name, email, initials: initialsOf(name, email) };
}
