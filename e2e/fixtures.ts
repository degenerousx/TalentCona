import { test as base, expect, type Page } from "@playwright/test";

/** The fake backend (e2e/mock/server.mjs). */
export const MOCK = "http://localhost:4100";

export type Logged = { method: string; path: string; query: Record<string, string | string[]>; body: unknown; unknown?: boolean };

/** Every API call the portal made since the test started. */
export async function requests(page: Page): Promise<Logged[]> {
  const res = await page.request.get(`${MOCK}/__requests`);
  return (await res.json()).data;
}

/** Waits until the portal has sent a matching request, and returns it. */
export async function sent(page: Page, method: string, path: string | RegExp) {
  let hit: Logged | undefined;
  await expect
    .poll(async () => {
      hit = (await requests(page)).findLast((r) => r.method === method && (typeof path === "string" ? r.path === path : path.test(r.path)));
      return !!hit;
    }, { message: `expected ${method} ${path}` })
    .toBe(true);
  return hit!;
}

/** Test-only actions on the fake backend. */
export const mock = {
  notify: (page: Page, n: Record<string, unknown> = {}) => page.request.post(`${MOCK}/__notify`, { data: n }),
  payout: (page: Page) => page.request.post(`${MOCK}/__payout`),
  failNext: (page: Page, method: string, path: string, status = 500, message = "Something went wrong") =>
    page.request.post(`${MOCK}/__fail`, { data: { method, path, status, message } }),
};

type Fixtures = {
  /** "super" (every privilege, the default) or "limited" (MANAGE_USERS + VIEW_AUDIT_LOG). */
  role: "super" | "limited" | "none";
};

/**
 * Every test starts with fresh data and, unless role is "none", already signed
 * in (the refresh cookie the real backend sets after sign-in + MFA). At the
 * end it fails if the portal called an endpoint the fake backend doesn't
 * know — a renamed or misspelled API path is a regression too.
 */
export const test = base.extend<Fixtures>({
  role: ["super", { option: true }],
  page: async ({ page, context, role }, run) => {
    await page.request.post(`${MOCK}/__reset`);
    await context.grantPermissions([]);
    if (role !== "none") {
      await context.addCookies([{ name: "tc_refresh", value: role, domain: "localhost", path: "/", httpOnly: true, sameSite: "Lax" }]);
    }
    await run(page);
    const unknown = (await requests(page)).filter((r) => r.unknown).map((r) => `${r.method} ${r.path}`);
    expect(unknown, "portal called endpoints the fake backend doesn't know").toEqual([]);
  },
});

export { expect };
