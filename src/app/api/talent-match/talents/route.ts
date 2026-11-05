import { fetchTalents } from "@/app/(admin)/talent-match/_server/formcarry";
import { adminList } from "@/app/(admin)/talent-match/_server/handler";

/**
 * GET /api/talent-match/talents — job seekers from the talent network form.
 * Served by the portal itself: Next checks app routes before the `/api/*`
 * rewrite to the backend (next.config.ts), so only these paths stay here.
 */
export const dynamic = "force-dynamic";

export function GET(request: Request) {
  return adminList(request, fetchTalents);
}
