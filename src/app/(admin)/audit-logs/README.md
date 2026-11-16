# Audit & System Logs

Super-admin view (`VIEW_AUDIT_LOG`) of everything the backend records. All data is from the API (Postman: **audit**).

## Endpoints

| UI | Endpoint |
| --- | --- |
| Table (100 per request, cursor paging) | `GET /audit/logs?limit=100&cursor=&search=&categories=&range=&from=&to=` |
| Stat cards (last 24 hours) | `GET /audit/logs/summary?range=1d` → `events`, `adminChanges`, `securityEvents` |
| Security banner text | `GET /audit/logs?range=1d&categories=Security&limit=20` |
| Active administrators | `GET /admin-portal/team/members` (needs `MANAGE_ADMINS`) |
| Export audit log | `POST /audit/logs/export?<table filters>` → `{ jobId }` |

## Filters

- **Search** (backend `search`): actor name, email, log id, action, IP, browser, entity type. Sent 350 ms after typing stops.
- **Type** (More filters → backend `categories`, comma-separated): Change, Critical, Security, Approval, Access.
- **Date** (More filters → backend `range`): Last 24 hours (`1d`), Last 7 days (`7d`, the default), Last 30 days (`30d`), Custom (`custom` + `from`/`to`, sent once both dates are set).
- **All users**: Admin, Student, Mentor, Ambassador, System, from each event's `actorUserType` (no actor → System). The list endpoint has no user-type parameter, so this filters the loaded events, loading older pages until a page is full (up to 10 × 100).
- **All modules**: currently derived from `entityType`/`action` and filtered the same way. To be replaced by the backend's module list.

## Rows

- Actor: `actor.fullName` (email on hover), `actorUserType`, avatar from `actor.profileAvatarUrl`.
- Activity: the humanised `action`, with the log `id` underneath.
- Target: the entity type (or a name from metadata).
- Type pill: `primaryCategory`. All `categories` are shown in details when there are several.
- Expanded: Before/After when `metadata` has before/after values. Otherwise a **Details** box with the recorded metadata. Session context: browser · OS from `userAgent`, `ipAddress`, `requestId`.

## Export

The button starts the backend export with the table's filters and shows the job reference. Postman has no endpoint to fetch an audit export job's result yet, so the confirmation also offers **Download CSV now**: the same filtered events (up to 5,000) as a CSV made in the browser.
