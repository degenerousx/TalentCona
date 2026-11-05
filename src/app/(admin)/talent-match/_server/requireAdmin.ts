/**
 * Server-only: checks that a request comes from a signed-in admin before it
 * gets candidates' personal data.
 *
 * The portal has no session on the server, so the check asks the backend:
 * an admin endpoint answers 401 to a missing, expired or forged token. A
 * genuine token may still get 403 there (it needs MANAGE_ADMINS), so 403
 * counts as valid — and the token's claims must also show a completed admin
 * MFA, which a student token doesn't carry. Claims can't be altered without
 * breaking the signature the backend just checked.
 */
const API_URL = process.env.API_URL ?? "https://talentcona-backend.onrender.com";
/** Any admin endpoint works; this one is small. */
const PROBE_PATH = "/admin-portal/team/catalog";

/** The token's payload, unverified — trusted only after the backend accepts the token. */
function claimsOf(token: string): Record<string, unknown> {
  try {
    return JSON.parse(Buffer.from(token.split(".")[1] ?? "", "base64url").toString("utf8"));
  } catch {
    return {};
  }
}

export type AdminCheck = { ok: true } | { ok: false; status: number; code: string; message: string };

export async function requireAdmin(request: Request): Promise<AdminCheck> {
  const header = request.headers.get("authorization") ?? "";
  const token = header.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!token) return { ok: false, status: 401, code: "HTTP_401", message: "Unauthorized" };
  if (claimsOf(token).adminMfa !== "complete") {
    return { ok: false, status: 403, code: "HTTP_403", message: "Only admins can view candidates." };
  }

  let res: Response;
  try {
    res = await fetch(`${API_URL}${PROBE_PATH}`, {
      headers: { Accept: "application/json", Authorization: `Bearer ${token}`, "x-client-app": "admin" },
      cache: "no-store",
    });
  } catch {
    return { ok: false, status: 502, code: "BACKEND_UNREACHABLE", message: "Couldn't verify your session. Try again in a moment." };
  }
  if (res.status === 401) return { ok: false, status: 401, code: "HTTP_401", message: "Unauthorized" };
  if (res.ok || res.status === 403) return { ok: true };
  return { ok: false, status: 502, code: "BACKEND_ERROR", message: "Couldn't verify your session. Try again in a moment." };
}
