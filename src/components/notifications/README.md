# Notifications (header bell)

The bell shows an unread count and a dropdown of the latest 50 events across
the portal. Clicking one marks it read and opens the record or section.

## Where events come from

The backend has **no notifications endpoint** (and no websocket/SSE). Events
are built from admin lists that carry real, timestamped activity
(`sources.ts`), each only for admins holding its privilege:

| Event | Endpoint | Privilege | Opens |
| --- | --- | --- | --- |
| New student registered | `GET /students/admin` | MANAGE_USERS | the student |
| New mentor application | `GET /mentors/admin?section=pending` (+ `/:id` for the time) | MANAGE_USERS | its review page |
| Admin invitation pending / expired | `GET /admin-portal/team/invitations/pending` | MANAGE_ADMINS | Admin Management |
| Referral payout request | `GET /withdrawals/admin?status=Pending` | MANAGE_REFERRALS | Referrals → Payout requests |
| Loan request | `GET /admin/loans?status=Pending` | MANAGE_ADMISSIONS_ROUTING | Admissions → Loans |
| Hiring request | `GET /talent-requests/admin?status=Pending` | MANAGE_TALENT_COMPANY_REQUESTS | Talent Corner → Requests |
| Approvals, rejections, everything else logged | `GET /audit/logs` | VIEW_AUDIT_LOG / DASHBOARD_VIEW_AUDIT_LOG | by entity type |

Your own audit entries are skipped. A 403 means "no access" (silent); other
failures show "Couldn't load: …" in the dropdown while the rest still work.

## "Real time"

Sources are polled every 30 s while the tab is visible and refetched when it
regains focus, so new activity appears within ~30 s without a reload. True
push needs a backend notifications API or socket.

## Read state

Stored per admin in this browser (`localStorage`, key `tc-notifications:<adminId>`)
because the backend can't store it; other tabs stay in sync. On first use,
activity older than 7 days starts as read. Mark all as read marks what is
listed; anything that arrives later is new.

The Dashboard's Recent Activity panel shows the same feed.
