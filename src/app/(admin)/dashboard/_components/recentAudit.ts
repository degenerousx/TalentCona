import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useCan } from "@/lib/permissions";
import { toEvent } from "../../audit-logs/_components/model";

/**
 * Dashboard → Recent Activity: the 5 newest audit events platform-wide.
 *   GET /audit/logs?limit=5&range=30d   (VIEW_AUDIT_LOG or DASHBOARD_VIEW_AUDIT_LOG)
 * Refreshed every 30 s while the tab is visible, and on focus.
 */
export function useRecentAudit() {
  const full = useCan("VIEW_AUDIT_LOG");
  const dashboard = useCan("DASHBOARD_VIEW_AUDIT_LOG");
  const allowed = full || dashboard;
  const query = useQuery({
    queryKey: ["dashboard", "recent-audit"],
    enabled: allowed,
    staleTime: 0,
    refetchOnWindowFocus: true,
    refetchInterval: 30_000,
    queryFn: async () => (await api<{ items: unknown[] }>("/audit/logs", { query: { limit: 5, range: "30d" } })).items.map(toEvent),
  });
  return { ...query, allowed };
}
