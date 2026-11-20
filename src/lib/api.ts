import { clearSession, getAccessToken, setAccessToken, type AdminInfo } from "./session";

/**
 * The only place the portal calls fetch. Every request goes to this app's own
 * origin and is proxied to the backend (see rewrites in next.config.ts):
 * `/auth/*` as-is, everything else under `/api`.
 *
 * Browser-only: the access token lives in client memory.
 */

/** Confirmed from the Postman collection's pre-request script. */
const AUTH_HEADER = "Authorization";
/** "admin" gets an admin session; "consumer" would get a student one. */
const CLIENT_APP = "admin";

type Envelope<T> = {
  success: boolean;
  data: T;
  /** Validation errors (400) send `message` as a list, e.g. ["password must be longer than or equal to 8 characters"]. */
  error: { code: string; message: string | string[] } | null;
  meta?: { requestId?: string; timestamp?: string };
};

export class ApiError extends Error {
  constructor(
    /** HTTP status, or 0 when the request never got a response. */
    readonly status: number,
    /** Backend error code. Don't branch on it for auth: /auth/login says "Unauthorized", others "HTTP_401". */
    readonly code: string,
    message: string,
    /** Give this to the backend team — it identifies the exact request in their logs. */
    readonly requestId?: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/** Arrays are sent as repeated keys (`programIds=a&programIds=b`). */
export type Query = Record<string, string | number | boolean | null | undefined | readonly string[]>;

export type RequestOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  query?: Query;
  /** Extra headers for this request only. */
  headers?: Record<string, string>;
  /**
   * Send the access token (default true). Non-/auth requests also refresh and
   * retry once on 401; /auth/* requests surface their 401s (e.g. a wrong MFA code).
   */
  auth?: boolean;
  signal?: AbortSignal;
  /** Statuses the caller handles itself (e.g. 404 for "no such record"): thrown as usual, but not logged. */
  expectedStatuses?: number[];
};

function url(path: string, query?: Query) {
  const base = path.startsWith("/auth/") ? path : `/api${path}`;
  if (!query) return base;
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (Array.isArray(value)) for (const v of value) params.append(key, v);
    else if (value != null && value !== "") params.set(key, String(value));
  }
  const qs = params.toString();
  return qs ? `${base}?${qs}` : base;
}

async function send<T>(path: string, opts: RequestOptions): Promise<T> {
  const headers: Record<string, string> = {
    Accept: "application/json",
    "x-client-app": CLIENT_APP,
    ...opts.headers,
  };
  if (opts.body !== undefined) headers["Content-Type"] = "application/json";
  const token = opts.auth === false ? null : getAccessToken();
  if (token) headers[AUTH_HEADER] = `Bearer ${token}`;

  const method = opts.method ?? "GET";
  let res: Response;
  try {
    res = await fetch(url(path, opts.query), {
      method,
      headers,
      body: opts.body === undefined ? undefined : JSON.stringify(opts.body),
      credentials: "include",
      signal: opts.signal,
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") throw err;
    throw new ApiError(0, "NETWORK", "Couldn't reach the server. Check your connection and try again.");
  }

  const json = (await res.json().catch(() => null)) as Envelope<T> | null;
  if (res.ok && json?.success !== false) return (json?.data ?? null) as T;

  const message = json?.error?.message;
  const error = new ApiError(
    res.status,
    json?.error?.code ?? `HTTP_${res.status}`,
    (Array.isArray(message) ? message.join(". ") : message) || res.statusText || "Request failed",
    json?.meta?.requestId,
  );
  // Don't log errors that are part of normal flow: a refresh with no valid
  // cookie (signed out), an expired access token that api() refreshes and
  // retries, and wrong credentials at login (the form says so). In dev, Next
  // shows every console.error as an error overlay.
  const expected =
    opts.expectedStatuses?.includes(error.status) ||
    (error.status === 401 && (path === "/auth/refresh" || refreshesOn401(path, opts))) ||
    (path === "/auth/login" && (error.status === 400 || error.status === 401));
  if (!expected) {
    console.error(`[api] ${method} ${path} → ${error.status} ${error.code}: ${error.message}`, {
      requestId: error.requestId,
    });
  }
  throw error;
}

/** Whether api() handles a 401 for this request by refreshing and retrying. */
function refreshesOn401(path: string, opts: RequestOptions) {
  return opts.auth !== false && !path.startsWith("/auth/");
}

// ---- Refresh ---------------------------------------------------------------

let refreshing: Promise<string | null> | null = null;
let onSessionExpired: () => void = () => {};

/** Called when a refresh fails mid-session — the app redirects to /sign-in. */
export function setOnSessionExpired(handler: () => void) {
  onSessionExpired = handler;
}

/**
 * Get a new access token using the HttpOnly refresh cookie. Concurrent callers
 * share one request, so a burst of 401s triggers a single refresh.
 * Resolves to null when there is no valid refresh cookie.
 */
export function refreshAccessToken(): Promise<string | null> {
  const tokenBefore = getAccessToken();
  refreshing ??= send<{ accessToken: string; admin?: AdminInfo }>("/auth/refresh", { method: "POST", auth: false })
    .then(({ accessToken, admin }) => {
      // Refresh returns `admin` too, so privileges survive a reload.
      setAccessToken(accessToken, admin);
      return accessToken;
    })
    .catch(() => {
      // Only clear the token this refresh was meant to replace. If the admin
      // signed in while it was in flight (sign-in page check), keep that session.
      if (getAccessToken() === tokenBefore) clearSession();
      return null;
    })
    .finally(() => {
      refreshing = null;
    });
  return refreshing;
}

/**
 * Download a file endpoint (CSV / XLSX exports) with the admin's session and
 * save it in the browser. Uses the server's filename when it sends one.
 * Refreshes once on 401, like api(). Throws ApiError on failure.
 */
export async function apiDownload(path: string, opts: { query?: Query; filename: string }) {
  const get = async () => {
    const headers: Record<string, string> = { "x-client-app": CLIENT_APP };
    const token = getAccessToken();
    if (token) headers[AUTH_HEADER] = `Bearer ${token}`;
    try {
      return await fetch(url(path, opts.query), { headers, credentials: "include" });
    } catch {
      throw new ApiError(0, "NETWORK", "Couldn't reach the server. Check your connection and try again.");
    }
  };
  let res = await get();
  if (res.status === 401) {
    if (await refreshAccessToken()) res = await get();
    else onSessionExpired();
  }
  const type = res.headers.get("Content-Type") ?? "";
  if (!res.ok || type.includes("application/json")) {
    const json = (await res.json().catch(() => null)) as Envelope<unknown> | null;
    if (res.ok && json?.success !== false && typeof json?.data === "string") {
      // Some exports may come back as CSV text inside the envelope.
      return saveBlob(new Blob([json.data], { type: "text/csv;charset=utf-8" }), opts.filename);
    }
    const message = json?.error?.message;
    throw new ApiError(
      res.status,
      json?.error?.code ?? `HTTP_${res.status}`,
      (Array.isArray(message) ? message.join(". ") : message) || res.statusText || "Download failed",
      json?.meta?.requestId,
    );
  }
  const disposition = res.headers.get("Content-Disposition") ?? "";
  const named = /filename\*?=(?:UTF-8'')?"?([^";]+)"?/i.exec(disposition)?.[1];
  saveBlob(await res.blob(), named ? decodeURIComponent(named) : opts.filename);
}

function saveBlob(blob: Blob, filename: string) {
  const href = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = href;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(href), 1000);
}

/** Call a backend endpoint and return the envelope's `data`. Throws ApiError on failure. */
export async function api<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  try {
    return await send<T>(path, opts);
  } catch (err) {
    if (!refreshesOn401(path, opts) || !(err instanceof ApiError) || err.status !== 401) throw err;
    if (!(await refreshAccessToken())) {
      onSessionExpired();
      throw err;
    }
    try {
      return await send<T>(path, opts);
    } catch (retryErr) {
      // send() skips logging 401s here; a 401 with a freshly refreshed token is a real problem.
      if (retryErr instanceof ApiError && retryErr.status === 401) {
        console.error(`[api] ${opts.method ?? "GET"} ${path} → 401 even after refresh`, {
          requestId: retryErr.requestId,
        });
      }
      throw retryErr;
    }
  }
}
