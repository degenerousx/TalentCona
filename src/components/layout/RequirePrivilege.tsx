"use client";

import { Lock } from "lucide-react";
import { usePathname } from "next/navigation";
import { ButtonLink } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/States";
import { navItemFor } from "@/config/navigation";
import { useCan, type Privilege } from "@/lib/permissions";

/**
 * Blocks admin pages the signed-in admin has no privilege for — including
 * typing the URL directly. The required privilege comes from the matching
 * sidebar item in src/config/navigation.ts, so every page under a module is
 * covered without per-module code.
 *
 * UX only: the backend must still answer 403 to these admins.
 */
export default function RequirePrivilege({ children }: { children: React.ReactNode }) {
  const privilege = navItemFor(usePathname())?.privilege;
  return privilege ? <Gate privilege={privilege}>{children}</Gate> : children;
}

function Gate({ privilege, children }: { privilege: Privilege; children: React.ReactNode }) {
  if (useCan(privilege)) return children;
  return (
    <div className="p-8">
      <EmptyState
        icon={Lock}
        title="You don't have access to this page"
        description="Your admin account doesn't have permission for this section. Ask a super admin if you need it."
        action={
          <ButtonLink href="/dashboard" size="md">
            Back to Dashboard
          </ButtonLink>
        }
      />
    </div>
  );
}
