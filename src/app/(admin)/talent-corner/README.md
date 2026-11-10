# Talent Corner

- **Route:** `/talent-corner` (needs `MANAGE_TALENT_COMPANY_REQUESTS`, or super admin)
- **Design:** [Figma section](https://www.figma.com/design/KOLH84zZQHfrfQjsGhLiZO/Talent-cona-Admin-Portal--Copy-?node-id=293-30628)
- **Status:** Integrated with the API. Hooks and mapping in `_components/api.ts`, UI types in
  `_components/data.ts`. No sample data.

## Endpoints

| Feature | Endpoint |
|---|---|
| Available Talents: stat cards and filter counts | `GET /talent-pool/admin/summary` |
| Available Talents list (`status` all/available/hired, search `q`, cursor paging) | `GET /talent-pool/admin` |
| Talent profile popup | `GET /talent-pool/admin/:interestId` |
| Save Hiring Details | `PATCH /talent-pool/admin/:interestId/hire` `{ hiredBy, hiredAt, hiredRole }` (all required) |
| Mark as Available Again | `PATCH /talent-pool/admin/:interestId/availability` |
| Talent Request: stat cards and filter counts | `GET /talent-requests/admin/summary` |
| Talent Request list (`status` Pending/Fulfilled, `search`, cursor paging) | `GET /talent-requests/admin` |
| Talent Request Details popup | `GET /talent-requests/admin/:id` |
| Mark as Fulfilled | `PATCH /talent-requests/admin/:id/fulfill` (409 if already fulfilled) |

## Notes

- **Export** builds the CSV in the browser from every matching record (all pages), with the
  current filters. The backend's `/export` endpoints stream a file, which the API client can't
  download yet.
- Talent request shapes are from the Postman examples. Role enums are shown as labels
  (`FullTime` → "Full-time", `MidLevel` → "Mid Level"). A request's employment type is its roles'
  types combined.
- The hire form suggests companies and roles from talent requests; any value can be typed.
- Fields with no data are hidden (grade, projects, certifications, links), not shown as blanks.
