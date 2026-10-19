/**
 * The `?next=` path to return to after sign-in, or null. Only same-site paths:
 * "//evil.com" or "https://…" would turn sign-in into an open redirect.
 */
export function safeNext(next: string | null) {
  return next && next.startsWith("/") && !next.startsWith("//") && !next.startsWith("/\\") ? next : null;
}
