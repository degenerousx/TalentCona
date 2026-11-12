# User Management

Students, mentors and partners for admins with the `MANAGE_USERS` privilege.
Every screen reads and writes the backend (Postman: Admin App → User Management);
there is no sample data. All requests live in `_components/api.ts`.

## Routes

| Route | Shows | API |
| --- | --- | --- |
| `/user-management` (Students tab) | Server-filtered, cursor-paged list | `GET /students/admin` |
| `/user-management/:studentId` | Profile, program groups, Assign Mentor / Notify / Suspend / Reactivate | `GET /students/admin/:id`, `POST …/notify\|suspend\|reinstate` |
| `/user-management/:studentId/:enrollmentId` | Overview + activity, Performance, Engagement, Loan, Campaign tabs | `GET …/enrollments/:eid[/performance\|engagement\|campaign]` |
| `#mentors` tab | Summary cards; Pending, Assigned and Unassigned sections with filters | `GET /mentors/admin/summary`, `GET /mentors/admin?section=` |
| `/user-management/mentors/:mentorId` | Profile, programs, Edit Role / Assign Mentor / Notify / Suspend | `GET /mentors/admin/:id`, `PUT …/programs`, `POST …/notify\|suspend\|reinstate` |
| `/user-management/mentors/:mentorId/:programId` | Sessions, feedback, performance, mentees | `GET /mentors/admin/:id/programs/:programId` |
| `/user-management/mentors/review/:mentorId` | Application review: rating, approve, reject, request changes | `PATCH …/rating`, `POST …/approve\|reject\|request-changes` |
| `/user-management/mentors/assign/:mentorId` | Assign an approved mentor to programs | `PUT /mentors/admin/:id/programs` |

## Notes

- **Always current:** User Management queries are stale immediately, refetch when
  the tab regains focus, and lists/counts poll every minute. New applications,
  enrolments and other admins' changes show up without a reload.
- **Summary cards** (Mentors tab) are links into the lists, kept in `?view=`:
  `pending` (Pending Reviews only), `all`, `instructors`, `advisors`. The API
  has no role filter, so the Instructors / Program Advisors lists read every
  assigned mentor and check their per-program roles. Click the active card again
  (or "Show everything") to clear it. The Dashboard's Mentor Applications
  "Review" opens `?view=pending#mentors`.
- **Dashboard:** Total/Active Students, Total/Assigned Mentors, the ratio and
  the Mentor Applications count are live (see `dashboard/_components/LiveDashboard.tsx`);
  the other dashboard figures are still design placeholders (no API).

- Student Assign Mentor works per enrollment: options from `…/assignment-options`,
  current people from `…/assignment`, saved with `PATCH …/assignment { mentorId?, advisorId? }`.
- `PUT /mentors/admin/:id/programs` replaces every program link, so Edit Role and
  Assign merge the change into the mentor's current programs first (`mergePrograms`).
- Status, payment method, laptop, rating and capacity filters take one value each
  in the API, so those lists are single-choice. Expertise is sent as a slug.

## Gaps in the backend (shown honestly in the UI)

- **Partners:** no admin endpoint; only the public partnership/sponsorship forms.
  The tab says so.
- **Students list:** has no instructor/advisor fields, so those columns and
  filters were removed. Instructor and advisor show on each program page.
- **Loan tab:** no per-student loan endpoint. The tab reads every `/admin/loans`
  page, picks the student's loan for this program, then its schedule from
  `/loans/:loanId/repayments`. If that schedule is closed to admins, the tab says so.
- **Mentor assignment history** and **mentor phone/joined date** aren't in the API.
