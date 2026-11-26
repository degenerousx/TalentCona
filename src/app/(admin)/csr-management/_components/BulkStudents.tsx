"use client";

import { useMemo, useRef, useState } from "react";
import { AlertCircle, CheckCircle2, Download, FileSpreadsheet, RefreshCw, Trash2, UploadCloud } from "lucide-react";
import { cn } from "@/lib/cn";
import { COHORTS, MENTORS, PROGRAMS, type Sponsor, type SponsoredTalent, type SponsorshipType } from "./data";
import { Btn } from "./ui";
import { nowIso } from "./AdminUpdates";

/**
 * "Add Students in Bulk": upload an Excel sheet, review every student, assign
 * a sponsor and a mentor (all at once or one by one), then add them.
 * Mock only: the file is read in the browser and nothing is sent anywhere.
 */

/** Template columns, in order. * = required. */
const COLUMNS = ["Full Name", "Email", "Phone", "Program", "Cohort", "Sponsorship Type", "Start Date", "Sponsor"] as const;
const REQUIRED = ["Full Name", "Email", "Program", "Cohort", "Start Date"] as const;
const MAX_ROWS = 500;

type Row = {
  key: number;
  line: number;
  name: string;
  email: string;
  phone: string;
  program: string;
  cohort: string;
  type: SponsorshipType;
  startDate: string;
  sponsorId: string;
  mentorId: string;
  /** Problems found in the file itself: fix the sheet and re-upload, or remove the row. */
  fileErrors: string[];
};

export async function downloadTemplate() {
  const { default: writeXlsxFile } = await import("write-excel-file/browser");
  await writeXlsxFile(
    [
      COLUMNS.map((c) => ({ value: (REQUIRED as readonly string[]).includes(c) ? `${c} *` : c, fontWeight: "bold" as const })),
      ["Ada Okafor", "ada.okafor@example.com", "+234 803 555 0101", "Software Engineering", "Cohort 5", "Full", "2027-01-15", "TechBridge Foundation"],
      ["Bayo Ojo", "bayo.ojo@example.com", "", "Data Analytics", "Cohort 5", "Partial", "2027-01-15", ""],
    ],
    { columns: [{ width: 22 }, { width: 30 }, { width: 20 }, { width: 24 }, { width: 12 }, { width: 18 }, { width: 14 }, { width: 28 }] },
  ).toFile("talentcona-sponsored-students-template.xlsx");
}

const clean = (v: unknown) => (v instanceof Date ? v.toISOString().slice(0, 10) : v == null ? "" : String(v).trim());
const norm = (v: string) => v.toLowerCase().replace(/\*/g, "").replace(/\s+/g, " ").trim();

/** Excel dates arrive as Date objects; text dates are accepted as YYYY-MM-DD or DD/MM/YYYY. */
function toDate(v: string) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return v;
  const m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(v);
  return m ? `${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}` : null;
}

async function parse(file: File, sponsors: Sponsor[], existingEmails: string[]): Promise<Row[] | string> {
  if (!/\.xlsx$/i.test(file.name)) return "Upload an Excel file (.xlsx). Use the template so the columns match.";
  const { readSheet } = await import("read-excel-file/browser");
  let data: unknown[][];
  try {
    data = (await readSheet(file)) as unknown[][];
  } catch {
    return "We couldn't read this file. Check it's a valid Excel workbook and try again.";
  }
  const [header = [], ...body] = data;
  const col = Object.fromEntries(COLUMNS.map((c) => [c, header.findIndex((h) => norm(clean(h)) === norm(c))])) as Record<(typeof COLUMNS)[number], number>;
  const missing = REQUIRED.filter((c) => col[c] < 0);
  if (missing.length) return `The first row must contain the template's column headings. Missing: ${missing.join(", ")}.`;
  const lines = body.map((r, i) => ({ r, line: i + 2 })).filter(({ r }) => r.some((v) => clean(v)));
  if (!lines.length) return "The sheet has no students in it.";
  if (lines.length > MAX_ROWS) return `Upload up to ${MAX_ROWS} students at a time (this file has ${lines.length}).`;

  const seen = new Set(existingEmails);
  return lines.map(({ r, line }, key) => {
    const get = (c: (typeof COLUMNS)[number]) => (col[c] >= 0 ? clean(r[col[c]]) : "");
    const errors: string[] = [];
    const name = get("Full Name");
    const email = get("Email");
    const program = PROGRAMS.find((p) => norm(p) === norm(get("Program")));
    const cohort = COHORTS.find((c) => norm(c) === norm(get("Cohort")));
    const typeText = get("Sponsorship Type");
    const type = (["Full", "Partial"] as const).find((t) => norm(t) === norm(typeText || "Full"));
    const startDate = toDate(get("Start Date"));
    const sponsorText = get("Sponsor");
    const sponsor = sponsors.find((s) => norm(s.name) === norm(sponsorText));

    if (!name) errors.push("Full name is missing");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push(email ? `“${email}” isn't a valid email` : "Email is missing");
    else if (seen.has(email.toLowerCase())) errors.push(`${email} is already a sponsored student or appears twice`);
    if (!program) errors.push(get("Program") ? `“${get("Program")}” isn't a TalentCona program` : "Program is missing");
    if (!cohort) errors.push(get("Cohort") ? `“${get("Cohort")}” isn't a cohort` : "Cohort is missing");
    if (!type) errors.push(`Sponsorship type must be Full or Partial`);
    if (!startDate) errors.push(get("Start Date") ? `Start date “${get("Start Date")}” isn't a date` : "Start date is missing");
    if (sponsorText && !sponsor) errors.push(`Sponsor “${sponsorText}” isn't on the Sponsors list`);
    if (email) seen.add(email.toLowerCase());

    return {
      key, line, name, email, phone: get("Phone"), program: program ?? get("Program"), cohort: cohort ?? get("Cohort"),
      type: type ?? "Full", startDate: startDate ?? "", sponsorId: sponsor?.id ?? "", mentorId: "", fileErrors: errors,
    };
  });
}

const selectCls = "w-full min-w-[160px] rounded-[8px] border bg-white px-2.5 py-2 text-sm text-[#3a3a3a] outline-none focus:border-primary";

export function BulkStudents({
  sponsors,
  existingEmails,
  nextNumber,
  me,
  onCancel,
  onDone,
}: {
  sponsors: Sponsor[];
  existingEmails: string[];
  nextNumber: number;
  me: string;
  onCancel: () => void;
  onDone: (added: SponsoredTalent[]) => void;
}) {
  const [file, setFile] = useState<string | null>(null);
  const [rows, setRows] = useState<Row[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [allSponsor, setAllSponsor] = useState("");
  const [allMentor, setAllMentor] = useState("");
  const [tried, setTried] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  const load = async (f: File | undefined) => {
    if (!f) return;
    setBusy(true);
    setError(null);
    const result = await parse(f, sponsors, existingEmails);
    setBusy(false);
    if (typeof result === "string") {
      setError(result);
      setRows(null);
      setFile(null);
    } else {
      setRows(result);
      setFile(f.name);
      setTried(false);
    }
  };

  const problems = (r: Row) => [...r.fileErrors, ...(r.sponsorId ? [] : ["Choose a sponsor"]), ...(r.mentorId ? [] : ["Choose a mentor"])];
  const stats = useMemo(() => {
    const list = rows ?? [];
    return { total: list.length, fileErrors: list.filter((r) => r.fileErrors.length).length, unassigned: list.filter((r) => !r.sponsorId || !r.mentorId).length };
  }, [rows]);
  const set = (key: number, p: Partial<Row>) => setRows((rs) => rs && rs.map((r) => (r.key === key ? { ...r, ...p } : r)));

  // ---- Step 1: upload ----
  if (!rows) {
    return (
      <div className="flex flex-col gap-5">
        <Steps step={1} />
        <div className="flex flex-col gap-3 rounded-[12px] border border-[#e5e7eb] p-4 sm:flex-row sm:items-center">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-[10px] bg-[#f0fdf4] text-[#008236]">
            <FileSpreadsheet className="size-5" />
          </span>
          <div className="flex-1 text-sm">
            <p className="font-semibold text-[#101828]">Start from the template</p>
            <p className="text-xs text-[#6a7282]">One student per row. Columns: {COLUMNS.join(", ")}. Sponsor is optional here; you can assign it in the next step.</p>
          </div>
          <Btn variant="outline" className="flex items-center gap-2 px-4 py-2.5" onClick={() => void downloadTemplate()}>
            <Download className="size-4" /> Download template
          </Btn>
        </div>
        <label
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            void load(e.dataTransfer.files[0]);
          }}
          className={cn(
            "flex cursor-pointer flex-col items-center gap-2 rounded-[12px] border-2 border-dashed px-6 py-10 text-center transition-colors hover:bg-[#faf5ff]",
            error ? "border-[#ffc9c9] bg-[#fef2f2]/40" : "border-[#e9d4ff]",
          )}
        >
          <UploadCloud className="size-8 text-primary" />
          <span className="text-sm font-semibold text-[#101828]">{busy ? "Reading file…" : "Drag and drop your Excel file here, or click to browse"}</span>
          <span className="text-xs text-[#6a7282]">.xlsx · up to {MAX_ROWS} students</span>
          <input ref={input} type="file" accept=".xlsx" aria-label="Upload Excel file" className="sr-only" onChange={(e) => void load(e.target.files?.[0])} />
        </label>
        {error && (
          <p role="alert" className="flex items-start gap-2 rounded-[12px] border border-[#ffc9c9] bg-[#fef2f2] p-3 text-sm text-[#c10007]">
            <AlertCircle className="mt-0.5 size-4 shrink-0" /> {error}
          </p>
        )}
        <div className="flex justify-end border-t border-[#e5e7eb] pt-5">
          <Btn variant="outline" onClick={onCancel}>
            Cancel
          </Btn>
        </div>
      </div>
    );
  }

  // ---- Step 2: review and assign ----
  const ready = rows.length > 0 && rows.every((r) => !problems(r).length);
  return (
    <div className="flex flex-col gap-5">
      <Steps step={2} />
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-[12px] border border-[#e5e7eb] p-3">
        <p className="flex items-center gap-2 text-sm text-[#364153]">
          <FileSpreadsheet className="size-4 text-[#008236]" /> <span className="font-medium text-[#101828]">{file}</span> · {stats.total} {stats.total === 1 ? "student" : "students"}
        </p>
        <button type="button" onClick={() => input.current?.click()} className="flex items-center gap-1.5 text-xs font-medium text-primary hover:underline">
          <RefreshCw className="size-3.5" /> Upload a different file
        </button>
        <input ref={input} type="file" accept=".xlsx" aria-label="Upload a different Excel file" className="sr-only" onChange={(e) => void load(e.target.files?.[0])} />
      </div>

      <fieldset className="rounded-[12px] bg-[#f9fafb] p-4">
        <legend className="sr-only">Assign to all students</legend>
        <p className="mb-3 text-sm font-semibold text-[#101828]">Assign to all students</p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto_1fr_auto] sm:items-end">
          <label className="flex flex-col gap-1.5 text-sm font-medium text-[#364153]">
            Sponsor
            <select aria-label="Sponsor for all students" className={cn(selectCls, "border-[#d1d5dc]")} value={allSponsor} onChange={(e) => setAllSponsor(e.target.value)}>
              <option value="">Select a sponsor…</option>
              {sponsors.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>
          <Btn variant="outline" className="px-4 py-2" disabled={!allSponsor} onClick={() => setRows((rs) => rs && rs.map((r) => ({ ...r, sponsorId: allSponsor })))}>
            Apply sponsor
          </Btn>
          <label className="flex flex-col gap-1.5 text-sm font-medium text-[#364153]">
            Mentor
            <select aria-label="Mentor for all students" className={cn(selectCls, "border-[#d1d5dc]")} value={allMentor} onChange={(e) => setAllMentor(e.target.value)}>
              <option value="">Select a mentor…</option>
              {MENTORS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} · {m.programs.join(", ")}
                </option>
              ))}
            </select>
          </label>
          <Btn variant="outline" className="px-4 py-2" disabled={!allMentor} onClick={() => setRows((rs) => rs && rs.map((r) => ({ ...r, mentorId: allMentor })))}>
            Apply mentor
          </Btn>
        </div>
        <p className="mt-2 text-xs text-[#6a7282]">You can still change the sponsor or mentor for any student in the table below.</p>
      </fieldset>

      <div className="overflow-x-auto rounded-[12px] border border-[#e5e7eb]">
        <table className="w-full min-w-[860px] text-sm">
          <thead className="border-b border-[#f3f4f6] bg-[#f9fafb]/60 text-left text-xs font-semibold tracking-[0.6px] text-[#6a7282] uppercase">
            <tr>
              <th className="px-3 py-3">Row</th>
              <th className="px-3 py-3">Student</th>
              <th className="px-3 py-3">Program</th>
              <th className="px-3 py-3">Sponsor</th>
              <th className="px-3 py-3">Mentor</th>
              <th className="px-3 py-3">
                <span className="sr-only">Remove</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const issues = problems(r);
              const show = r.fileErrors.length > 0 || tried;
              const suggested = MENTORS.filter((m) => m.programs.includes(r.program));
              return (
                <tr key={r.key} className={cn("border-b border-[#f9fafb] align-top last:border-0", r.fileErrors.length ? "bg-[#fef2f2]/50" : "")}>
                  <td className="px-3 py-3 font-mono text-xs text-[#6a7282]">{r.line}</td>
                  <td className="px-3 py-3">
                    <p className="font-medium text-[#101828]">{r.name || "—"}</p>
                    <p className="text-xs text-[#99a1af]">{r.email || "—"}</p>
                    {show && issues.length > 0 && (
                      <ul className="mt-1 flex flex-col gap-0.5 text-xs text-[#c10007]">
                        {issues.map((i) => (
                          <li key={i} className="flex items-start gap-1">
                            <AlertCircle className="mt-0.5 size-3 shrink-0" /> {i}
                          </li>
                        ))}
                      </ul>
                    )}
                  </td>
                  <td className="px-3 py-3 text-[#364153]">
                    {r.program || "—"}
                    <p className="text-xs text-[#99a1af]">
                      {r.cohort} · {r.type} · {r.startDate || "no start date"}
                    </p>
                  </td>
                  <td className="px-3 py-3">
                    <select
                      aria-label={`Sponsor for ${r.name || `row ${r.line}`}`}
                      className={cn(selectCls, tried && !r.sponsorId ? "border-[#e7000b]" : "border-[#d1d5dc]")}
                      value={r.sponsorId}
                      onChange={(e) => set(r.key, { sponsorId: e.target.value })}
                    >
                      <option value="">Select…</option>
                      {sponsors.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-3 py-3">
                    <select
                      aria-label={`Mentor for ${r.name || `row ${r.line}`}`}
                      className={cn(selectCls, tried && !r.mentorId ? "border-[#e7000b]" : "border-[#d1d5dc]")}
                      value={r.mentorId}
                      onChange={(e) => set(r.key, { mentorId: e.target.value })}
                    >
                      <option value="">Select…</option>
                      {suggested.length > 0 && (
                        <optgroup label={`Mentors for ${r.program}`}>
                          {suggested.map((m) => (
                            <option key={m.id} value={m.id}>
                              {m.name} ({m.students}/{m.capacity})
                            </option>
                          ))}
                        </optgroup>
                      )}
                      <optgroup label="All mentors">
                        {MENTORS.filter((m) => !suggested.includes(m)).map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.name} ({m.students}/{m.capacity})
                          </option>
                        ))}
                      </optgroup>
                    </select>
                  </td>
                  <td className="px-3 py-3">
                    <button
                      type="button"
                      aria-label={`Remove ${r.name || `row ${r.line}`}`}
                      onClick={() => setRows((rs) => rs && rs.filter((x) => x.key !== r.key))}
                      className="rounded-[8px] p-1.5 text-[#6a7282] hover:bg-slate-100 hover:text-[#c10007]"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {(stats.fileErrors > 0 || (tried && stats.unassigned > 0)) && (
        <p role="alert" className="rounded-[12px] border border-[#ffc9c9] bg-[#fef2f2] p-3 text-sm text-[#c10007]">
          {stats.fileErrors > 0 && `${stats.fileErrors} ${stats.fileErrors === 1 ? "row has" : "rows have"} problems in the file: fix the sheet and upload it again, or remove those rows. `}
          {tried && stats.unassigned > 0 && `${stats.unassigned} ${stats.unassigned === 1 ? "student still needs" : "students still need"} a sponsor and mentor.`}
        </p>
      )}

      <div className="flex justify-end gap-3 border-t border-[#e5e7eb] pt-5">
        <Btn variant="outline" onClick={onCancel}>
          Cancel
        </Btn>
        <Btn
          disabled={rows.length === 0}
          onClick={() => {
            setTried(true);
            if (!ready) return;
            onDone(
              rows.map((r, i) => ({
                id: `TLT-${String(nextNumber + i).padStart(3, "0")}`,
                name: r.name, email: r.email, phone: r.phone, program: r.program, cohort: r.cohort, type: r.type,
                status: "Pending", startDate: r.startDate, progress: 0, certifications: "0 earned", internship: "Not Started",
                sponsorId: r.sponsorId, mentorId: r.mentorId, sponsorHistory: [{ from: null, to: r.sponsorId, at: nowIso(), by: me }],
              })),
            );
          }}
        >
          {`Add ${rows.length} ${rows.length === 1 ? "Student" : "Students"}`}
        </Btn>
      </div>
    </div>
  );
}

function Steps({ step }: { step: 1 | 2 }) {
  return (
    <ol className="flex items-center gap-3 text-sm" aria-label="Progress">
      {["Upload file", "Review & assign"].map((label, i) => {
        const n = i + 1;
        const done = n < step;
        const on = n === step;
        return (
          <li key={label} className="flex items-center gap-2" aria-current={on ? "step" : undefined}>
            <span className={cn("flex size-6 items-center justify-center rounded-full text-xs font-semibold", done ? "bg-primary text-white" : on ? "bg-[#faf5ff] text-primary ring-2 ring-primary" : "bg-[#f3f4f6] text-[#6a7282]")}>
              {done ? <CheckCircle2 className="size-4" /> : n}
            </span>
            <span className={on ? "font-semibold text-primary" : "text-[#6a7282]"}>{label}</span>
            {n < 2 && <span className="h-px w-8 bg-[#d1d5dc]" aria-hidden />}
          </li>
        );
      })}
    </ol>
  );
}
