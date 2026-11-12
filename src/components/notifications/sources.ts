import { api, ApiError } from "@/lib/api";
import type { Privilege } from "@/lib/permissions";

/**
 * Where notifications come from. The backend has no notifications endpoint,
 * so each source reads an existing admin list that carries real, timestamped
 * activity, and turns the newest records into notifications:
 *
 *   students     GET /students/admin                         new registrations
 *   mentors      GET /mentors/admin?section=pending (+ :id)  submitted mentor applications
 *   invitations  GET /admin-portal/team/invitations/pending  admin invitations awaiting acceptance
 *   payouts      GET /withdrawals/admin?status=Pending       referral payout requests
 *   loans        GET /admin/loans?status=Pending             loan requests
 *   talent       GET /talent-requests/admin?status=Pending   company hiring requests
 *   audit        GET /audit/logs                             approvals, rejections and every other logged action
 *
 * A source only runs for admins holding its privilege; a 403 counts as "no
 * access", not an error.
 */

export type NotificationKind = "student" | "mentor" | "admin" | "payout" | "loan" | "talent" | "activity";

export type AppNotification = {
  /** Stable across polls, so read state sticks. */
  id: string;
  kind: NotificationKind;
  title: string;
  description: string;
  /** ISO time of the event (null when the backend doesn't send one). */
  at: string | null;
  /** Where clicking takes the admin. */
  href: string | null;
};

type Loose = Record<string, unknown>;
type CursorPage<T> = { items: T[]; hasNext?: boolean; nextCursor?: string | null };
type PagePage<T> = { items: T[]; total?: number };

const enc = encodeURIComponent;
const str = (v: unknown) => (typeof v === "string" && v.trim() ? v : null);
const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : null);
const nameOf = (v: unknown) => (v && typeof v === "object" ? str((v as Loose).fullName) ?? str((v as Loose).name) ?? str((v as Loose).email) : null);

function money(amountMinor: unknown, currency: unknown, minorUnit: unknown) {
  const a = num(amountMinor);
  if (a === null) return null;
  const value = a / (num(minorUnit) || 100);
  const cur = str(currency) ?? "NGN";
  try {
    return new Intl.NumberFormat("en-NG", { style: "currency", currency: cur, maximumFractionDigits: 0 }).format(value);
  } catch {
    return `${cur} ${Math.round(value).toLocaleString()}`;
  }
}

/** "MENTOR_APPLICATION_APPROVED" / "mentor.application.approved" → "Mentor application approved". */
export function humanizeAction(action: string) {
  const words = action
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[._:-]+/g, " ")
    .trim()
    .toLowerCase();
  return words ? words[0].toUpperCase() + words.slice(1) : "Activity";
}

/** GET that treats "no access" as an empty source. */
async function get<T>(path: string, query?: Record<string, string | number | undefined>): Promise<T | null> {
  try {
    return await api<T>(path, { query, expectedStatuses: [403] });
  } catch (e) {
    if (e instanceof ApiError && e.status === 403) return null;
    throw e;
  }
}

export type Source = {
  key: string;
  label: string;
  /** Any of these privileges enables the source (super admins have all). */
  privileges: Privilege[];
  fetch: (ctx: { adminId: string | null }) => Promise<AppNotification[]>;
};

const students: Source = {
  key: "students",
  label: "New students",
  privileges: ["MANAGE_USERS"],
  fetch: async () => {
    const page = await get<CursorPage<Loose>>("/students/admin", { limit: 20 });
    return (page?.items ?? []).map((s) => ({
      id: `student:${s.id}`,
      kind: "student" as const,
      title: "New student registered",
      description: `${str(s.fullName) ?? str(s.email) ?? "A student"}${str(s.fullName) && str(s.email) ? ` (${s.email})` : ""} created an account.`,
      at: str(s.joinedAt),
      href: `/user-management/${enc(String(s.id))}`,
    }));
  },
};

const mentorApplications: Source = {
  key: "mentors",
  label: "Mentor applications",
  privileges: ["MANAGE_USERS"],
  fetch: async () => {
    const page = await get<CursorPage<Loose>>("/mentors/admin", { section: "pending", limit: 15 });
    // The list has no submission time; the mentor's record does.
    return Promise.all(
      (page?.items ?? []).map(async (m) => {
        const detail = await get<Loose>(`/mentors/admin/${enc(String(m.id))}`).catch(() => null);
        const app = (detail?.application ?? {}) as Loose;
        const at = str(app.submittedAt);
        return {
          // A resubmission is a new notification.
          id: `mentor-application:${m.id}:${at ?? ""}`,
          kind: "mentor" as const,
          title: "New mentor application",
          description: `${str(m.fullName) ?? str(m.email) ?? "A mentor"} applied to become a mentor and is waiting for review.`,
          at,
          href: `/user-management/mentors/review/${enc(String(m.id))}`,
        };
      }),
    );
  },
};

const invitations: Source = {
  key: "invitations",
  label: "Admin invitations",
  privileges: ["MANAGE_ADMINS"],
  fetch: async () => {
    const page = await get<PagePage<Loose>>("/admin-portal/team/invitations/pending", { page: 1, pageSize: 50 });
    return (page?.items ?? []).map((i) => {
      const expired = i.isExpired === true || i.status === "Expired";
      return {
        id: `invitation:${i.id}:${expired ? "expired" : "pending"}`,
        kind: "admin" as const,
        title: expired ? "Admin invitation expired" : "Admin invitation awaiting acceptance",
        description: `${str(i.fullName) ?? str(i.email) ?? "An admin"}${str(i.fullName) && str(i.email) ? ` (${i.email})` : ""} ${expired ? "didn't accept in time — resend or revoke it." : "has been invited and hasn't accepted yet."}`,
        at: str(i.createdAt) ?? str(i.invitedAt) ?? str(i.updatedAt),
        href: "/admin-management",
      };
    });
  },
};

const payouts: Source = {
  key: "payouts",
  label: "Payout requests",
  privileges: ["MANAGE_REFERRALS"],
  fetch: async () => {
    const page = await get<CursorPage<Loose>>("/withdrawals/admin", { status: "Pending", limit: 20 });
    return (page?.items ?? []).map((w) => {
      const who = nameOf(w.student) ?? nameOf(w.user) ?? str(w.accountName) ?? "An ambassador";
      const amount = money(w.amount, w.currency, w.minorUnit);
      return {
        id: `payout:${w.id}`,
        kind: "payout" as const,
        title: "New payout request",
        description: `${who} requested a referral payout${amount ? ` of ${amount}` : ""}.`,
        at: str(w.createdAt),
        href: "/referrals#payouts",
      };
    });
  },
};

const loans: Source = {
  key: "loans",
  label: "Loan requests",
  privileges: ["MANAGE_ADMISSIONS_ROUTING"],
  fetch: async () => {
    const page = await get<CursorPage<Loose>>("/admin/loans", { status: "Pending", limit: 20 });
    return (page?.items ?? []).map((l) => {
      const amount = money(l.amount, l.currency, l.minorUnit);
      return {
        id: `loan:${l.id}`,
        kind: "loan" as const,
        title: "New loan request",
        description: `${nameOf(l.student) ?? "A student"} requested a loan${amount ? ` of ${amount}` : ""}.`,
        at: str(l.createdAt),
        href: "/admissions-routing#loans",
      };
    });
  },
};

const talentRequests: Source = {
  key: "talent",
  label: "Hiring requests",
  privileges: ["MANAGE_TALENT_COMPANY_REQUESTS"],
  fetch: async () => {
    const page = await get<CursorPage<Loose>>("/talent-requests/admin", { status: "Pending", limit: 20 });
    return (page?.items ?? []).map((r) => ({
      id: `talent-request:${r.id}`,
      kind: "talent" as const,
      title: "New hiring request",
      description: `${str(r.companyName) ?? "A company"} asked for talent${str(r.referenceId) ? ` (${r.referenceId})` : ""}.`,
      at: str(r.createdAt),
      href: "/talent-corner#requests",
    }));
  },
};

/** Best page for an audit entry, from its entity type / action. */
function auditHref(entityType: string, entityId: string | null, action: string) {
  const t = `${entityType} ${action}`.toLowerCase();
  const id = entityId ? enc(entityId) : null;
  if (/mentor/.test(t)) return id && !/report/.test(t) ? `/user-management/mentors/${id}` : "/user-management#mentors";
  if (/student|enrol/.test(t)) return id && /student/.test(entityType.toLowerCase()) ? `/user-management/${id}` : "/user-management";
  if (/withdraw|payout|referral/.test(t)) return "/referrals#payouts";
  if (/loan/.test(t)) return "/admissions-routing#loans";
  if (/invit|admin|team|privilege/.test(t)) return "/admin-management";
  if (/talent|hiring/.test(t)) return "/talent-corner#requests";
  if (/program|module|lesson|rubric/.test(t)) return "/manage-programs";
  if (/communit/.test(t)) return "/communities";
  if (/laptop/.test(t)) return "/laptops";
  if (/session/.test(t)) return "/sessions";
  return null;
}

const audit: Source = {
  key: "audit",
  label: "Activity log",
  privileges: ["VIEW_AUDIT_LOG", "DASHBOARD_VIEW_AUDIT_LOG"],
  fetch: async ({ adminId }) => {
    const page = await get<CursorPage<Loose>>("/audit/logs", { limit: 30 });
    return (page?.items ?? [])
      .filter((e) => !adminId || (str(e.actorUserId) ?? str((e.actor as Loose | undefined)?.id)) !== adminId) // not your own actions
      .map((e, i) => {
        const action = str(e.action) ?? "ACTIVITY";
        const entityType = str(e.entityType) ?? "";
        const entityId = str(e.entityId);
        const actor = nameOf(e.actor) ?? nameOf(e.actorUser) ?? nameOf(e.user);
        const target = nameOf(e.entity) ?? nameOf(e.target) ?? str((e.metadata as Loose | undefined)?.title) ?? str((e.metadata as Loose | undefined)?.name);
        const what = humanizeAction(action);
        return {
          id: `audit:${str(e.id) ?? `${action}:${entityId}:${str(e.createdAt) ?? i}`}`,
          kind: "activity" as const,
          title: what,
          description: [actor ? `By ${actor}` : null, target ? `on ${target}` : entityType ? `on ${humanizeAction(entityType).toLowerCase()}` : null]
            .filter(Boolean)
            .join(" ") || "Recorded in the activity log.",
          at: str(e.createdAt) ?? str(e.timestamp),
          href: auditHref(entityType, entityId, action),
        };
      });
  },
};

export const SOURCES: Source[] = [mentorApplications, students, invitations, payouts, loans, talentRequests, audit];
