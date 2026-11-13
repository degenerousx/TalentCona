# Audit & System Logs

`/audit-logs`, for admins with `VIEW_AUDIT_LOG` (super admins always), built from
the Figma Make "Audit & System Logs" screens.

## Data

| Part | Source |
| --- | --- |
| Activity table, paging, export | `GET /audit/logs?cursor=&limit=100` (also takes `actorUserId`, `entityType`, `action`) |
| Events today, Admin changes, Security events, banner | the same log, last 24 hours (up to 2,000 events) |
| Active administrators | `GET /admin-portal/team/members` (needs `MANAGE_ADMINS`; otherwise "—") |

Postman documents `/audit/logs` without an example response, so `model.ts` reads
each field from its likely names (actor / actorUser, metadata.before/after or
metadata.changes, ipAddress, userAgent, …) and shows "—" for anything missing.
**Check it against real data** and adjust `toEvent` if a field is named differently.

## Behaviour

- **Type** (Change, Critical, Access, Security, Approval) and **Module** are
  derived from the action and entity type (whole-word matching).
- The API has no search, role or module filter, so those run on loaded events;
  while a filter is on the page keeps loading older events (up to 1,000) until a
  page of 20 is full. Next loads older events from the backend.
- Rows expand (one at a time) to Before / After / Session context (browser and
  OS from the user agent, IP).
- **Review security events** filters to Security + Critical.
- **Export audit log** downloads a CSV of up to 5,000 newest events matching the filters.
- Live: refetched every 30 s and on tab focus.
