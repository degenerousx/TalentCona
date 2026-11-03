# Talent Match

- **Route:** `/talent-match` (every admin)
- **Design:** none yet — built with the portal's existing components, in the style of Talent Corner.
- **Status:** UI only, on sample data. The backend has no CV or matching endpoints yet.

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

## Integrating the API

Everything that talks to the backend is in `_components/api.ts`; components only use its hooks.

| Hook | Replace with |
|---|---|
| `useCandidates()` | The list of candidates with CVs, mapped to `Candidate` in `data.ts` |
| `useMatchCandidates()` | The AI matching endpoint (requirements in, `MatchResult[]` out). It currently uses a simple sample score: skills 70%, experience 20%, location 10% |
| `useMentors()` | Approved mentors with capacity — likely `GET /mentor-application/admin?status=Approved`, using `mentorUser.mentorAvailability` (`maxStudents`, `currentStudentCount`, `slots`), mapped to `Mentor` |
| `useStartMentorMatch()` | The AI mentor-matching endpoint (candidate IDs in, `MentorSuggestion[]` out). Sample score: shared skills 60%, seniority 15%, location 10%, free places 15% |
| `useConfirmMatch()` | The endpoint that approves a match (or `POST /mentorship/admin/programs/assign-mentor`, if a match means assigning a mentor to a program). On success, invalidate the mentors and confirmed-matches queries instead of editing the cache, as the sample does now |
| `useConfirmedMatches()` | The list of confirmed matches; it starts empty for now |

Sample profile pictures are in `public/talent-match/avatars/` — illustrations generated with
DiceBear's "Notionists" style (CC0). Once the API returns real photos, set `photoUrl` from it and
delete that folder.

Also still needed from the backend:

- **CV files.** `/media/sign-upload` has no CV purpose, and no profile field stores a CV.
  "View CV" stays disabled until there is one.
- A privilege, if Talent Match shouldn't be open to every admin — then set `privilege` on its
  item in `src/config/navigation.ts`.
