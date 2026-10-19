# TalentCona Admin Portal

Next.js admin portal. 13 modules under `src/app/(admin)/`, auth pages under
`src/app/(auth)/`. Auth and the API foundation (`src/lib/api.ts`) are done;
module screens still run on mock data in each module's `_components/data.ts`
until they are integrated.

**Integrating a module? Follow `docs/ONBOARDING.md`** — the module pattern
(`_components/api.ts` with types, enum mapping and TanStack Query hooks), the
rules, and the PR checklist.

---

## API

| | |
|---|---|
| Staging base URL | `https://talentcona-backend.onrender.com` |
| Local base URL | `http://localhost:4000` |
| Postman docs | https://documenter.getpostman.com/view/49114848/2sBYHSx1B7 |
| Fern docs | https://talentcona.docs.buildwithfern.com/talent-cona-rest-api/introduction |
| OpenAPI spec | https://talentcona.docs.buildwithfern.com/openapi.json |
| Collection JSON | https://documenter.getpostman.com/api/collections/49114848/2sBYHSx1B7 |

297 paths / 330 operations / 1306 schemas. OpenAPI 3.1.0.

**MCP server for the docs** (configured in `.mcp.json`): query the API docs
directly instead of scraping. Note the OpenAPI spec defines **no**
`securitySchemes` — auth is documented only in the Postman collection, whose
response examples are the source of truth below.

Hosted on Render — expect a cold-start delay of several seconds on the first
request after idle. Rate limit: **100 requests / 60s** (`x-ratelimit-*` headers).

---

## Response envelope

Every response, success or failure, uses the same shape:

```json
{ "success": true,
  "data": { },
  "error": null,
  "meta": { "requestId": "uuid", "timestamp": "ISO-8601" } }
```

```json
{ "success": false,
  "data": null,
  "error": { "code": "Unauthorized", "message": "Invalid credentials" },
  "meta": { "requestId": "uuid", "timestamp": "ISO-8601" } }
```

Unwrap `data` in one place (the API client). Always surface `meta.requestId` in
error logs — the backend can find the exact request with it.

**Known inconsistency:** `/auth/login` returns `error.code: "Unauthorized"`, but
other endpoints return `error.code: "HTTP_401"` for the same condition. Don't
branch on `error.code` for auth until the backend makes it consistent.

Pagination is **not consistent** — check each endpoint's example response:
cursor (`?cursor=&limit=` → `{ items, limit, hasNext, nextCursor }`, e.g.
`/mentorship/admin/reports`) or pages (`?page=&pageSize=` →
`{ items, page, pageSize, total }`, e.g. `/admin-portal/team/members`).

---

## Authentication

### The `x-client-app` header is mandatory

```
x-client-app: admin        # options: consumer, admin
```

Send `consumer` and you get a student session, not an admin one. This portal
always sends `admin`.

### Login

```
POST {baseUrl}/auth/login
Headers: Content-Type: application/json
         Accept: application/json
         x-client-app: admin
Body:    { "email": "...", "password": "...", "rememberMe": false }
```

200 response `data`:

```json
{ "accessToken": "eyJ...",
  "userType": "Admin",
  "clientApp": "admin",
  "admin": { "isSuperAdmin": ... },
  "mfaRequired": true,
  "mfaChallengeToken": "...",
  "mfaChallengePurpose": "..." }
```

Also sets a cookie JS cannot read:

```
set-cookie: refresh_token=eyJ...; Path=/auth/refresh; HttpOnly; Secure; SameSite=None
```

(Observed on staging 2026-10-19. The Postman examples show `SameSite=Lax` without
`Secure` — older backend behaviour.)

### Admin login may or may not complete the session

MFA is **per-admin policy**. Login's `data.admin` carries `mfaEnabled`,
`mfaEnrolledAt`, `mfaRequiredByPolicy` and `mfaEnrollmentPending`.

- **MFA not required** (`mfaRequiredByPolicy: false`): login returns no
  `mfaRequired` / `mfaChallengeToken`, and the token already carries
  `adminMfa: "complete"` — a full session. Verified on staging with the test
  account in `.env.local` (`TC_ADMIN_EMAIL` / `TC_ADMIN_PASSWORD`).
- **MFA required**: the token carries `adminMfa: "pending_mfa_verify"` and only
  permits the MFA step below; admin endpoints reject it. `mfaChallengePurpose`
  is `"verify"` when already enrolled. Not yet verified live — needs an
  MFA-required account.

The app decides on `adminMfa === "complete"` in the token, not on `mfaRequired`.

```
Login (x-client-app: admin)
  └─ 15-min token + mfaChallengeToken
       ├─ Not enrolled:
       │    POST /auth/admin/mfa/enrollment/begin     { mfaChallengeToken }
       │      → { secret, otpauthUrl }   ← render otpauthUrl as a QR code
       │    POST /auth/admin/mfa/enrollment/complete  { code, mfaChallengeToken }
       │      → full token
       └─ Already enrolled:
            POST /auth/admin/mfa/verify               { code }   (Bearer pre-MFA token)
              → full token
```

After MFA the token carries `adminMfa: "complete"` and `mfaStepUpAt`.
`POST /auth/admin/mfa/step-up { code }` re-stamps `mfaStepUpAt` for
re-confirming identity before sensitive actions.

### Refresh and logout

```
POST {baseUrl}/auth/refresh     # sends the HttpOnly cookie; needs credentials: "include"
  → { accessToken, userId, userType, clientApp, admin } + rotated refresh_token cookie

POST {baseUrl}/auth/logout      # REQUIRES Authorization: Bearer — 401 without it
  → clears the cookie (Expires 1970)
```

Refresh returns `admin` (privileges included), so privileges survive a reload.

The portal does not call the backend cross-origin — see the proxy note under
*Integration status*. Third-party-cookie blocking (Safari, incognito) would
break a direct cross-origin refresh cookie even with `SameSite=None`.

**Backend issue (report it):** an old refresh cookie still works after it has
been rotated (reusing it returned 200). Rotation doesn't revoke the previous
token, so a stolen refresh token stays valid for its full 7 days.

### Token lifetimes

| Token | Lifetime |
|---|---|
| Admin pre-MFA | 15 minutes |
| Admin access token (MFA complete) | **15 minutes** observed on staging (`exp - iat = 900`); docs said 24h |
| Refresh cookie | 7 days |

With 15-minute access tokens, refresh-on-401 in `src/lib/api.ts` is what keeps
a session alive — expect a refresh roughly every 15 minutes of use.

### Dev-only login

`/auth/login` with dev credentials is documented as "login admin [only dev]" —
useful for integrating before MFA is set up. Its body is commented out in the
collection; use the test account in `.env.local` instead.

### Access token header — confirmed

Protected requests send **`Authorization: Bearer <accessToken>`**. Verified live:
`GET /mentorship/admin/reports` returned 200 with it.

Source: the Postman collection's collection-level pre-request script (visible
through the Postman connector, not the public documenter page), which adds the
header to every request:

```js
const accessToken = pm.environment.get('ACCESS_TOKEN')
pm.request.addHeader({key: "authorization", value: `Bearer ${accessToken}`})
```

That is why none of the 332 individual requests declare it. Four requests opt
out with `auth: noauth` (public): `programs/schools/active`, program detail,
published programs, and `admin-portal/invitations/accept`.

### Postman workspace

Via the Postman connector: workspace "Akpan Ofonime's Workspace", collection
"TalentCona REST API" (`51405918-9ed55480-2ec1-4143-8958-611551cdb4e4`),
environment "Staging" (`baseUrl`, `ACCESS_TOKEN`, `ADMIN_ACCESS_TOKEN`,
`STUDENT_ACCESS_TOKEN`, `MENTOR_ACCESS_TOKEN`, `CLIENT_APP`,
`CLOUDINARY_UPLOAD_URL`). Token values are empty in the shared environment —
each developer uses their own credentials.

Login, MFA and refresh `data.admin` carry `isSuperAdmin` and `privileges`
(e.g. `MANAGE_USERS`, `MANAGE_PROGRAMS`, `VIEW_REPORTS_INSIGHTS`). The full list
with labels is the Admin Management "Catalog" request in Postman; staging also
returns `MANAGE_LAPTOPS` and `MANAGE_SUPPORT`, which the catalog example lacks.
My Mentees and Sessions have no matching privilege — open to every admin until
the backend says otherwise.

---

## Integration status (Foundation + Auth)

Built — see the files for details:

| Piece | File |
|---|---|
| API client (fetch, envelope unwrap, `ApiError`, refresh-on-401) | `src/lib/api.ts` |
| In-memory session + JWT claims | `src/lib/session.ts` |
| Login / MFA / step-up / logout calls | `src/lib/auth.ts` |
| Same-origin proxy to the backend | `next.config.ts` rewrites (`/auth/*`, `/api/*`; `API_URL` env) |
| Route protection | `src/components/layout/AuthGate.tsx` in `(admin)/layout.tsx` |
| MFA screen (verify + QR enrolment) | `/verify-identity` → `(auth)/_components/MfaForm.tsx` |
| TanStack Query provider | `src/components/providers/QueryProvider.tsx` |
| Privileges: `can`, `useCan`, `<Can>`, `PRIVILEGES` | `src/lib/permissions.ts` |
| Sidebar + page gating by privilege | `privilege` on each item in `src/config/navigation.ts`; `RequirePrivilege` in `(admin)/layout.tsx` |
| Signed-in admin's name / initials | `useCurrentAdmin()` in `src/lib/currentAdmin.ts`; `AdminAvatar`, `WelcomeHeading` in `src/components/layout/CurrentAdmin.tsx` |

**Admin name:** there is no admin "me" endpoint — `/account/profile` is
student-only (403 for admins) and the token carries only `sub` and `email`.
The name comes from `/admin-portal/team/members` (needs `MANAGE_ADMINS` or
super admin); other admins see initials from their email and "Welcome!".
Ask the backend to add `fullName` to the login/refresh response.

Decisions that differ from the original plan:

- **Proxy, not direct calls.** The refresh cookie has no `Domain` and is a
  third-party cookie from the portal's point of view, which Safari and
  incognito Chrome block on cross-site requests to `onrender.com`. All calls go to the portal's own origin; `/auth/*` keeps its
  path because the cookie is `Path=/auth/refresh`.
- **Client-side gate, not `middleware.ts`** (renamed `proxy.ts` in Next 16).
  The server never sees the session: the token is in memory and the refresh
  cookie doesn't reach page paths.
- Validation errors (400) send `error.message` as an **array**; `ApiError`
  joins it into one string.
- **Idle timeout: 15 minutes, no warning** (team decision) —
  `src/components/layout/IdleTimeout.tsx`. Activity in any tab counts for all
  tabs (BroadcastChannel); timeout = full logout, sign-in shows why, and
  `?next=` returns the admin to the same page. `NEXT_PUBLIC_IDLE_TIMEOUT_MINUTES`
  shortens it for local testing only.
- **Cross-tab sign-out:** any logout (by hand or idle) broadcasts to the other
  tabs, which clear their session immediately without another server call
  (`listenForSignOut` in `src/lib/auth.ts`, started by `AuthGate`).
- **Sign-out marker in `sessionStorage`** (`tc:signed-out`, `src/lib/auth.ts`):
  after a logout, that tab never resumes from the refresh cookie on its own
  (Back, reload, sign-in page) — the cookie may still be valid if the logout
  request failed. Status word only, no token or personal data; cleared on login.
  Logout also renews an expired access token once and retries, since
  `/auth/logout` needs a valid one.

Calling the API from a module: `api<T>(path, { query, method, body })` with
paths as in the docs (`/admin/loans`), inside `useQuery` / `useMutation`.
Browser-only — not from Server Components.

## Integration plan (Foundation + Auth) — original

1. `src/lib/api.ts` — the only place `fetch` is called. Attaches base URL,
   `x-client-app: admin` and the access token; unwraps `data`; throws a typed
   error carrying `code`, `message`, `requestId`.
2. **Access token in memory, never `localStorage`** — `localStorage` is readable
   by any script, so an XSS bug would hand over the session. Lost on reload is
   fine: call `/auth/refresh` on app start to get a new one.
3. **Auto-refresh on 401** — refresh once, retry the original request, queue
   concurrent 401s so they trigger one refresh. If refresh fails, clear state
   and redirect to `/sign-in`.
4. **Sign-in flow including MFA** — the verify screen and the QR enrolment
   screen do not exist in the UI yet. `src/app/(auth)/_components/SignInForm.tsx`
   currently just does `router.push("/dashboard")`.
5. **Route protection** — `middleware.ts`; admin routes require a complete,
   MFA-verified session.
6. **TanStack Query** — caching, loading and error states for all 13 modules.

---

## Conventions

- House UI components in `src/components/ui/` (PascalCase: `Button.tsx`,
  `Card.tsx`, `Modal.tsx`, `DataTable.tsx`, `Pill.tsx`, `Toolbar.tsx`).
- shadcn components live in `src/components/shadcn/` (lowercase) — kept in a
  separate folder because `button.tsx` collides with `Button.tsx` on
  case-insensitive filesystems (Windows/macOS).
- `cn()` from `@/lib/cn`. Design tokens in `src/app/globals.css` — use
  `bg-primary`, `text-heading` etc., not hex values.
- Keep each module's `data.ts` after integration — they become test fixtures
  and mock-server data.
- Map API enums to UI enums **in the API layer**, never in components.
- Every list needs loading / error / empty states — use `QueryState` (and
  `LoadingState` / `ErrorState` / `EmptyState`) from `src/components/ui/States.tsx`.
  Don't build per-module versions.

## Git

- `origin` → `github.com/idrisogungbo/talentcona-admin` (team repo).
- Work on a feature branch, PR into `Int-Code`. Never push to `main`.
- The user pushes their own commits — do not push on their behalf.
