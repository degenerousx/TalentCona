# Talent Match

- **Route:** `/talent-match` (every admin)
- **Design:** none yet — built with the portal's existing components, in the style of Talent Corner.
- **Status:** CVs are **live** — every submission of the talent network form (Formcarry) appears
  here within a minute, with its CV file. Mentors, the matching score and confirmed matches are
  still sample data until the backend has endpoints for them.

## What it does

Two tabs.

### Mentor Matching (default)

- **Submitted CVs** and **Available Mentors** side by side. Mentor cards show photo, name, title,
  rating and five labelled lines: Expertise, Experience, Location, Available days and Mentees
  (current of maximum, with a capacity bar).
- **Start Match** suggests up to three mentors for each selected CV — or every unmatched CV when
  none is selected — best first, with a score and reasons. Mentors with no free places are skipped.
- **Confirm Match** approves the mentor picked for a CV (the best one is pre-selected); **Dismiss**
  drops the suggestion. Confirmed pairs appear under **Confirmed Matches**, the CV card says
  "Matched with …", and the mentor's mentee count goes up by one.

### Employer Matching

- One card per student/user who has submitted a CV: profile picture (initials if it's missing
  or fails to load), full name, role, availability, and five labelled lines — **Skills,
  Qualifications** (education and certifications), **Experience** (years, program and cohort),
  **Location** and **CV status** (Verified / In review / Needs update, with the submitted date).
- **Employer Requirements** (role, required skills, minimum experience, location) and
  **Match Candidates**: ranks the cards and adds a match score, a one-line reason and the
  missing skills to each.
- Search, an availability filter and CSV export.

## Live CVs from the talent network form

```
candidate ──▶ talent network form ──▶ Formcarry (TalentMatch form)
                                          ▲
admin ──▶ Talent Match ──▶ /api/talent-match/submissions ──┘  (portal server route)
```

- **The form:** field names and ready HTML are in [`FORM.md`](./FORM.md). The names are defined in
  `_components/formFields.ts`. Formcarry's validation rules for the required fields are set.
- **The route** `src/app/api/talent-match/submissions/route.ts` runs on the portal's server. Next
  serves it before the `/api/*` rewrite, so every other `/api` path still goes to the backend. It:
  1. checks the caller is a signed-in admin — the backend must accept the token (no 401), and the
     token must carry a completed admin MFA (`_server/requireAdmin.ts`);
  2. reads every page of submissions from Formcarry with the server-only `FORMCARRY_API_KEY`, leaves
     out spam, and maps each one to a `Candidate` (`_server/formcarry.ts`).
- **Freshness:** `useCandidates()` refetches every 60 seconds and when the tab regains focus.
- **CV status:** a submission not yet opened in Formcarry shows **New**; a read one shows **In review**.
- **Matching** (Start Match, Confirm Match, Employer Matching) works on these live candidates.

### Setup

1. In Formcarry, create an API key (dashboard → API Keys).
2. Set `FORMCARRY_API_KEY` in `.env.local` locally, and in the hosting settings for staging and
   production. Restart the server. Never prefix it with `NEXT_PUBLIC_`.
3. Send one test submission with a PDF. Check that it appears on the Submitted CVs list and that
   **View CV** opens the file.

Until the key is set, the CV list shows "Talent Match isn't connected to Formcarry yet."

### Not yet confirmed against Formcarry

This session couldn't reach formcarry.com, so the route was tested end to end against a stand-in
Formcarry server, not the real one. Check with the first real submission:

- **The endpoint:** `https://formcarry.com/api/form/{formId}/submissions?api_key=…`, paged with
  `limit` and `cursor`. If Formcarry's path differs, set `FORMCARRY_API_URL`; no code change is needed.
- **The response shape.** `_server/formcarry.ts` accepts the likely forms: a `data` or `submissions`
  list; fields nested under `fields` or `data`, or flat; files under `files`, or on the `cv` field
  itself. Once a real response is seen, tighten it to that shape.
- **CV links:** whether Formcarry's file URLs open without signing in to Formcarry. If they don't,
  the route needs to proxy the download.
- **File uploads on the current plan:** see FORM.md.

## Integrating the API

Everything that talks to the backend is in `_components/api.ts`; components only use its hooks.

| Hook | Replace with |
|---|---|
| `useCandidates()` | **Done**: live from Formcarry through `/api/talent-match/submissions` (above). If CVs move to the TalentCona backend, point it there instead |
| `useMatchCandidates()` | The AI matching endpoint (requirements in, `MatchResult[]` out). It currently uses a simple sample score: skills 70%, experience 20%, location 10% |
| `useMentors()` | Approved mentors with capacity — likely `GET /mentor-application/admin?status=Approved`, using `mentorUser.mentorAvailability` (`maxStudents`, `currentStudentCount`, `slots`), mapped to `Mentor` |
| `useStartMentorMatch()` | The AI mentor-matching endpoint (candidate IDs in, `MentorSuggestion[]` out). Sample score: shared skills 60%, seniority 15%, location 10%, free places 15% |
| `useConfirmMatch()` | The endpoint that approves a match (or `POST /mentorship/admin/programs/assign-mentor`, if a match means assigning a mentor to a program). On success, invalidate the mentors and confirmed-matches queries instead of editing the cache, as the sample does now |
| `useConfirmedMatches()` | The list of confirmed matches; it starts empty for now |

Sample profile pictures are in `public/talent-match/avatars/` — illustrations generated with
DiceBear's "Notionists" style (CC0). Once the API returns real photos, set `photoUrl` from it and
delete that folder.

Also still needed from the backend:

- **CV files in the backend**, if CVs should live there rather than in Formcarry:
  `/media/sign-upload` has no CV purpose yet.
- A privilege, if Talent Match shouldn't be open to every admin — then set `privilege` on its
  item in `src/config/navigation.ts`.
