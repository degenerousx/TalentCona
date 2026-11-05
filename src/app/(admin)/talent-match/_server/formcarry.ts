/**
 * Server-only: reads the talent network form's submissions from Formcarry and
 * maps them to Talent Match candidates. Imported by the route handler in
 * src/app/api/talent-match/submissions — never from a client component, since
 * it uses the Formcarry API key.
 *
 * Configuration (server environment, e.g. .env.local or the hosting settings):
 *   FORMCARRY_API_KEY   required — Formcarry dashboard → API Keys
 *   FORMCARRY_FORM_ID   optional — defaults to the TalentMatch form
 *   FORMCARRY_API_URL   optional — submissions endpoint, "{formId}" is filled in
 *
 * Shape confirmed from a real submission (via the Formcarry connector):
 *   { data: [{ id, created_at, spam, read, fields: [{ key, value }], attachments: [] }],
 *     has_more, next_cursor }
 * Other likely shapes are still accepted in case the REST API differs.
 */
import type { Candidate } from "../_components/data";
import { EXPERIENCE_OPTIONS, FORM_FIELDS } from "../_components/formFields";

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

export function formcarryConfig() {
  const apiKey = process.env.FORMCARRY_API_KEY?.trim();
  if (!apiKey) {
    // 424, not 5xx: the error card shows a 4xx's own message, and this one says how to fix it.
    throw new FormcarryError(
      424,
      "FORMCARRY_NOT_CONFIGURED",
      "Talent Match isn't connected to Formcarry yet. Set FORMCARRY_API_KEY on the server, then reload.",
    );
  }
  const formId = process.env.FORMCARRY_FORM_ID?.trim() || DEFAULT_FORM_ID;
  const url = (process.env.FORMCARRY_API_URL?.trim() || DEFAULT_API_URL).replace("{formId}", encodeURIComponent(formId));
  return { apiKey, url };
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

/** The CV: the "cv" field, else the submission's file list, else any file-like field. */
function cvOf(sub: Json, fields: Json): FileRef | null {
  const named = Object.entries(fields).find(([key]) => normaliseKey(key) === normaliseKey(FORM_FIELDS.cv));
  const fromField = named ? fileFrom(named[1]) : null;
  if (fromField) return fromField;
  for (const key of ["files", "attachments", "uploads"]) {
    const list = sub[key];
    if (Array.isArray(list)) {
      const cv = list.find((f) => isObject(f) && typeof f.field === "string" && normaliseKey(f.field) === normaliseKey(FORM_FIELDS.cv));
      const file = fileFrom(cv ?? list);
      if (file) return file;
    }
  }
  return null;
}

function initialsOf(name: string) {
  const parts = name.split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  return (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase();
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

/** One Formcarry submission → one candidate, or null when it isn't usable. */
export function toCandidate(sub: Json): Candidate | null {
  if (sub.spam === true || sub.is_spam === true) return null;
  const fields = fieldsOf(sub);
  const id = [sub.id, sub._id, sub.submission_id].find((v): v is string => typeof v === "string");
  const name = text(fields, FORM_FIELDS.fullName, "full_name", "name");
  const email = text(fields, FORM_FIELDS.email, "email_address", "emailAddress");
  if (!id || (!name && !email)) return null;

  const experience = experienceOf(text(fields, FORM_FIELDS.yearsOfExperience, "experience", "years_of_experience"));
  const cv = cvOf(sub, fields);
  const createdAt = [sub.created_at, sub.createdAt, sub.date].find((v): v is string => typeof v === "string") ?? new Date().toISOString();
  const displayName = name || email;

  return {
    id,
    name: displayName,
    initials: initialsOf(displayName),
    email,
    phone: text(fields, FORM_FIELDS.phone, "phone_number", "phoneNumber") || undefined,
    linkedinUrl: linkOf(text(fields, FORM_FIELDS.linkedin, "linkedin_profile", "linkedinUrl")),
    headline: text(fields, FORM_FIELDS.professionalTitle, "professional_title", "title", "role") || "—",
    yearsExperience: experience.years,
    experienceLabel: experience.label,
    certifications: [],
    location: text(fields, FORM_FIELDS.location, "city") || "—",
    availability: "available",
    skills: text(fields, FORM_FIELDS.skills, "key_skills", "keySkills")
      .split(/[,;\n]/)
      .map((s) => s.trim())
      .filter(Boolean),
    cvSubmittedOn: createdAt,
    cvFileName: cv?.name ?? "",
    cvUrl: cv?.url,
    cvStatus: sub.read === true || sub.is_read === true ? "in-review" : "new",
  };
}

// ---- Fetching ------------------------------------------------------------------

/** Every (non-spam) submission, newest first, mapped to candidates. */
export async function fetchCandidates(): Promise<Candidate[]> {
  const { apiKey, url } = formcarryConfig();
  const candidates: Candidate[] = [];
  let cursor: string | null = null;
  let seen = 0;

  do {
    const pageUrl = new URL(url);
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
      const message = isObject(body) && typeof body.message === "string" ? body.message : `Formcarry answered ${res.status}.`;
      const keyRejected = res.status === 401 || res.status === 403;
      throw new FormcarryError(
        keyRejected ? 424 : 502,
        keyRejected ? "FORMCARRY_KEY_REJECTED" : "FORMCARRY_ERROR",
        keyRejected ? "Formcarry rejected the API key. Check FORMCARRY_API_KEY." : message,
      );
    }

    const page = listOf(body);
    seen += page.length;
    for (const sub of page) {
      const candidate = toCandidate(sub);
      if (candidate) candidates.push(candidate);
    }
    cursor = page.length ? nextCursorOf(body) : null;
  } while (cursor && seen < MAX_SUBMISSIONS);

  return candidates.sort((a, b) => b.cvSubmittedOn.localeCompare(a.cvSubmittedOn));
}
