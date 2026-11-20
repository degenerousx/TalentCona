# Notifications

Two parts, both on the backend's notifications API (Postman: **notifications**).
No mock or derived data: what the bell shows is exactly what `GET /notifications` returns.

## In-app (header bell)

| What | Endpoint | Where |
| --- | --- | --- |
| Unread badge | `GET /notifications/unread-count` → `{ count }` | `useUnreadCount` (api.ts) |
| List | `GET /notifications?limit=20&cursor=` → `{ items, hasNext, nextCursor }` | `useNotificationList` |
| Mark one read | `PATCH /notifications/:notificationId/read` | `useMarkRead` |
| Mark all read | `POST /notifications/read-all` → `{ updatedCount }` | `useMarkAllRead` |

- **Badge**: polled every 30 s while the tab is visible (TanStack pauses polling in
  hidden tabs) and on focus. When the count changes, the list is re-read.
- **Item**: primary line `title`, secondary `body`, then date/time and "x ago". Unread
  (`readAt: null`) items are bold with a dot. An icon is picked from `type`.
- **Click**: marks it read (if unread), then opens what it's about (`links.ts`, `resolveTarget`):
  1. `data.url` if present (in-app paths with the router, other sites in a new tab);
  2. a record id in `data`: `studentId` (+ `enrollmentId`) → the student / program page,
     `mentorId` / `applicationId` → the mentor application, `applicantId`, `laptopId`, `programId`;
  3. "<Name> needs a mentor for <Program>" → finds the student with
     `GET /students/admin?search=<Name>` (exact name, one match) and opens that program's page,
     where the mentor is assigned;
  4. otherwise the section, from the type, title and body: audit → Audit & System Logs,
     withdrawal/payout → Referrals › Withdrawal Queue, referral/commission → Referral Ledger,
     loan / fundraising / onboarding → Admissions & Routing, payment/wallet → Financial Ops,
     mentor application → Mentors › Pending, mentor request → Students, talent request → Talent
     Corner › Requests, invitation → Admin Management › Pending, community, laptop, program,
     session → their pages.
  Password / MFA / login notices have no page: the item says "Nothing to open for this notification."
  Postman doesn't list notification types or their `data`, so the backend adding `data.url`
  (or record ids) to each notification makes every click exact.
- **Mark read / all**: the list and badge update at once (optimistic), then the count is
  re-read from the server; on failure they roll back and the panel says so.
- **All / Unread** tabs filter what's loaded; "Load older notifications" pages on with `cursor`.
- There's no delete endpoint, so there's no "clear" (the earlier browser-only clear and
  read state were removed).

## Web push (desktop notifications)

| Step | Where |
| --- | --- |
| Service worker | `public/sw.js` (served with `Cache-Control: no-cache`, see next.config.ts) |
| Register on app load | `PushSetup` (mounted once in the admin layout) → `initPush` (lib/push.ts) |
| Ask permission | "Turn on desktop notifications?" card (first visit) and the bell's footer setting. The browser prompt runs from a click, which every browser accepts |
| VAPID key | `GET /notifications/web-push/vapid-public-key` → `{ publicKey }` |
| Subscribe | `pushManager.subscribe({ userVisibleOnly, applicationServerKey })` |
| Save | `POST /notifications/web-push/subscribe` `{ endpoint, keys: { p256dh, auth }, userAgent }` |
| Unsubscribe | Bell footer "Turn off" → `DELETE /notifications/web-push/subscribe` `{ endpoint }`, then the browser subscription is removed |

- Once allowed, each sign-in re-saves the subscription for the admin signed in (a
  subscription made with an old VAPID key is replaced). "Turn off" is remembered per
  admin, so it isn't silently turned back on.
- **Sign-out** deletes the subscription first, so the next person on that browser
  doesn't get the previous admin's pushes.
- **sw.js** shows each push (`title`, `body`, `data.url`; a `{ notification: … }`
  wrapper is accepted too), and tells open portal tabs, which re-read the badge at
  once. Clicking a push focuses an open portal tab, which marks it read and opens it the same
  way as the bell (`data.url`, or the record worked out by `links.ts`); with no tab open it opens
  `data.url`, or `/dashboard?notification=<id>`, which the portal resolves once signed in.
- Not available: private/incognito windows (Chrome has no push there; the footer
  says so) and iOS Safari unless the portal is installed to the home screen. The
  setting is hidden where the Push API doesn't exist.
- The push payload format isn't in Postman; sw.js assumes it matches the list items.
