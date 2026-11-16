/**
 * Audit & System Logs: turns GET /audit/logs items into what the design shows.
 * Item shape (Postman example): id, actorUserId, actorUserType, action,
 * entityType, entityId, scopeType, scopeId, metadata, ipAddress, userAgent,
 * requestId, createdAt, categories[], primaryCategory, actor { fullName,
 * email, userType, profileAvatarUrl }.
 */

import { MODULE_OF_ACTION } from "./modules";

type Loose = Record<string, unknown>;

export type LogType = "Change" | "Critical" | "Access" | "Security" | "Approval";
export const LOG_TYPES: LogType[] = ["Change", "Critical", "Access", "Security", "Approval"];

/** The backend's user types ("All users" filter). Events with no actor are System. */
export type UserType = "Admin" | "Student" | "Mentor" | "Ambassador" | "System";
export const USER_TYPES: UserType[] = ["Admin", "Student", "Mentor", "Ambassador", "System"];

export { MODULES } from "./modules";

export type AuditEvent = {
  id: string;
  /** The log id, shown under the activity (search matches it). */
  ref: string;
  actorId: string | null;
  actorName: string;
  actorEmail: string | null;
  actorAvatar: string | null;
  actorRole: UserType;
  activity: string;
  action: string;
  module: string;
  target: string;
  at: string | null;
  ip: string | null;
  requestId: string | null;
  type: LogType;
  /** All categories the backend gave it (type is the primary one). */
  categories: LogType[];
  /** Other recorded details (metadata), as label/value pairs. */
  details: { label: string; value: string }[];
  before: string | null;
  after: string | null;
  device: string | null;
};

const str = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : null);
const obj = (v: unknown) => (v && typeof v === "object" && !Array.isArray(v) ? (v as Loose) : null);
const pick = (o: Loose | null, ...keys: string[]) => {
  for (const k of keys) {
    const v = o?.[k];
    if (v !== undefined && v !== null && v !== "") return v;
  }
  return null;
};

/** "MENTOR_APPLICATION_APPROVED" / "mentor.application.approved" / "MentorApplication" → "Mentor application approved". */
export function humanize(s: string) {
  const w = s
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[._:/-]+/g, " ")
    .trim()
    .toLowerCase()
    // Acronyms stay upper case: "Admin MFA verification failed", "Program module MCQs reordered".
    .replace(/\b(mfa|otp|mcq|ip|id)(s?)\b/g, (_, a: string, plural: string) => a.toUpperCase() + plural);
  return w ? w[0].toUpperCase() + w.slice(1) : "";
}

function roleOf(raw: string | null, hasActor: boolean): UserType {
  const r = (raw ?? "").toLowerCase();
  if (!r) return hasActor ? "Admin" : "System";
  if (/system|cron|job|worker|service/.test(r)) return "System";
  if (/ambassador/.test(r)) return "Ambassador";
  if (/mentor|advisor/.test(r)) return "Mentor";
  if (/student|consumer/.test(r)) return "Student";
  return "Admin";
}

const isLogType = (v: unknown): v is LogType => typeof v === "string" && (LOG_TYPES as string[]).includes(v);

/** Module from the backend's action (modules.ts); a guess from the names for actions not in the list. */
export function moduleOf(entityType: string, action: string) {
  const known = MODULE_OF_ACTION.get(action.toUpperCase());
  if (known) return known;
  const t = `${entityType} ${action}`.toLowerCase();
  if (/auth|login|logout|mfa|password|session|otp|token/.test(t)) return "Authentication & Security";
  if (/withdraw|payout|referral|ambassador/.test(t)) return "Referrals";
  if (/payment|loan|wallet|transaction|invoice|refund|repayment|campaign|fund/.test(t)) return "Financial Ops";
  if (/invit|admin|team|privilege|permission/.test(t)) return "Admin Management";
  if (/student|mentor|user|enrol|assignment|application/.test(t)) return "User Management";
  if (/program|module|lesson|rubric|course|mcq|project/.test(t)) return "Manage Programs";
  if (/webhook/.test(t)) return "Payment Webhooks";
  if (/talent|hiring/.test(t)) return "Talent Corner";
  if (/communit|channel/.test(t)) return "Communities";
  if (/laptop|device/.test(t)) return "Laptops";
  if (/admission|onboarding/.test(t)) return "Admissions & Routing";
  return entityType ? humanize(entityType) : "System";
}

/** Change / Critical / Access / Security / Approval, from what the action did. */
export function typeOf(action: string): LogType {
  // Match whole words ("ban", not the "ban" in "BANK_EVIDENCE_UPDATED").
  const a = ` ${humanize(action).toLowerCase()} `;
  if (/\b(fail(ed|ure)?|blocked|block|locked|lock|denied|unauthori[sz]ed|suspicious|brute)\b|invalid (otp|code|token)|mfa (reset|disabled?)|password reset/.test(a))
    return "Security";
  if (/\b(role|roles|privileges?|permissions?|suspend(ed)?|deactivated?|deleted?|removed?|revoked?|banned|ban|rejected|reject)\b/.test(a)) return "Critical";
  if (/\b(approved?|disbursed?|fulfill?ed|fulfil|hired?|accepted|accept|granted|grant|verified|verify|published|publish)\b/.test(a)) return "Approval";
  if (/\b(viewed|view|read|accessed|access|exported|export|downloaded|download|login|logged in|signed in|sign in|opened)\b/.test(a)) return "Access";
  return "Change";
}

/** { status: "Active" } → "Status: Active · Amount: ₦2,200,000". */
function describe(v: unknown): string | null {
  if (v === null || v === undefined || v === "") return null;
  if (typeof v === "string" || typeof v === "number" || typeof v === "boolean") return String(v);
  if (Array.isArray(v)) return v.map(describe).filter(Boolean).join(", ") || null;
  const o = v as Loose;
  const parts = Object.entries(o)
    .filter(([, x]) => x !== null && x !== undefined && typeof x !== "object")
    .slice(0, 4)
    .map(([k, x]) => `${humanize(k)}: ${String(x)}`);
  return parts.join(" · ") || null;
}

/** Before / after from metadata.before/after, metadata.changes {field: {from, to}}, or old/new values. */
function beforeAfter(e: Loose, meta: Loose | null) {
  const before = pick(meta, "before", "previous", "old", "oldValues", "from") ?? pick(e, "before", "oldValues", "previousValues");
  const after = pick(meta, "after", "next", "new", "newValues", "to") ?? pick(e, "after", "newValues");
  if (before !== null || after !== null) return { before: describe(before), after: describe(after) };
  const changes = obj(pick(meta, "changes", "diff")) ?? obj(e.changes);
  if (changes) {
    const b: string[] = [];
    const a: string[] = [];
    for (const [k, c] of Object.entries(changes)) {
      const cc = obj(c);
      if (!cc) continue;
      const from = pick(cc, "from", "old", "before");
      const to = pick(cc, "to", "new", "after");
      if (from !== null) b.push(`${humanize(k)}: ${String(from)}`);
      if (to !== null) a.push(`${humanize(k)}: ${String(to)}`);
    }
    return { before: b.join(" · ") || null, after: a.join(" · ") || null };
  }
  return { before: null, after: null };
}

const BEFORE_AFTER = new Set(["before", "previous", "old", "oldValues", "from", "after", "next", "new", "newValues", "to", "changes", "diff"]);

/** Metadata as label/value pairs: { programId: "x", amountMinor: 2000 } → Program id: x, Amount minor: 2000. */
function detailsOf(meta: Loose | null) {
  if (!meta) return [];
  return Object.entries(meta)
    .filter(([k, v]) => !BEFORE_AFTER.has(k) && v !== null && v !== undefined && v !== "")
    .map(([k, v]) => ({ label: humanize(k), value: typeof v === "object" ? (describe(v) ?? JSON.stringify(v)) : String(v) }));
}

/** "Chrome · Windows" from a user agent string. */
export function deviceOf(ua: string | null) {
  if (!ua) return null;
  const browser = /Edg\//.test(ua)
    ? "Edge"
    : /OPR\/|Opera/.test(ua)
      ? "Opera"
      : /Firefox\//.test(ua)
        ? "Firefox"
        : /Chrome\//.test(ua)
          ? "Chrome"
          : /Safari\//.test(ua)
            ? "Safari"
            : /PostmanRuntime/.test(ua)
              ? "Postman"
              : null;
  const os = /Android/.test(ua)
    ? "Android"
    : /iPhone|iPad|iOS/.test(ua)
      ? "iOS"
      : /Windows/.test(ua)
        ? "Windows"
        : /Mac OS X|Macintosh/.test(ua)
          ? "macOS"
          : /Linux/.test(ua)
            ? "Linux"
            : null;
  return [browser, os].filter(Boolean).join(" · ") || "Unknown device";
}

export function toEvent(raw: unknown, index: number): AuditEvent {
  const e = obj(raw) ?? {};
  const meta = obj(e.metadata) ?? obj(e.meta) ?? obj(e.details) ?? obj(e.data);
  const actor = obj(e.actor) ?? obj(e.actorUser) ?? obj(e.user) ?? obj(e.performedBy);
  const action = str(pick(e, "action", "event", "type")) ?? "ACTIVITY";
  const entityType = str(pick(e, "entityType", "resourceType", "targetType")) ?? "";
  const moduleName = moduleOf(entityType, action);
  const actorId = str(pick(e, "actorUserId", "actorId", "userId")) ?? str(actor?.id);
  const role = roleOf(str(pick(e, "actorUserType", "actorRole", "actorType")) ?? str(pick(actor, "userType", "role", "type")), !!(actorId || actor));
  const categories = Array.isArray(e.categories) ? e.categories.filter(isLogType) : [];
  const primary = isLogType(e.primaryCategory) ? e.primaryCategory : (categories[0] ?? typeOf(action));
  const entity = obj(e.entity) ?? obj(e.target) ?? obj(e.resource);
  const targetName = str(entity?.fullName) ?? str(entity?.name) ?? str(entity?.title) ?? str(entity?.email) ?? str(pick(meta, "targetName", "title", "name", "email"));
  // The person's own type (Student, Ambassador…) reads better than the record type (Payment, Withdrawal…).
  const personType = str(pick(entity, "userType", "role", "type"));
  // As in the design: "Evelyn Tetteh · Student" for people, just the name otherwise ("Personal payout account").
  const targetKind = personType ? humanize(personType) : targetName ? null : entityType ? humanize(entityType) : null;
  const id = str(e.id) ?? `${action}-${index}`;
  const name = str(actor?.fullName) ?? ([str(actor?.firstName), str(actor?.lastName)].filter(Boolean).join(" ") || null);
  const ua = str(pick(e, "userAgent", "ua")) ?? str(pick(meta, "userAgent"));
  const { before, after } = beforeAfter(e, meta);
  return {
    id,
    ref: str(pick(e, "referenceId", "ref", "logId")) ?? id,
    actorId,
    actorName: name ?? str(actor?.name) ?? str(actor?.email) ?? str(e.actorName) ?? (actorId ? "Unknown user" : "System"),
    actorEmail: str(actor?.email),
    actorAvatar: str(actor?.profileAvatarUrl),
    actorRole: role,
    activity: str(pick(e, "label", "description", "summary")) ?? humanize(action),
    action,
    module: moduleName,
    target: targetName && targetKind ? `${targetName} · ${targetKind}` : (targetName ?? targetKind ?? "—"),
    at: str(pick(e, "createdAt", "timestamp", "occurredAt")),
    ip: str(pick(e, "ipAddress", "ip")) ?? str(pick(meta, "ipAddress", "ip")),
    requestId: str(e.requestId),
    type: primary,
    categories: categories.length ? categories : [primary],
    details: detailsOf(meta),
    before,
    after,
    device: deviceOf(ua),
  };
}

/** "Today, 10:42 AM" / "Yesterday, 4:22 PM" / "May 26, 1:45 PM". */
export function when(iso: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  const time = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  const today = new Date();
  const y = new Date(today);
  y.setDate(today.getDate() - 1);
  const same = (a: Date, b: Date) => a.toDateString() === b.toDateString();
  if (same(d, today)) return `Today, ${time}`;
  if (same(d, y)) return `Yesterday, ${time}`;
  return `${d.toLocaleDateString("en-US", { month: "short", day: "numeric", ...(d.getFullYear() !== today.getFullYear() ? { year: "numeric" } : {}) })}, ${time}`;
}

export const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join("") || "?";
