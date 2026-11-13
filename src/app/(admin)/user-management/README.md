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
| `#mentors` tab | Summary cards; Pending, Assigned and Unassigned sections with filters; Applications by Status | `GET /mentors/admin/summary`, `GET /mentors/admin?section=`, `GET /mentors/admin?statuses=` |
| `/user-management/mentors/:mentorId` | Profile, programs, Edit Role / Assign Mentor / Notify / Suspend | `GET /mentors/admin/:id`, `PUT …/programs`, `POST …/notify\|suspend\|reinstate` |
| `/user-management/mentors/:mentorId/:programId` | Sessions, feedback, performance, mentees | `GET /mentors/admin/:id/programs/:programId` |
| `/user-management/mentors/review/:mentorId` | Application review: rating, approve, reject, request changes | `PATCH …/rating`, `POST …/approve\|reject\|request-changes` |
| `/user-management/mentors/assign/:mentorId` | Assign an approved mentor to programs | `PUT /mentors/admin/:id/programs` |

## Approve → assign

On the review page, **Approve** opens **Mentor Details → assign**
(`/user-management/mentors/assign/:id`) without approving anything. While the
application is awaiting review the page shows "Pending approval"; the admin
picks programs and one or both roles (Instructor, Program Advisor), then
**Assign → Confirm Assignment** sends `POST /mentors/admin/:id/approve` and
then `PUT /mentors/admin/:id/programs`, and only then shows "Mentorship
Application Approved Successfully !" and opens the mentor's profile. If the
programs fail to save after the approval succeeded, the error says so and a
retry saves only the programs. "I will do this later" returns to the review
page with the application still pending. For an already-approved mentor the
same page just assigns programs. The page starts from the mentor's current
programs and the PUT sends the full list (it replaces), so unticking removes.
Reject and Request changes return to the mentors list.

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

## Applications by Status (free status filter)

Postman "Mentors List - With Free Status Filter": `GET /mentors/admin?statuses=Draft,ChangesRequested`
(one or more of Draft, Submitted, UnderReview, Approved, Rejected,
ChangesRequested; comma-separated). It is used **instead of** `section`: the
API rejects both together ("Use either section or statuses, not both."), so
`useMentors(section="status", …, statuses)` never sends `section`. The API value `Draft` is shown as **Not Submitted** everywhere (filter, table, review page, Find a user).

The fourth section on the Mentors tab uses it. It starts on Draft + Changes
Requested (the applications no other section shows); its Filters drawer adds an
**Application Status** multi-select (Reset = all statuses) next to expertise,
experience and ratings, and search works with it. Rows show the status pill
and submission date; View opens the review page, which explains drafts and
changes-requested applications instead of offering Approve.

## Find a user

The **Find a user** button (page header) searches Students, the three mentor
sections and `statuses=Draft,ChangesRequested,Rejected` by name or email, and
says where the person is and their status. When nothing matches, the person
most likely hasn't verified their email yet (unverified accounts aren't listed).

## Gaps in the backend (shown honestly in the UI)

- **Unverified mentor sign-ups** (email code not entered) aren't listed by any
  admin endpoint. Drafts, changes-requested and rejected applications are,
  via `statuses`.

- **Partners:** no admin endpoint; only the public partnership/sponsorship forms.
  The tab says so.
- **Students list:** has no instructor/advisor fields, so those columns and
  filters were removed. Instructor and advisor show on each program page.
- **Loan tab:** no per-student loan endpoint. The tab reads every `/admin/loans`
  page, picks the student's loan for this program, then its schedule from
  `/loans/:loanId/repayments`. If that schedule is closed to admins, the tab says so.
- **Mentor assignment history** and **mentor phone/joined date** aren't in the API.
