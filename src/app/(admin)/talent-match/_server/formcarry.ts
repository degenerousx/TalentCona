/**
 * Server-only: reads Talent Match's Formcarry submissions and maps them to
 * talents and hiring requests. Imported by the route handlers in
 * src/app/api/talent-match — never from a client component, since it uses the
 * Formcarry API key.
 *
 * Configuration (server environment, e.g. .env.local or the hosting settings):
 *   FORMCARRY_API_KEY          required — Formcarry dashboard → API Keys
 *   FORMCARRY_FORM_ID          optional — the TalentMatch form by default
 *   FORMCARRY_HIRING_FORM_ID   optional — a separate form for hiring requests.
 *                              Unset: both forms share FORMCARRY_FORM_ID and
 *                              are told apart by their `formType` field.
 *   FORMCARRY_API_URL          optional — submissions endpoint, "{formId}" is filled in
 *
 * Shape confirmed from a real submission (via the Formcarry connector):
 *   { data: [{ id, created_at, spam, read, fields: [{ key, value }], attachments: [] }],
 *     has_more, next_cursor }
 * Other likely shapes are still accepted in case the REST API differs.
 */
import type { HiringRequest, Talent } from "../_components/data";
import { initialsOf } from "../_components/data";
import { EXPERIENCE_OPTIONS, FORM_TYPE_FIELD, FORM_TYPES, HIRING_FIELDS, TALENT_FIELDS } from "../_components/formFields";

const DEFAULT_FORM_ID = "u9y1xR5CtLr";
const DEFAULT_API_URL = "https://formcarry.com/api/form/{formId}/submissions";
const PAGE_SIZE = 100;
/** Stop after this many submissions; the page has no pagination yet. */
const MAX_SUBMISSIONS = 1000;

export class FormcarryError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message);
  }
}

function formcarryConfig() {
  const apiKey = process.env.FORMCARRY_API_KEY?.trim();
  if (!apiKey) {
    // 424, not 5xx: the error card shows a 4xx's own message, and this one says how to fix it.
    throw new FormcarryError(
      424,
      "FORMCARRY_NOT_CONFIGURED",
      "Talent Match isn't connected to Formcarry yet. Set FORMCARRY_API_KEY on the server, then reload.",
    );
  }
  const talentFormId = process.env.FORMCARRY_FORM_ID?.trim() || DEFAULT_FORM_ID;
  const hiringFormId = process.env.FORMCARRY_HIRING_FORM_ID?.trim() || null;
  const urlFor = (formId: string) =>
    (process.env.FORMCARRY_API_URL?.trim() || DEFAULT_API_URL).replace("{formId}", encodeURIComponent(formId));
  return { apiKey, talentFormId, hiringFormId, urlFor };
}

// ---- Reading the response ----------------------------------------------------

type Json = Record<string, unknown>;

const isObject = (v: unknown): v is Json => typeof v === "object" && v !== null && !Array.isArray(v);

/** The list of submissions, wherever the response puts it. */
function listOf(body: unknown): Json[] {
  if (Array.isArray(body)) return body.filter(isObject);
  if (!isObject(body)) return [];
  for (const key of ["data", "submissions", "items", "results"]) {
    const value = body[key];
    if (Array.isArray(value)) return value.filter(isObject);
    if (isObject(value)) {
      const nested = listOf(value);
      if (nested.length) return nested;
    }
  }
  return [];
}

function nextCursorOf(body: unknown): string | null {
  if (!isObject(body)) return null;
  const cursor = body.next_cursor ?? body.nextCursor ?? (isObject(body.pagination) ? body.pagination.next_cursor : undefined);
  const more = body.has_more ?? body.hasMore ?? (isObject(body.pagination) ? body.pagination.has_more : undefined);
  return typeof cursor === "string" && cursor && more !== false ? cursor : null;
}

/** `[{ key, value }]` (Formcarry's form) or `[{ name, value }]` → `{ key: value }`. */
function pairsToObject(list: unknown[]): Json {
  const out: Json = {};
  for (const item of list) {
    if (!isObject(item)) continue;
    const key = [item.key, item.name, item.field].find((v): v is string => typeof v === "string" && v.length > 0);
    if (key) out[key] = item.value;
  }
  return out;
}

/** The submitted fields: a key/value list or object under fields/data/body, or on the submission itself. */
function fieldsOf(sub: Json): Json {
  for (const key of ["fields", "data", "body", "submission", "values"]) {
    const value = sub[key];
    if (Array.isArray(value)) return { ...sub, ...pairsToObject(value) };
    if (isObject(value)) return { ...sub, ...value };
  }
  return sub;
}

const normaliseKey = (key: string) => key.toLowerCase().replace(/[^a-z0-9]/g, "");

/** A field's text by any of its likely names (fullName, full_name, "Full name"…). */
function text(fields: Json, ...names: string[]): string {
  const wanted = new Set(names.map(normaliseKey));
  for (const [key, value] of Object.entries(fields)) {
    if (!wanted.has(normaliseKey(key))) continue;
    if (typeof value === "string") return value.trim();
    if (typeof value === "number") return String(value);
    if (Array.isArray(value)) return value.filter((v) => typeof v === "string").join(", ").trim();
  }
  return "";
}

const listFrom = (raw: string, separators: RegExp) =>
  raw
    .split(separators)
    .map((s) => s.trim())
    .filter(Boolean);

type FileRef = { url: string; name: string };

function fileFrom(value: unknown): FileRef | null {
  if (typeof value === "string" && /^https?:\/\//.test(value)) {
    return { url: value, name: decodeURIComponent(value.split("?")[0].split("/").pop() || "CV") };
  }
  if (Array.isArray(value)) {
    for (const item of value) {
      const file = fileFrom(item);
      if (file) return file;
    }
    return null;
  }
  if (!isObject(value)) return null;
  const url = [value.url, value.link, value.location, value.download_url, value.downloadUrl, value.signed_url].find(
    (v): v is string => typeof v === "string" && /^https?:\/\//.test(v),
  );
  if (!url) return null;
  const name = [value.name, value.filename, value.file_name, value.original_name, value.originalName].find(
    (v): v is string => typeof v === "string" && v.length > 0,
  );
  return { url, name: name ?? fileFrom(url)?.name ?? "CV" };
}

/** The CV: the "cv" field, else the submission's file list. */
function cvOf(sub: Json, fields: Json): FileRef | null {
  const named = Object.entries(fields).find(([key]) => normaliseKey(key) === normaliseKey(TALENT_FIELDS.cv));
  const fromField = named ? fileFrom(named[1]) : null;
  if (fromField) return fromField;
  for (const key of ["files", "attachments", "uploads"]) {
    const list = sub[key];
    if (Array.isArray(list)) {
      const cv = list.find((f) => isObject(f) && typeof (f.field ?? f.key) === "string" && normaliseKey(String(f.field ?? f.key)) === normaliseKey(TALENT_FIELDS.cv));
      const file = fileFrom(cv ?? list);
      if (file) return file;
    }
  }
  return null;
}

function experienceOf(raw: string) {
  const option = EXPERIENCE_OPTIONS.find((o) => o.value === raw || normaliseKey(o.label) === normaliseKey(raw));
  const years = Number(raw.match(/\d+/)?.[0] ?? 0);
  return { years, label: option?.label ?? (raw || undefined) };
}

function linkOf(raw: string) {
  if (!raw) return undefined;
  const url = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" || parsed.protocol === "http:" ? parsed.toString() : undefined;
  } catch {
    return undefined;
  }
}

const idOf = (sub: Json) => [sub.id, sub._id, sub.submission_id].find((v): v is string => typeof v === "string");
const createdAtOf = (sub: Json) =>
  [sub.created_at, sub.createdAt, sub.date].find((v): v is string => typeof v === "string") ?? new Date().toISOString();
const isSpam = (sub: Json) => sub.spam === true || sub.is_spam === true;
const isRead = (sub: Json) => sub.read === true || sub.is_read === true;

/** Which form a submission came from. Old talent submissions have no formType. */
function formTypeOf(fields: Json) {
  return text(fields, FORM_TYPE_FIELD, "form_type") === FORM_TYPES.hiring ? FORM_TYPES.hiring : FORM_TYPES.talent;
}

/** One submission → one talent, or null when it isn't one. */
export function toTalent(sub: Json): Talent | null {
  const fields = fieldsOf(sub);
  const id = idOf(sub);
  const name = text(fields, TALENT_FIELDS.fullName, "full_name", "name");
  const email = text(fields, TALENT_FIELDS.email, "email_address");
  if (!id || isSpam(sub) || formTypeOf(fields) !== FORM_TYPES.talent || (!name && !email)) return null;

  const experience = experienceOf(text(fields, TALENT_FIELDS.yearsOfExperience, "experience"));
  const cv = cvOf(sub, fields);
  const displayName = name || email;
  return {
    id,
    name: displayName,
    initials: initialsOf(displayName),
    email,
    phone: text(fields, TALENT_FIELDS.phone, "phone_number") || undefined,
    location: text(fields, TALENT_FIELDS.location, "city") || "—",
    title: text(fields, TALENT_FIELDS.professionalTitle, "professional_title", "title") || "—",
    skills: listFrom(text(fields, TALENT_FIELDS.skills, "key_skills"), /[,;\n]/),
    yearsExperience: experience.years,
    experienceLabel: experience.label,
    education: listFrom(text(fields, TALENT_FIELDS.education, "qualifications"), /\n|;/),
    workExperience: text(fields, TALENT_FIELDS.workExperience, "work_experience") || undefined,
    // "linkedin" was the field's name on the first version of the form.
    portfolioUrl: linkOf(text(fields, TALENT_FIELDS.portfolio, "linkedin", "portfolioUrl")),
    cvUrl: cv?.url,
    cvFileName: cv?.name,
    submittedAt: createdAtOf(sub),
    status: isRead(sub) ? "in-review" : "new",
  };
}

/** One submission → one hiring request, or null when it isn't one. */
export function toHiringRequest(sub: Json, sharedForm: boolean): HiringRequest | null {
  const fields = fieldsOf(sub);
  const id = idOf(sub);
  if (!id || isSpam(sub)) return null;
  // On a shared form only formType=hiring is a request; a form of its own holds nothing else.
  if (sharedForm && formTypeOf(fields) !== FORM_TYPES.hiring) return null;
  const organization = text(fields, HIRING_FIELDS.organizationName, "organization", "company");
  const role = text(fields, HIRING_FIELDS.roleTitle, "role");
  if (!organization && !role) return null;

  const experience = experienceOf(text(fields, HIRING_FIELDS.yearsOfExperience, "experience"));
  const positions = Number.parseInt(text(fields, HIRING_FIELDS.positions), 10);
  const deadline = text(fields, HIRING_FIELDS.deadline);
  return {
    id,
    code: "", // numbered in fetchHiringRequests, once all are known
    organization: organization || "—",
    contactName: text(fields, HIRING_FIELDS.contactName, "contact") || "—",
    email: text(fields, HIRING_FIELDS.email),
    phone: text(fields, HIRING_FIELDS.phone) || undefined,
    website: linkOf(text(fields, HIRING_FIELDS.website)),
    location: text(fields, HIRING_FIELDS.location) || "—",
    role: role || "—",
    requiredSkills: listFrom(text(fields, HIRING_FIELDS.requiredSkills, "skills"), /[,;\n]/),
    niceToHaveSkills: listFrom(text(fields, HIRING_FIELDS.niceToHaveSkills, "nice_to_have_skills"), /[,;\n]/),
    minYearsExperience: experience.years,
    experienceLabel: experience.label,
    employmentType: text(fields, HIRING_FIELDS.employmentType) || "—",
    workMode: text(fields, HIRING_FIELDS.workMode) || "—",
    positions: Number.isFinite(positions) && positions > 0 ? positions : 1,
    deadline: /^\d{4}-\d{2}-\d{2}/.test(deadline) ? deadline : undefined,
    description: text(fields, HIRING_FIELDS.description) || "",
    submittedAt: createdAtOf(sub),
    status: "pending",
  };
}

// ---- Fetching ------------------------------------------------------------------

/** Every submission of one form, newest first in Formcarry's order. */
async function fetchSubmissions(formId: string): Promise<Json[]> {
  const { apiKey, urlFor } = formcarryConfig();
  const all: Json[] = [];
  let cursor: string | null = null;

  do {
    const pageUrl = new URL(urlFor(formId));
    pageUrl.searchParams.set("api_key", apiKey);
    pageUrl.searchParams.set("limit", String(PAGE_SIZE));
    if (cursor) pageUrl.searchParams.set("cursor", cursor);

    let res: Response;
    try {
      res = await fetch(pageUrl, {
        headers: { Accept: "application/json", Authorization: `Bearer ${apiKey}` },
        cache: "no-store",
      });
    } catch {
      throw new FormcarryError(502, "FORMCARRY_UNREACHABLE", "Couldn't reach Formcarry. Try again in a moment.");
    }
    const body: unknown = await res.json().catch(() => null);
    if (!res.ok) {
      const keyRejected = res.status === 401 || res.status === 403;
      const message = isObject(body) && typeof body.message === "string" ? body.message : `Formcarry answered ${res.status}.`;
      throw new FormcarryError(
        keyRejected ? 424 : 502,
        keyRejected ? "FORMCARRY_KEY_REJECTED" : "FORMCARRY_ERROR",
        keyRejected ? "Formcarry rejected the API key. Check FORMCARRY_API_KEY." : message,
      );
    }

    const page = listOf(body);
    all.push(...page);
    cursor = page.length ? nextCursorOf(body) : null;
  } while (cursor && all.length < MAX_SUBMISSIONS);

  return all;
}

const newestFirst = <T extends { submittedAt: string }>(list: T[]) =>
  list.sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));

export async function fetchTalents(): Promise<Talent[]> {
  const { talentFormId } = formcarryConfig();
  const subs = await fetchSubmissions(talentFormId);
  return newestFirst(subs.map(toTalent).filter((t): t is Talent => t !== null));
}

export async function fetchHiringRequests(): Promise<HiringRequest[]> {
  const { talentFormId, hiringFormId } = formcarryConfig();
  const subs = await fetchSubmissions(hiringFormId ?? talentFormId);
  const requests = subs.map((s) => toHiringRequest(s, !hiringFormId)).filter((r): r is HiringRequest => r !== null);
  // Request IDs count up in order of arrival: the first request is TR-0001.
  [...requests]
    .sort((a, b) => a.submittedAt.localeCompare(b.submittedAt))
    .forEach((r, i) => (r.code = `TR-${String(i + 1).padStart(4, "0")}`));
  return newestFirst(requests);
}
