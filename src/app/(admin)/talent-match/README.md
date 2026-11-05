# Talent Match

- **Route:** `/talent-match` (every admin)
- **Design:** the Talent Corner design (cards, toolbar and profile popup) applied to Talent Match.
- **Status:** a two-sided recruitment and matching page. Talents and hiring requests are **live**
  from Formcarry. The matching score is a sample, and confirmed matches are kept in the page until
  the backend has endpoints for them.

## How it works

```
job seeker   ──▶ "Join our talent network" form ──┐
                                                  ├──▶ Formcarry (TalentMatch form, formType field)
organization ──▶ "Hire talent" form ──────────────┘                │
admin ──▶ Talent Match ──▶ /api/talent-match/talents          ◀────┤  (portal server routes)
                       └─▶ /api/talent-match/hiring-requests  ◀────┘
```

- **Available Talents tab:** one card per job seeker, in the Talent Corner card design.
  - Each card shows name, status, title, experience, location, skills and qualifications.
  - **View CV** opens the PDF in a viewer, with Open in New Tab and Download.
  - **View Profile** opens the profile popup. Its sections follow what the person submitted:
    contact, online presence (portfolio/LinkedIn and CV), experience overview, skills,
    qualifications and work experience.
  - The popup ends with **Job Information** for a matched talent. For anyone else it shows the
    **Has been Hired? / Hired By / Hire Date / Role** form, which records the hire.
- **Hiring Requests tab:** one card per request, in the Talent Corner "Talent Request" design.
  - Each card shows organization, contact, a Pending/Fulfilled badge, email, phone, location,
    requested date, deadline, employment type and description, and has a **View Full Details**
    button.
  - **View Full Details** opens the Talent Request Details popup:
    - Request ID (`#TR-0001`, numbered in order of arrival), request date and status.
    - Company information and description.
    - Role requirements: level, employment type, positions, required and nice-to-have skills.
    - **Talent Matches:** every available talent rated for the role, best first, as a match % and
      a 5-star rating, with the reasons and any missing skills.
  - **Mark as Fulfilled** confirms the selected talent. The request shows **Fulfilled**, and the
    talent shows **Matched**.
- **Both tabs:** stat cards, search, status filters and CSV export. Both lists refetch every
  60 seconds and on focus.

## The forms

Field names and ready HTML for both forms are in [`FORM.md`](./FORM.md). The names are defined in
`_components/formFields.ts`.

- **One Formcarry form for both.** Formcarry's free plan allows a single form, so both post to
  TalentMatch. The hidden `formType` field (`talent` or `hiring`) sorts each submission onto the
  right tab. Submissions without it, from the first version of the talent form, count as talents.
- **Validation.** Formcarry's rules check only the shared fields (email, phone, location) plus
  length limits. Rules for one form's required fields would reject the other's submissions. Each
  page's `required` attributes enforce the rest.
- **A separate hiring form,** on a paid plan: set `FORMCARRY_HIRING_FORM_ID`; no code change.

## Server routes

`src/app/api/talent-match/{talents,hiring-requests}/route.ts`, built on `_server/handler.ts`.

- **Where they run:** on the portal's server. Next serves them before the `/api/*` rewrite, so every
  other `/api` path still goes to the backend.
- **Admins only:** the backend must accept the token (no 401), and the token must carry a completed
  admin MFA (`_server/requireAdmin.ts`).
- **What they do:** read the submissions with the server-only `FORMCARRY_API_KEY`, leave out spam,
  and map them (`_server/formcarry.ts`). The shape of a real submission (`fields: [{ key, value }]`,
  `attachments`) is confirmed. The REST endpoint path is the likely one; if Formcarry's differs,
  override it with `FORMCARRY_API_URL`.

### Setup

1. In Formcarry, create an API key (dashboard → API Keys).
2. Set `FORMCARRY_API_KEY` in `.env.local` locally and in the hosting settings, then restart.
   Never prefix it with `NEXT_PUBLIC_`.
3. Send one entry from each form and check that it appears on the right tab.

Until the key is set, both tabs say "Talent Match isn't connected to Formcarry yet."

## Still needed from the backend

| Hook in `_components/api.ts` | Replace with |
|---|---|
| `useMatchTalents()` | An AI matching endpoint. It currently uses a sample score: required skills 60%, experience 25%, location 15% (remote roles match everywhere) |
| `useConfirmMatch()` / `useConfirmedMatches()` | Somewhere to store confirmed matches and hires. Today they reset on reload |

- **CV files:** the first real submission arrived without its file, most likely because the free
  Formcarry plan doesn't store uploads. View CV stays disabled until a file URL comes through.
