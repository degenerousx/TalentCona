# Talent network form → Talent Match

The public "Join our talent network" form posts to Formcarry. Every submission then shows up in
the admin portal's **Talent Match** tab within a minute, with its CV.

- **Formcarry form:** TalentMatch, endpoint `https://formcarry.com/s/u9y1xR5CtLr`
- **Where it goes:** your page on the main website, e.g. `talentcona.com/talent-network`. Use the
  site's own header, footer, fonts and colours. Only the field `name`s below matter to Talent Match.

## Field names (must match exactly)

| Label on the form | `name` | Type | Required |
|---|---|---|---|
| Full name | `fullName` | text | yes |
| Email address | `email` | email | yes |
| Phone number | `phone` | tel | yes |
| Professional title | `professionalTitle` | text | yes |
| Years of experience | `yearsOfExperience` | select: `1-3`, `4-6`, `7-10`, `11-15`, `16+` | yes |
| Location | `location` | text ("City, Country") | yes |
| Key skills | `skills` | text, comma-separated | yes |
| LinkedIn profile | `linkedin` | url | no |
| Upload CV | `cv` | file: PDF, DOC or DOCX, max 10 MB | yes |
| Privacy agreement | `consent` | checkbox, `value="yes"` | yes |

Formcarry already rejects a submission that's missing any required text field, has an invalid
email or exceeds the length limits; those rules are set on the form. Formcarry can't check the file
itself, so the page checks the CV's type and size before sending.

Keep the names in sync with `_components/formFields.ts`. If one changes, change it in both places.

## Ready-to-use HTML

Style it with the website's CSS. Formcarry needs `enctype="multipart/form-data"` for the CV.

```html
<form id="talent-network-form" action="https://formcarry.com/s/u9y1xR5CtLr" method="POST" enctype="multipart/form-data">
  <label>Full name * <input name="fullName" type="text" placeholder="Full name" required maxlength="120" autocomplete="name"></label>
  <label>Email address * <input name="email" type="email" placeholder="Email address" required autocomplete="email"></label>
  <label>Phone number * <input name="phone" type="tel" placeholder="+234..." required maxlength="30" autocomplete="tel"></label>
  <label>Professional title * <input name="professionalTitle" type="text" placeholder="e.g. Data Analyst" required maxlength="120"></label>
  <label>Years of experience *
    <select name="yearsOfExperience" required>
      <option value="" disabled selected>Select experience</option>
      <option value="1-3">1–3 years</option>
      <option value="4-6">4–6 years</option>
      <option value="7-10">7–10 years</option>
      <option value="11-15">11–15 years</option>
      <option value="16+">16+ years</option>
    </select>
  </label>
  <label>Location * <input name="location" type="text" placeholder="City, Country" required maxlength="120"></label>
  <label>Key skills * <input name="skills" type="text" placeholder="e.g. Python, Strategy, Product Design" required maxlength="500"></label>
  <label>LinkedIn profile (Optional) <input name="linkedin" type="url" placeholder="https://linkedin.com/in/..."></label>
  <label>Upload CV *
    <input name="cv" type="file" required accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document">
    <small>PDF, DOC or DOCX · Maximum 10MB</small>
  </label>
  <label>
    <input name="consent" type="checkbox" value="yes" required>
    I agree to TalentCona processing my information for talent matching and recruitment opportunities,
    in accordance with its privacy policy.
  </label>
  <button type="submit">Submit my CV →</button>
  <p id="talent-network-status" role="status"></p>
</form>
```

## Sending it without leaving the page (optional)

Without this script, the form goes to Formcarry's thank-you page. With it, the page stays put and
shows a message instead.

```html
<script>
  const form = document.getElementById("talent-network-form");
  const status = document.getElementById("talent-network-status");
  const MAX_BYTES = 10 * 1024 * 1024;
  const ALLOWED = /\.(pdf|docx?)$/i;

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const cv = form.elements.cv.files[0];
    if (!cv || !ALLOWED.test(cv.name)) return (status.textContent = "Please choose a PDF, DOC or DOCX file.");
    if (cv.size > MAX_BYTES) return (status.textContent = "Your CV must be 10 MB or smaller.");

    const button = form.querySelector("button[type=submit]");
    button.disabled = true;
    status.textContent = "Sending…";
    try {
      const res = await fetch(form.action, { method: "POST", body: new FormData(form), headers: { Accept: "application/json" } });
      const body = await res.json().catch(() => ({}));
      if (res.ok && body.code !== 422) {
        form.reset();
        status.textContent = "Thank you! Your CV has been received.";
      } else {
        status.textContent = body.message || "Something went wrong. Please check the form and try again.";
      }
    } catch {
      status.textContent = "Couldn't send your CV. Check your connection and try again.";
    } finally {
      button.disabled = false;
    }
  });
</script>
```

## Before going live

1. **File uploads.** Formcarry may only accept files on a paid plan. Send one test submission with
   a PDF, then check that the CV appears on its card in Talent Match ("View CV").
2. **Spam.** Formcarry's spam filter is on. Spam submissions are left out of Talent Match. For
   stronger protection, add a captcha in Formcarry and on the page.
