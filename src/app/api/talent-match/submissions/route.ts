import { FormcarryError, fetchCandidates } from "@/app/(admin)/talent-match/_server/formcarry";
import { requireAdmin } from "@/app/(admin)/talent-match/_server/requireAdmin";

/**
 * GET /api/talent-match/submissions — the talent network form's submissions as
 * Talent Match candidates, for signed-in admins only.
 *
 * Served by the portal itself: Next checks app routes before the `/api/*`
 * rewrite to the backend (next.config.ts), so only this path stays here.
 * Answers in the backend's envelope so `api()` handles it like any endpoint.
 */
export const dynamic = "force-dynamic";

function envelope(status: number, data: unknown, error: { code: string; message: string } | null) {
  return Response.json(
    { success: error === null, data, error, meta: { requestId: crypto.randomUUID(), timestamp: new Date().toISOString() } },
    { status, headers: { "Cache-Control": "no-store" } },
  );
}

export async function GET(request: Request) {
  const admin = await requireAdmin(request);
  if (!admin.ok) return envelope(admin.status, null, { code: admin.code, message: admin.message });

  try {
    return envelope(200, { items: await fetchCandidates() }, null);
  } catch (err) {
    if (err instanceof FormcarryError) return envelope(err.status, null, { code: err.code, message: err.message });
    console.error("[talent-match] submissions failed", err);
    return envelope(500, null, { code: "INTERNAL", message: "Couldn't load candidates. Try again in a moment." });
  }
}
