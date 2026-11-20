import { api } from "@/lib/api";
import { targetOf, type AppNotification } from "./api";

/**
 * Where a notification opens. Postman documents the notification shape
 * ({ type, title, body, data }) but not the types or what `data` holds, so
 * the target is worked out in this order:
 *
 *   1. `data.url`, when the backend sends one (in-portal path or another site)
 *   2. a record id in `data` (studentId + enrollmentId, mentorId, withdrawalId…)
 *   3. for "<Name> needs a mentor for <Program>": the student and enrollment,
 *      looked up with GET /students/admin?search=<Name>
 *   4. the section the notification is about (from its type, title and body)
 *
 * null = nothing to open (e.g. "Password changed"); the click only marks it read.
 */
export type Target = { href: string; external: boolean };

type Loose = Record<string, unknown>;
const str = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : typeof v === "number" ? String(v) : null);
const pick = (d: Loose, ...keys: string[]) => {
  for (const k of keys) {
    const v = str(d[k]);
    if (v) return v;
  }
  return null;
};
const enc = encodeURIComponent;
const at = (href: string): Target => ({ href, external: false });

/** The student and enrollment for "<name> needs a mentor for <program>". */
async function findEnrollment(name: string, program: string | null): Promise<Target | null> {
  try {
    const page = await api<{ items: { id: string; fullName?: string | null; programs?: { enrollmentId: string; title: string }[] }[] }>("/students/admin", {
      query: { search: name, limit: 20 },
      expectedStatuses: [403],
    });
    const same = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase();
    const matches = page.items.filter((s) => s.fullName && same(s.fullName, name));
    if (matches.length !== 1) return null;
    const student = matches[0];
    const enrollment = program ? student.programs?.find((p) => same(p.title, program)) : undefined;
    return at(`/user-management/${enc(student.id)}${enrollment ? `/${enc(enrollment.enrollmentId)}` : ""}`);
  } catch {
    return null;
  }
}

/** Where clicking this notification goes, or null when it isn't about anything openable. */
export async function resolveTarget(n: AppNotification): Promise<Target | null> {
  const fromUrl = targetOf(n);
  if (fromUrl) return fromUrl;

  const d: Loose = n.data && typeof n.data === "object" ? n.data : {};
  const type = n.type.toUpperCase();
  const text = `${n.type} ${n.title} ${n.body ?? ""}`.toUpperCase().replace(/[_-]+/g, " ");
  const has = (re: RegExp) => re.test(text);

  const studentId = pick(d, "studentId", "studentUserId", "menteeId");
  const enrollmentId = pick(d, "enrollmentId");
  const mentorId = pick(d, "mentorId", "mentorUserId");

  // Security / own-account events have no admin page.
  if (/PASSWORD|MFA|OTP|LOGIN/.test(type) && !has(/AUDIT/)) return null;

  // Audit log (e.g. "Audit export ready").
  if (has(/AUDIT/)) return at("/audit-logs");

  // Student needs a mentor / mentor matching.
  if (has(/NEEDS A MENTOR|MENTOR REQUEST|MENTOR WAITING|MENTOR MATCH|MENTOR ASSIGN|URGENT MENTOR/)) {
    if (studentId) return at(`/user-management/${enc(studentId)}${enrollmentId ? `/${enc(enrollmentId)}` : ""}`);
    const m = /^(.+?)\s+needs a mentor(?:\s+for\s+(.+?))?\.?$/i.exec((n.body ?? "").trim());
    if (m) {
      const found = await findEnrollment(m[1], m[2] ?? null);
      if (found) return found;
    }
    return at("/user-management");
  }

  // Mentor applications.
  if (has(/MENTOR APPLICATION|APPLICATION SUBMITTED|APPLIED TO MENTOR/)) {
    return mentorId ?? pick(d, "applicationId")
      ? at(`/user-management/mentors/review/${enc((mentorId ?? pick(d, "applicationId"))!)}`)
      : at("/user-management?view=pending#mentors");
  }

  // Money.
  if (has(/WITHDRAWAL|PAYOUT/)) return at("/referrals#queue");
  if (has(/REFERRAL|COMMISSION/)) return at("/referrals#ledger");
  if (has(/LOAN/)) return at("/admissions-routing#loans");
  if (has(/FUNDRAIS|CAMPAIGN|CONTRIBUTION/)) return at("/admissions-routing#fundraising");
  if (has(/ONBOARDING|ADMISSION|APPLICANT/)) {
    const applicant = pick(d, "applicantId", "onboardingId");
    return at(applicant ? `/admissions-routing/${enc(applicant)}` : "/admissions-routing");
  }
  if (has(/PAYMENT|WALLET|TRANSACTION|INVOICE|REFUND/)) return at("/financial-ops");

  // Other sections.
  if (has(/TALENT REQUEST|HIRING|HIRE REQUEST/)) return at("/talent-corner#requests");
  if (has(/TALENT/)) return at("/talent-corner");
  if (has(/INVITATION|INVITE/)) return at("/admin-management#pending");
  if (has(/COMMUNIT|CHANNEL|JOIN REQUEST/)) return at("/communities");
  if (has(/LAPTOP|DEVICE/)) {
    const laptop = pick(d, "laptopId");
    return at(laptop ? `/laptops/${enc(laptop)}/edit` : "/laptops");
  }
  if (has(/PROGRAM|MODULE|LESSON|RUBRIC/)) {
    const program = pick(d, "programId");
    return at(program ? `/manage-programs/${enc(program)}` : "/manage-programs");
  }
  if (has(/SESSION/)) return at("/sessions");

  // A person the notification is about.
  if (studentId) return at(`/user-management/${enc(studentId)}${enrollmentId ? `/${enc(enrollmentId)}` : ""}`);
  if (mentorId) return at(`/user-management/mentors/${enc(mentorId)}`);
  if (has(/MENTOR/)) return at("/user-management#mentors");
  if (has(/STUDENT/)) return at("/user-management");
  if (has(/ADMIN/)) return at("/admin-management");
  return null;
}

/**
 * Go to a target. An in-portal link to a tab of the current page
 * (/referrals#queue while on /referrals) sets the hash so the tab switches.
 */
export function goTo(target: Target, router: { push: (href: string) => void }) {
  if (target.external) {
    window.open(target.href, "_blank", "noopener,noreferrer");
    return;
  }
  const url = new URL(target.href, window.location.origin);
  if (url.pathname === window.location.pathname && url.search === window.location.search && url.hash) {
    window.location.hash = url.hash;
    return;
  }
  router.push(url.pathname + url.search + url.hash);
}
