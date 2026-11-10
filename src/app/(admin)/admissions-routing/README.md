# Admissions & Routing

- **Route:** `/admissions-routing` (needs `MANAGE_ADMISSIONS_ROUTING`, or super admin)
- **Design:** [Figma section](https://www.figma.com/design/KOLH84zZQHfrfQjsGhLiZO/Talent-cona-Admin-Portal--Copy-?node-id=293-18876)
- **Status:** Integrated with the API. Hooks and mapping in `_components/api.ts`, UI types in
  `_components/data.ts`. Shapes come from the Postman examples (Admin App → Admissions & Routing).

## Endpoints

| Feature | Endpoint |
|---|---|
| Tab counts | `GET /admissions/admin/summary` |
| Onboarding Queue (search `q`, `stage` filter, cursor paging) | `GET /admissions/admin/onboarding-queue` |
| Applicant details (`/admissions-routing/:studentId`) | `GET /admissions/admin/onboarding-queue/:studentId` |
| Send Reminder Email (card and details page) | `POST /admissions/admin/onboarding-queue/:studentId/remind` (no body) |
| Fundraising | `GET /admissions/admin/fundraising` |
| Loan Applications (status filter, Pending by default) | `GET /admin/loans` |
| Approve / Reject | `PATCH /admin/loans/:id/approve` · `PATCH /admin/loans/:id/reject` `{ note? }` |

## Notes

- Amounts are minor units: shown as `amount / minorUnit` in the record's currency.
- The loan card shows what the API returns: total to repay (with interest), monthly payment,
  period, what the loan pays for and the student's reason. The design's KYC status, credit score
  and documents have no API, so they're not shown.
- Approve and Reject ask for confirmation first; a rejection can carry a note for the student.
- The backend may refuse a reminder (409, e.g. one was sent recently); its message is shown.
- `GET /admin/loans` has no example response in Postman. `api.ts` reads it as the cursor page the
  other lists use (`{ items, limit, hasNext, nextCursor }`) with each item shaped like the
  approve response (loan fields, `items`, `student`). Check it against a real response.
