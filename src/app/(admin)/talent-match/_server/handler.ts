/**
 * Server-only: the shared body of the Talent Match route handlers. Answers in
 * the backend's envelope so `api()` handles these routes like any endpoint,
 * and only for signed-in admins (see requireAdmin).
 */
import { FormcarryError } from "./formcarry";
import { requireAdmin } from "./requireAdmin";

function envelope(status: number, data: unknown, error: { code: string; message: string } | null) {
  return Response.json(
    { success: error === null, data, error, meta: { requestId: crypto.randomUUID(), timestamp: new Date().toISOString() } },
    { status, headers: { "Cache-Control": "no-store" } },
  );
}

export async function adminList(request: Request, load: () => Promise<unknown[]>) {
  const admin = await requireAdmin(request);
  if (!admin.ok) return envelope(admin.status, null, { code: admin.code, message: admin.message });

  try {
    return envelope(200, { items: await load() }, null);
  } catch (err) {
    if (err instanceof FormcarryError) return envelope(err.status, null, { code: err.code, message: err.message });
    console.error("[talent-match] request failed", err);
    return envelope(500, null, { code: "INTERNAL", message: "Couldn't load Talent Match data. Try again in a moment." });
  }
}
