import { fetchHiringRequests } from "@/app/(admin)/talent-match/_server/formcarry";
import { adminList } from "@/app/(admin)/talent-match/_server/handler";

/** GET /api/talent-match/hiring-requests — recruitment requests from the hiring form. */
export const dynamic = "force-dynamic";

export function GET(request: Request) {
  return adminList(request, fetchHiringRequests);
}
