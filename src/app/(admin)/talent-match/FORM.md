# Talent Match forms

Talent Match has two public forms. Every submission appears in the admin portal's **Talent Match**
tab within a minute:

| Form | Who fills it | Shows up under |
|---|---|---|
| **Join our talent network** | Job seekers | Available Talents |
| **Hire talent** | Organizations, companies or individuals recruiting | Hiring Requests |

Both forms post to the **same Formcarry form** (TalentMatch, `https://formcarry.com/s/u9y1xR5CtLr`),
because the free plan allows only one. A hidden `formType` field tells them apart, so **keep it in
both forms**. On a paid plan, hiring requests can get a form of their own; then set
`FORMCARRY_HIRING_FORM_ID` on the portal's server.

Put the forms on the main website (for example `talentcona.com/talent-network` and
`talentcona.com/hire-talent`), styled with the site's own CSS. Only the field `name`s matter to
Talent Match; they're defined in `_components/formFields.ts`.

Formcarry itself checks only what both forms share: a valid email, a phone number, a location and
length limits. Everything else is required by the `required` attributes and the script below. Don't
remove them.

## 1. Join our talent network

| Label | `name` | Type | Required |
|---|---|---|---|
| *(hidden)* | `formType` | `hidden`, value `talent` | yes |
| Full name | `fullName` | text | yes |
| Email address | `email` | email | yes |
| Phone number | `phone` | tel | yes |
| Location | `location` | text ("City, Country") | yes |
| Professional title or area of expertise | `professionalTitle` | text | yes |
| Skills | `skills` | text, comma-separated | yes |
| Years of experience | `yearsOfExperience` | select: `0-1`, `1-3`, `4-6`, `7-10`, `11-15`, `16+` | yes |
| Educational qualifications | `education` | textarea, one per line | yes |
| Work experience | `workExperience` | textarea | yes |
| Portfolio or LinkedIn URL | `portfolio` | url | no |
| CV upload | `cv` | file: PDF, max 10 MB | yes |
| Privacy agreement | `consent` | checkbox, `value="yes"` | yes |

```html
<form class="tm-form" action="https://formcarry.com/s/u9y1xR5CtLr" method="POST" enctype="multipart/form-data">
  <input type="hidden" name="formType" value="talent">
  <label>Full name * <input name="fullName" type="text" required maxlength="120" autocomplete="name"></label>
  <label>Email address * <input name="email" type="email" required autocomplete="email"></label>
  <label>Phone number * <input name="phone" type="tel" placeholder="+234..." required maxlength="30" autocomplete="tel"></label>
  <label>Location * <input name="location" type="text" placeholder="City, Country" required maxlength="120"></label>
  <label>Professional title or area of expertise * <input name="professionalTitle" type="text" placeholder="e.g. Data Analyst" required maxlength="120"></label>
  <label>Skills * <input name="skills" type="text" placeholder="e.g. Python, Strategy, Product Design" required maxlength="500"></label>
  <label>Years of experience *
    <select name="yearsOfExperience" required>
      <option value="" disabled selected>Select experience</option>
      <option value="0-1">0–1 years</option><option value="1-3">1–3 years</option><option value="4-6">4–6 years</option>
      <option value="7-10">7–10 years</option><option value="11-15">11–15 years</option><option value="16+">16+ years</option>
    </select>
  </label>
  <label>Educational qualifications * <textarea name="education" rows="3" required maxlength="1000" placeholder="One per line, e.g. B.Sc. Computer Science, University of Lagos"></textarea></label>
  <label>Work experience * <textarea name="workExperience" rows="4" required maxlength="3000" placeholder="Role, company and years, one per line"></textarea></label>
  <label>Portfolio or LinkedIn URL (Optional) <input name="portfolio" type="url" placeholder="https://linkedin.com/in/..."></label>
  <label>Upload CV (PDF) * <input name="cv" type="file" required accept=".pdf,application/pdf"> <small>PDF · Maximum 10MB</small></label>
  <label><input name="consent" type="checkbox" value="yes" required> I agree to TalentCona processing my information for talent matching and recruitment opportunities, in accordance with its privacy policy.</label>
  <button type="submit">Submit my CV →</button>
  <p class="tm-status" role="status"></p>
</form>
```

## 2. Hire talent

| Label | `name` | Type | Required |
|---|---|---|---|
| *(hidden)* | `formType` | `hidden`, value `hiring` | yes |
| Organization name | `organizationName` | text | yes |
| Contact person | `contactName` | text | yes |
| Email address | `email` | email | yes |
| Phone number | `phone` | tel | yes |
| Website | `website` | url | no |
| Job location | `location` | text | yes |
| Role you're hiring for | `roleTitle` | text | yes |
| Required skills | `requiredSkills` | text, comma-separated | yes |
| Nice-to-have skills | `niceToHaveSkills` | text, comma-separated | no |
| Minimum experience | `yearsOfExperience` | select (same values as above) | yes |
| Employment type | `employmentType` | select: `Full-time`, `Part-time`, `Contract`, `Internship` | yes |
| Work mode | `workMode` | select: `On-site`, `Hybrid`, `Remote` | yes |
| Number of positions | `positions` | number, ≥ 1 | yes |
| Hiring deadline | `deadline` | date | no |
| Role description | `description` | textarea | yes |

```html
<form class="tm-form" action="https://formcarry.com/s/u9y1xR5CtLr" method="POST">
  <input type="hidden" name="formType" value="hiring">
  <label>Organization name * <input name="organizationName" type="text" required maxlength="150" autocomplete="organization"></label>
  <label>Contact person * <input name="contactName" type="text" required maxlength="120" autocomplete="name"></label>
  <label>Email address * <input name="email" type="email" required autocomplete="email"></label>
  <label>Phone number * <input name="phone" type="tel" required maxlength="30" autocomplete="tel"></label>
  <label>Website (Optional) <input name="website" type="url" placeholder="https://"></label>
  <label>Job location * <input name="location" type="text" placeholder="City, Country" required maxlength="120"></label>
  <label>Role you're hiring for * <input name="roleTitle" type="text" placeholder="e.g. Data Analyst" required maxlength="120"></label>
  <label>Required skills * <input name="requiredSkills" type="text" placeholder="e.g. Python, SQL, Power BI" required maxlength="500"></label>
  <label>Nice-to-have skills (Optional) <input name="niceToHaveSkills" type="text" placeholder="e.g. Excel, Tableau" maxlength="500"></label>
  <label>Minimum experience *
    <select name="yearsOfExperience" required>
      <option value="" disabled selected>Select experience</option>
      <option value="0-1">0–1 years</option><option value="1-3">1–3 years</option><option value="4-6">4–6 years</option>
      <option value="7-10">7–10 years</option><option value="11-15">11–15 years</option><option value="16+">16+ years</option>
    </select>
  </label>
  <label>Employment type *
    <select name="employmentType" required>
      <option value="" disabled selected>Select type</option>
      <option>Full-time</option><option>Part-time</option><option>Contract</option><option>Internship</option>
    </select>
  </label>
  <label>Work mode *
    <select name="workMode" required>
      <option value="" disabled selected>Select mode</option>
      <option>On-site</option><option>Hybrid</option><option>Remote</option>
    </select>
  </label>
  <label>Number of positions * <input name="positions" type="number" min="1" step="1" value="1" required></label>
  <label>Hiring deadline (Optional) <input name="deadline" type="date"></label>
  <label>Role description * <textarea name="description" rows="5" required maxlength="3000"></textarea></label>
  <button type="submit">Submit hiring request →</button>
  <p class="tm-status" role="status"></p>
</form>
```

## Sending without leaving the page (both forms)

```html
<script>
  document.querySelectorAll(".tm-form").forEach((form) => {
    const status = form.querySelector(".tm-status");
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const cv = form.elements.cv?.files[0];
      if (form.elements.cv && (!cv || !/\.pdf$/i.test(cv.name))) return (status.textContent = "Please choose your CV as a PDF.");
      if (cv && cv.size > 10 * 1024 * 1024) return (status.textContent = "Your CV must be 10 MB or smaller.");
      const button = form.querySelector("button[type=submit]");
      button.disabled = true;
      status.textContent = "Sending…";
      try {
        const res = await fetch(form.action, { method: "POST", body: new FormData(form), headers: { Accept: "application/json" } });
        const body = await res.json().catch(() => ({}));
        if (res.ok && body.code !== 422) {
          form.reset();
          status.textContent = "Thank you! We've received your submission.";
        } else {
          status.textContent = body.message || "Something went wrong. Please check the form and try again.";
        }
      } catch {
        status.textContent = "Couldn't send the form. Check your connection and try again.";
      } finally {
        button.disabled = false;
      }
    });
  });
</script>
```

## Before going live

1. **CV uploads.** The first real test submission arrived without its file, most likely because
   Formcarry's free plan doesn't store uploads. Check the plan. Until it does, **View CV** stays
   disabled on every talent card.
2. **Spam.** Formcarry's spam filter is on, and spam is left out of Talent Match. For stronger
   protection, add a captcha in Formcarry and on both pages.
