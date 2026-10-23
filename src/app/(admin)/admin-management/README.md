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

## Notes

- **Roles are privileges.** The backend has no named roles (Communities Moderator,
  Financial Officer…); an admin holds a list of privileges. The Role field is a multi-select
  of the catalog, and the Role column shows each privilege's catalog label.
- Edit can't change name or email — the API has no field for them — so they're read-only.
- Inactive members stay in the Active Admins list with a Reactivate action. Your own row
  has no Deactivate.
- Resend and revoke send no body. The Postman examples show an old `roles` body that the
  other endpoints no longer use; confirm with the backend if either returns 400.

## Not done

- **Clear member's MFA** (`DELETE /admin-portal/team/members/:userId/mfa`): needs a recent
  MFA step-up and has no button in the design.
- **Accept invitation** (`POST /admin-portal/invitations/accept`): the invitee's public page
  doesn't exist in the portal yet.
- **Pagination:** lists load the first 100 records; the design has no paging controls.
- The shape of a member's or invitation's `programs` items isn't documented (every example
  is empty); `api.ts` accepts `{ id, title }` or `{ program: { id, title } }`. Check it
  against a real advisor.
