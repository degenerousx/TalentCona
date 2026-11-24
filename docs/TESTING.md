# Testing the admin portal

Two kinds of automated tests protect the portal. Both run on every pull request (`.github/workflows/tests.yml`).

| | Unit tests | Regression tests |
|---|---|---|
| Tool | Vitest | Playwright |
| Checks | One function or component on its own | The real portal in a real browser, page by page |
| Where | `src/**/*.test.ts(x)`, next to the code | `e2e/*.spec.ts` |
| Backend | None | A fake backend: `e2e/mock/server.mjs` |
| Speed | About 2 seconds | About 1 minute |

## Run them

```bash
npm install                    # once, after pulling
npx playwright install chromium  # once per machine: the browser Playwright drives

npm run test:run               # unit tests, once
npm test                       # unit tests, re-run on every save
npm run test:e2e               # regression tests (starts everything itself)
npm run test:all               # both
```

Handy while working on regression tests:

```bash
npx playwright test e2e/referrals.spec.ts   # one file
npx playwright test -g "reject"             # tests whose name matches
npx playwright test --ui                    # watch it click through, step by step
npx playwright show-report                  # open the last HTML report (screenshots of failures)
```

`npm run test:e2e` starts two servers and stops them afterwards:

1. The fake backend on port 4100.
2. The portal on port 3100 (`next dev`, or `next build` + `next start` in CI) with `API_URL=http://localhost:4100`.

Nothing touches staging or production data. Ports 3100 and 4100 must be free. If you already have them running, the tests reuse them.

## What the regression suite covers

| File | What it proves |
|---|---|
| `auth.spec.ts` | Sign in with password + MFA code. Wrong password or code is refused. Signed-out visitors go to sign-in. Sign out works. |
| `smoke.spec.ts` | Every page wired to the backend opens and shows backend data, with no error state or browser error. |
| `dashboard.spec.ts` | Live counts, Recent Activity from the audit log, and the menu hiding pages an admin has no privilege for. |
| `notifications.spec.ts` | Bell badge, the list, paging, marking read, mark all as read, and each notification opening the right page or record. |
| `audit-logs.spec.ts` | Summary cards, security alert, search, user-type and module filters, before/after details, and the emailed export. |
| `referrals.spec.ts` | Overview, ledger search and CSV export, approve/reject/process withdrawals (and a failed transfer), the queue updating by itself, reward-rate rules, the referrer profile and code reset. |
| `user-management.spec.ts` | Student list and search, assigning an instructor, suspending with a reason, mentor sections, rating then approving a mentor with a program and role, rejecting an application. |
| `admin-management.spec.ts` | Inviting an admin, resending and revoking invitations, deactivating an admin. |
| `admissions.spec.ts` | Onboarding queue and reminder, stage filter, approving and rejecting loans. |
| `talent-corner.spec.ts` | Talent cards and marking a hiring request fulfilled. |

Each test checks two things: what the admin **sees**, and the exact **request** the portal sent (method, path, query and body).

Every test also fails if the portal calls an endpoint the fake backend doesn't know. A renamed or misspelled API path is caught here rather than on staging.

## The fake backend

`e2e/mock/server.mjs` answers like the real API: the same `{ success, data, error, meta }` envelope, the same field names as the Postman examples, and the same paging. It keeps state while a test runs, so approving a withdrawal really moves it out of the queue. Every test starts from the same fresh data.

- Sign in with any email, password `Password123!` and MFA code `123456`.
- Tests usually skip the form. The `page` fixture in `e2e/fixtures.ts` sets the refresh cookie, so the portal resumes a session the way it does after a reload.
- Use `test.use({ role: "limited" })` for an admin with only `MANAGE_USERS` and `VIEW_AUDIT_LOG`, or `role: "none"` for a signed-out visitor.

Helpers for tests (`e2e/fixtures.ts`):

```ts
await sent(page, "PATCH", "/withdrawals/admin/w-pend/approve");   // waits for the request, returns it
expect((await sent(page, "PATCH", "/admin/referrals/settings")).body).toEqual({ rewardPercent: 7.5 });

await mock.failNext(page, "PATCH", "/withdrawals/admin/w-pend/disburse", 502, "Paystack is unavailable");
await mock.notify(page, { title: "New hiring request", data: { url: "/talent-corner" } });
await mock.payout(page);   // a new pending withdrawal
```

**When the backend changes an API**, update the matching route in `server.mjs` to the new Postman shape, then run the suite. Any page that breaks will show up as a failing test.

## Adding a test

1. Open the page in `npx playwright test --ui`, or write the steps by hand.
2. Find elements the way a person would: by role and visible name, e.g. `page.getByRole("button", { name: "Approve loan" })`. Avoid CSS classes, which change with the design.
3. Assert what the admin sees, and the request with `sent(...)`.
4. If the page calls a new endpoint, add it to `server.mjs`. Otherwise the unknown-endpoint check fails the test.

## When a test fails

- Locally: `npx playwright show-report` shows the failing step, a screenshot and the page structure at that moment.
- In CI: download the `playwright-report` artifact from the failed run.
- Decide whether the change was intended. If the portal is wrong, fix the portal. If the behaviour changed on purpose, update the test in the same pull request.
- Never skip or delete a failing test to get a green build.
