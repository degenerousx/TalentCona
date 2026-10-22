# Onboarding — read before starting your module

Auth and the API foundation are done. Your job is to replace a module's mock
data with real API calls **without** touching that foundation. Read this whole
page once; the checklist at the end is what reviewers check on your PR.

---

## 1. Setup (15 minutes)

```bash
git clone https://github.com/idrisogungbo/talentcona-admin.git
cd talentcona-admin
git checkout Int-Code && git pull
git checkout -b <your-module>          # e.g. laptops-api, communities-api
npm install
cp .env.example .env.local             # then fill it in
npm run dev                            # http://localhost:3000
```

- **Credentials:** the team lead gives each of you your **own** admin test
  account. Don't share accounts — the backend logs every action per admin.
- **Sign in** at `/sign-in`. Depending on your account's policy you go straight
  to the dashboard, or to `/verify-identity` for an authenticator code (first
  time: scan the QR code with Google Authenticator / Microsoft Authenticator).
- The first request after idle can take **several seconds** — the backend is on
  Render and cold-starts. That's not your bug.

## 2. Git rules

- One branch per module, from `Int-Code`. PR **into `Int-Code`**. Never push to `main`.
- Only edit files inside **your module's folder** (`src/app/(admin)/<module>/`).
  Need a change in `src/lib/`, `src/components/` or another module? Ask the
  team lead first — those are shared by everyone.
- **Never commit `.env.local`**, tokens, passwords or real user data (emails,
  phone numbers) — not in code, comments, fixtures or screenshots.
- Small commits with clear messages. Run the checklist (section 8) before
  opening a PR.

## 3. What's already built — use it, don't rebuild it

| Need | Use | Never |
|---|---|---|
| Call the backend | `api<T>(path, { query, method, body })` from `@/lib/api` | `fetch`, `axios`, or the backend URL directly |
| Loading / caching | `useQuery` / `useMutation` (TanStack Query, already set up) | `useEffect` + `useState` to fetch |
| Who's signed in | `useSession()` from `@/lib/session` (`session.admin.privileges`) | Reading or storing tokens yourself |
| Errors | `ApiError` (`status`, `code`, `message`, `requestId`) | Branching on `error.code` for auth |
| Loading / error / empty UI | `QueryState`, `LoadingState`, `ErrorState`, `EmptyState` from `@/components/ui/States` | Your own spinners, skeletons or error boxes |

Things the foundation handles for you — **don't add code for them**:

- `Authorization: Bearer …` and `x-client-app: admin` on every request.
- Refreshing the 15-minute access token on a 401 and retrying.
- Redirecting to `/sign-in` when the session ends.
- Protecting admin pages (`AuthGate` in `(admin)/layout.tsx`).
- Unwrapping the `{ success, data, error, meta }` envelope — `api()` returns `data`.

**Paths:** write them exactly as the API docs show (`/admin/loans`,
`/communities/admin/{id}`). Don't add `/api` or the base URL — the client does.

**Browser only:** `api()` works in Client Components (`"use client"`), not in
Server Components or `page.tsx` server code — the token lives in browser memory.

## 4. Finding endpoints

- **Postman** (best — has example responses): ask the team lead to invite you
  to the workspace. Collection "TalentCona REST API", environment "Staging".
  See *Postman in Claude Code* below to let Claude read it directly.
- **Fern docs:** https://talentcona.docs.buildwithfern.com/talent-cona-rest-api/introduction
- **OpenAPI spec:** https://talentcona.docs.buildwithfern.com/openapi.json

Admin endpoints usually contain `/admin` (`/programs/admin`, `/communities/admin`,
`/admin/loans`, `/admin-portal/team/members`). Read the **example response** in
Postman before writing types — field names and shapes vary between endpoints.

### Postman in Claude Code

`.mcp.json` registers Postman's official MCP server (`postman`,
`https://mcp.postman.com/mcp`), so Claude Code can read the collection's
requests, example responses and environments itself. Each developer uses their
own key:

1. Postman → avatar → **Settings → API keys → Generate API Key** (after you've
   joined the workspace — the key sees what your account sees).
2. Export it in the shell that starts Claude Code (not `.env.local` — Claude
   Code reads the shell environment, not Next's env files):
   `export POSTMAN_API_KEY=PMAK-...` (add it to `~/.zshrc` / `~/.bashrc`).
3. Start Claude Code in the repo, approve the project's MCP servers, and check
   `/mcp` shows `postman` connected.

Never commit the key. If your team's data is in Postman's EU region, change the
URL to `https://mcp.eu.postman.com/mcp` locally.

On claude.ai (web / cloud sessions) use the **Postman** connector instead
(Settings → Connectors). A cloud environment also needs `mcp.postman.com`
allowed under Network access.

**Pagination is not consistent** — check each endpoint:

- Cursor: `?cursor=&limit=` → `{ items, limit, hasNext, nextCursor }`
  (e.g. `/mentorship/admin/reports`)
- Pages: `?page=&pageSize=` → `{ items, page, pageSize, total }`
  (e.g. `/admin-portal/team/members`)

## 5. How to integrate a module (the pattern)

Add **one file** to your module: `_components/api.ts`. It holds everything
about talking to the backend, so components stay unaware of API shapes.

```ts
// src/app/(admin)/<module>/_components/api.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { TeamMember, MemberStatus } from "./data"; // UI types stay in data.ts

// 1. What the backend sends — copied from the Postman example response.
type ApiMember = {
  id: string;
  fullName: string;
  email: string;
  status: "Active" | "Deactivated" | "Invited";
  lastLoginAt: string | null;
  privileges: string[];
};
type ApiPage<T> = { items: T[]; page: number; pageSize: number; total: number };

// 2. Map API enums/shapes to UI ones HERE — never inside components.
const STATUS: Record<ApiMember["status"], MemberStatus> = {
  Active: "Active",
  Deactivated: "Inactive",
  Invited: "Pending",
};
function toMember(m: ApiMember): TeamMember {
  return {
    id: m.id,
    name: m.fullName,
    email: m.email,
    status: STATUS[m.status] ?? "Inactive",
    lastLogin: m.lastLoginAt ? new Date(m.lastLoginAt) : null,
  };
}

// 3. Query keys: [module, resource, params]. Used for caching and invalidation.
const keys = {
  members: (page: number) => ["admin-management", "members", { page }] as const,
};

// 4. Hooks — the only thing your components import from this file.
export function useTeamMembers(page = 1) {
  return useQuery({
    queryKey: keys.members(page),
    queryFn: async () => {
      const res = await api<ApiPage<ApiMember>>("/admin-portal/team/members", {
        query: { page, pageSize: 20 },
      });
      return { ...res, items: res.items.map(toMember) };
    },
  });
}

export function useDeactivateMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) =>
      api(`/admin-portal/team/members/${userId}/deactivate`, { method: "PATCH" }),
    // Refetch the list so the change shows up.
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-management", "members"] }),
  });
}
```

> The types above are illustrative — copy the real ones from the Postman example
> for your endpoint.

In the component, wrap the result in **`<QueryState>`** from
`@/components/ui/States` — it shows a skeleton while loading, an error card
with **Try again** on failure, your empty state when there's nothing, and your
content otherwise:

```tsx
import { Search } from "lucide-react";
import { EmptyState, QueryState } from "@/components/ui/States";

const members = useTeamMembers(page);

<QueryState
  query={members}
  isEmpty={(d) => d.items.length === 0}
  errorTitle="Couldn't load admins"
  empty={
    search
      ? <EmptyState icon={Search} title="No results" description="Try changing your search or filters." />
      : <EmptyState title="No admins yet" description="Invite an admin to get started." action={<Button size="md">Invite Admin</Button>} />
  }
>
  {(data) => <DataTable caption="Admins" columns={columns} rows={data.items} rowKey={(m) => m.id} />}
</QueryState>
```

**Don't build your own loading/error/empty UI.** `States.tsx` has everything:

| Component | Use it for |
|---|---|
| `QueryState` | Any `useQuery` result — use this first |
| `LoadingState` | `rows={n}` skeleton card (lists/tables); `variant="block"` brand spinner in a card (detail pages, charts, forms); `variant="inline"` small spinner + text |
| `Spinner` (`@/components/ui/Spinner`) | The brand spinner on its own, `size="sm" \| "md" \| "lg"` — e.g. inside a button. Never use a plain border spinner |
| `ErrorState` | Errors outside a query (e.g. a mutation). Pass `error`, optional `onRetry` / `retrying` / `title` |
| `EmptyState` | `title`, `description`, `icon` (lucide; default Inbox, `Search` for filtered lists), `action` |

`ErrorState` picks the wording from the error for you: no connection, **403**
("You don't have access", no retry), **404** ("Not found"), **429**, **5xx**,
otherwise the backend's message. It shows the `requestId` as "Reference: …" so
admins can quote it in bug reports.

> A query with `enabled: false` stays "loading" forever — render something else
> until it's enabled.

Rules that go with the pattern:

- **Keep `data.ts`.** Its types become your UI types and its mock data stays as
  test fixtures. Remove the "no API yet" comments, not the file.
- **Every list has three states:** loading, error (with retry), empty — via
  `QueryState`. A blank table while loading is a bug.
- **Mutations:** disable the button while `isPending`, show `error.message` on
  failure, invalidate the affected queries on success.
- **Show the backend's message** (`error.message`) to the user — it's written
  for users (e.g. "New password must be different from your current password").
  Validation errors (400) can list several problems; `api()` already joins them.
- **Don't retry or refresh manually** — the foundation does it.

## 6. Privileges

Each admin has a list of privileges (e.g. `MANAGE_PROGRAMS`, `MANAGE_LAPTOPS`,
`VIEW_REPORTS_INSIGHTS`); `isSuperAdmin` admins can do everything. All of it
lives in `@/lib/permissions`.

**Already done for you — don't add your own:**

- **Sidebar:** items are hidden when the admin lacks the item's `privilege`
  (set in `src/config/navigation.ts`).
- **Pages:** every page under your module's URL — including sub-pages like
  `/laptops/new` and typed-in URLs — shows "You don't have access" instead of
  your page. Your components never even render, so no API calls are made.

**Your job — actions inside the module.** If one module mixes actions with
different privileges, or shows something extra only for some admins, use:

```tsx
import { Can, useCan } from "@/lib/permissions";

// Hide it
<Can privilege="MANAGE_FINANCIAL_OPERATIONS">
  <Button onClick={approve}>Approve</Button>
</Can>

// Or disable it
const canApprove = useCan("MANAGE_FINANCIAL_OPERATIONS");
<Button disabled={!canApprove} title={canApprove ? undefined : "You don't have permission"}>Approve</Button>
```

Privilege names are type-checked — a typo is a compile error. The full list is
`PRIVILEGES` in `src/lib/permissions.ts` (mirrors the backend's catalog).

**Frontend checks are UX only.** The backend must answer **403** to an admin
without the privilege — `QueryState`/`ErrorState` already show that as "You
don't have access" without logging the admin out. When you test, check in the
Network tab that a forbidden call really returns 403, and tell the team lead if
it doesn't.

> **Dashboard owner:** "Recent Activity" needs `DASHBOARD_VIEW_AUDIT_LOG` and
> "Pending Reviews" needs `DASHBOARD_VIEW_PENDING_APPROVALS` — wrap them in
> `<Can>` when you integrate them, and keep the grid tidy when they're hidden.

## 7. When something fails

- Open the browser console — failed calls are logged as
  `[api] METHOD /path → status code: message { requestId }`.
- Reporting to the backend team? **Always include the `requestId`** — they can
  find the exact request with it.
- `429` = rate limit (100 requests / 60s per client). Usually a fetch loop —
  check your `queryKey` isn't changing on every render.
- In development, Next shows `console.error` as a red overlay with a code frame
  pointing into `src/lib/api.ts`. The real message is the `[api] …` line
  above it — the bug is in your request, not in `api.ts`.

## 8. Before you open a PR — checklist

- [ ] `npx tsc --noEmit` passes
- [ ] `npm run lint` passes
- [ ] `npm run build` passes
- [ ] No `fetch(` anywhere in your module (`api()` only)
- [ ] API types + enum mapping live in `_components/api.ts`, not in components
- [ ] Every list/detail uses `QueryState` (or the `States.tsx` components) — no home-made spinners or error boxes
- [ ] Mutations disable their button while pending and show errors
- [ ] Tested signed in, after a page reload, and with the network throttled
- [ ] No secrets, tokens or real personal data in the diff
- [ ] Actions needing a privilege are wrapped in `<Can>` / `useCan` — and you checked the API returns 403 without it
- [ ] Only files in your module's folder changed (or the lead agreed)
- [ ] Module `README.md` updated: which endpoints it uses, anything unfinished
- [ ] PR targets `Int-Code`, description lists endpoints used and screenshots

## 9. Using Claude Code

`CLAUDE.md` is loaded automatically and points here. Start your session with:

> Read docs/ONBOARDING.md and the README in src/app/(admin)/<module>/. Then
> integrate <module> with the API following the pattern in section 5.

Check what it writes against the checklist — you own the PR, not the tool.
This repo uses **Next.js 16**, which differs from older tutorials (e.g.
`middleware.ts` is now `proxy.ts`); when in doubt, the docs are in
`node_modules/next/dist/docs/`.
