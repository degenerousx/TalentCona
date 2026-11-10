# Admin Management

- **Route:** `/admin-management` (needs `MANAGE_ADMINS`, or super admin)
- **Design:** [Figma section "Admin Management"](https://www.figma.com/design/q8WJ8duI2FR5mc7ESAcUhi/Talent-cona-Admin-Portal--Copy-?node-id=293-18341)
- **Status:** Integrated with the API. Types and hooks in `_components/api.ts`, UI types and
  fixtures in `_components/data.ts`.

## Endpoints

| Feature | Endpoint |
|---|---|
| Roles (privilege list for pickers and labels) | `GET /admin-portal/team/catalog` |
| Pending Invitations tab | `GET /admin-portal/team/invitations/pending` |
| Create New Admin (invite) | `POST /admin-portal/team/invitations` |
| Resend / Revoke | `PATCH /admin-portal/team/invitations/:id/resend` · `…/revoke` |
| Active Admins tab | `GET /admin-portal/team/members` |
| Edit Role | `PUT /admin-portal/team/members/:userId` |
| Deactivate / Reactivate | `PATCH /admin-portal/team/members/:userId/deactivate` · `…/reactivate` |
| Program picker | `GET /programs/admin` (read only) |
| Reset MFA | `POST /auth/admin/mfa/step-up` (your own code), then `DELETE /admin-portal/team/members/:userId/mfa` |
| Accept invitation (invitee, no sign-in) | `GET /admin-portal/invitations/preview?token=` · `POST /admin-portal/invitations/accept` — page `/accept-invite` in `(auth)` |

## Notes

- **Roles are privileges.** The backend has no named roles (Communities Moderator,
  Financial Officer…); an admin holds a list of privileges. The Role field is a multi-select
  of the catalog, and the Role column shows each privilege's catalog label.
- Edit can't change name or email — the API has no field for them — so they're read-only.
- Inactive members stay in the Active Admins list with a Reactivate action. Your own row
  has no Deactivate.
- Resend and revoke send no body. The Postman examples show an old `roles` body that the
  other endpoints no longer use; confirm with the backend if either returns 400.

## Privileges

- The privileges picked in Create New Admin are sent as `privileges` and granted **when the
  invitee accepts** at `/accept-invite?token=…`. Edit Role changes them later (`PUT …/members/:id`).
- The signed-in admin's privileges come from the login/refresh response. Each sidebar item and
  every page under it needs its privilege (`src/config/navigation.ts`, enforced by
  `RequirePrivilege`); super admins see everything. A change made by Edit Role applies at that
  admin's next sign-in or token refresh (15 minutes at most).
- Your own row has no actions. Super admins have no Edit Role (they already have everything).

## Not done

- **Invitation link path:** the page is `/accept-invite?token=…`. The backend builds the emailed
  link; confirm it points there (or tell us its path).
- **Pagination:** lists load the first 100 records; the design has no paging controls.
- The shape of a member's or invitation's `programs` items isn't documented (every example
  is empty); `api.ts` accepts `{ id, title }` or `{ program: { id, title } }`. Check it
  against a real advisor.
