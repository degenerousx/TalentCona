"use client";

import { AlertCircle, AlertTriangle, ArrowLeft, CheckCircle2, Download, FileSpreadsheet, RefreshCw, Send, UploadCloud, X } from "lucide-react";
import { Button } from "@/components/shadcn/button";
import { cn } from "@/lib/cn";
import { BULK_SUMMARY, TEMPLATE_COLUMNS, UPLOAD, naira } from "./data";
import { MockBanner, Section, SourcePill, Stepper } from "./parts";

export type BulkStep = "upload" | "upload-error" | "validate" | "review" | "success";
type Go = (view: string) => void;

export function BulkUpload({ step, go }: { step: BulkStep; go: Go }) {
  const current = { upload: 0, "upload-error": 0, validate: 1, review: 2, success: 3 }[step];
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4">
        <button onClick={() => go("overview")} className="inline-flex w-fit items-center gap-1.5 text-sm text-primary hover:underline">
          <ArrowLeft className="size-4" /> Back to CSR Management
        </button>
        <header className="flex flex-col gap-2">
          <h1 className="text-[28px] leading-[1.3] font-bold text-heading sm:text-[32px]">Bulk Upload Students</h1>
          <p className="text-base leading-5 text-slate-900">Add many sponsored students at once from an Excel sheet.</p>
        </header>
        <Stepper steps={["Upload sheet", "Check rows", "Review & create", "Done"]} current={current} />
        <MockBanner />
      </div>
      {step === "upload" || step === "upload-error" ? <Upload failed={step === "upload-error"} go={go} /> : step === "validate" ? <Validate go={go} /> : step === "review" ? <Review go={go} /> : <Done go={go} />}
    </div>
  );
}

function Upload({ failed, go }: { failed: boolean; go: Go }) {
  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
      <div className="flex flex-col gap-6">
        <Section title="1. Download the template" description="Use our template so the columns match. One row per student.">
          <div className="flex flex-col gap-4 rounded-lg border border-gray-200 p-4 sm:flex-row sm:items-center">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-finance-positive-soft text-finance-positive">
              <FileSpreadsheet className="size-6" />
            </span>
            <div className="flex-1">
              <p className="text-sm font-semibold text-heading">talentcona-student-upload-template.xlsx</p>
              <p className="text-xs text-gray-600">10 columns · includes a “Lists” sheet with valid programmes, cohorts and funding sources</p>
            </div>
            <Button variant="outline" className="h-10">
              <Download /> Download template
            </Button>
          </div>
        </Section>

        <Section title="2. Upload your completed sheet">
          {failed ? (
            <div role="alert" className="mb-4 flex gap-3 rounded-lg border border-danger/30 bg-red-50 p-4 text-sm leading-5 text-red-800">
              <AlertCircle className="mt-0.5 size-5 shrink-0 text-danger" />
              <div>
                <p className="font-semibold">We couldn&apos;t read “students-list.pdf”</p>
                <p>Upload an Excel file (.xlsx or .xls) or CSV, up to 5 MB and 1,000 rows. Columns must match the template: “Amount Paid (NGN)” and “Funding Source” are missing.</p>
              </div>
            </div>
          ) : null}
          <div className={cn("flex flex-col items-center gap-3 rounded-lg border-2 border-dashed px-6 py-12 text-center", failed ? "border-danger/40 bg-red-50/40" : "border-accent-light bg-primary-soft/50")}>
            <span className="flex size-14 items-center justify-center rounded-full bg-white shadow-sm">
              <UploadCloud className="size-7 text-primary" />
            </span>
            <p className="text-base font-semibold text-heading">Drag and drop your Excel file here</p>
            <p className="text-sm text-gray-600">or</p>
            <Button className="h-10 px-5" onClick={() => go("bulk-validate")}>
              Browse files
            </Button>
            <p className="text-xs text-gray-500">.xlsx, .xls or .csv · max 5 MB · up to 1,000 students</p>
          </div>
        </Section>

        <Section title="How your sheet should look" description="Sample rows. Columns marked * are required.">
          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="w-full min-w-[1100px] text-left text-xs">
              <thead>
                <tr className="bg-finance-positive-soft">
                  <th className="w-10 border-r border-gray-200 px-2 py-2 text-center font-normal text-gray-500"> </th>
                  {TEMPLATE_COLUMNS.map((c, i) => (
                    <th key={c.name} className="border-r border-gray-200 px-3 py-2 font-normal text-gray-500">
                      {String.fromCharCode(65 + i)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr className="bg-gray-50">
                  <td className="border-t border-r border-gray-200 px-2 py-2 text-center text-gray-500">1</td>
                  {TEMPLATE_COLUMNS.map((c) => (
                    <td key={c.name} className="border-t border-r border-gray-200 px-3 py-2 font-semibold whitespace-nowrap text-heading">
                      {c.name}
                      {c.required && <span className="text-danger">*</span>}
                    </td>
                  ))}
                </tr>
                {[
                  TEMPLATE_COLUMNS.map((c) => c.example),
                  ["Tunde", "Bakare", "tunde.bakare@example.com", "+2348021112233", "Data Analysis", "Cohort 4 · Jan 2027", "320000", "CRS", "Lagos Youth CRS Fund", "LYF-0098"],
                  ["Chinedu", "Eze", "chinedu.eze@example.com", "", "Front-End Development", "Cohort 4 · Jan 2027", "126000", "Individual", "", ""],
                ].map((r, i) => (
                  <tr key={i}>
                    <td className="border-t border-r border-gray-200 px-2 py-2 text-center text-gray-500">{i + 2}</td>
                    {r.map((v, j) => (
                      <td key={j} className="border-t border-r border-gray-200 px-3 py-2 whitespace-nowrap text-gray-700">
                        {v}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>
      </div>

      <aside className="flex flex-col gap-4 xl:sticky xl:top-4 xl:self-start">
        <Section title="Rules we check">
          <ul className="flex flex-col gap-3 text-sm leading-5 text-gray-700">
            {[
              "Email is valid and appears once in the sheet",
              "Programme and cohort match TalentCona's list exactly",
              "Funding source is CRS, Corporate Organisation, Individual or Philanthropy",
              "Sponsor name is filled for CRS, Corporate Organisation and Philanthropy",
              "Amount paid is a number in naira, no ₦ sign or commas needed",
              "Existing accounts are enrolled, not duplicated",
            ].map((r) => (
              <li key={r} className="flex gap-2">
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-finance-positive" />
                {r}
              </li>
            ))}
          </ul>
        </Section>
        <p className="rounded-lg bg-gray-50 p-4 text-sm leading-5 text-gray-700">
          Nothing is created until you confirm on the review step. You can fix problems and re-upload as many times as you need.
        </p>
      </aside>
    </div>
  );
}

function Validate({ go }: { go: Go }) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-finance-positive-soft text-finance-positive">
          <FileSpreadsheet className="size-6" />
        </span>
        <div className="flex-1">
          <p className="text-sm font-semibold text-heading">{UPLOAD.file}</p>
          <p className="text-xs text-gray-600">
            {UPLOAD.size} · {UPLOAD.total} students found · checked just now
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="h-9">
            <RefreshCw /> Re-upload
          </Button>
          <Button variant="ghost" size="icon" aria-label="Remove file">
            <X />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Stat tone="success" icon={<CheckCircle2 className="size-5" />} label="Ready to create" value={UPLOAD.ready} note="No problems found" />
        <Stat tone="warning" icon={<AlertTriangle className="size-5" />} label="Warnings" value={UPLOAD.warnings} note="Will be created; worth a look" />
        <Stat tone="danger" icon={<AlertCircle className="size-5" />} label="Errors" value={UPLOAD.errors} note="Skipped unless fixed" />
      </div>

      <Section
        title="Row check"
        description="Fix errors in your sheet and re-upload, or continue without those rows."
        action={
          <div className="flex rounded-md border border-gray-200 p-0.5 text-sm" role="group" aria-label="Show rows">
            {["All (50)", "Errors (4)", "Warnings (2)"].map((t, i) => (
              <span key={t} className={cn("rounded px-3 py-1.5", i === 0 ? "bg-primary text-white" : "text-gray-600")}>
                {t}
              </span>
            ))}
          </div>
        }
      >
        <div className="-mx-5 overflow-x-auto sm:-mx-6">
          <table className="w-full min-w-[980px] text-left text-sm">
            <thead className="bg-table-head text-xs tracking-wide text-table-label uppercase">
              <tr>
                {["Row", "Status", "Student", "Email", "Programme", "Amount (₦)", "Funding", "Sponsor"].map((h) => (
                  <th key={h} className="px-4 py-3 font-medium first:pl-6">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {UPLOAD.rows.map((r) => {
                const bad = (col: string) => r.issues.find((i) => i.column === col);
                const level = r.issues.some((i) => i.level === "error") ? "error" : r.issues.length ? "warning" : "ok";
                const cell = (col: string, v: string) => {
                  const issue = bad(col);
                  return (
                    <td className="px-4 py-3 align-top">
                      <span className={cn(issue?.level === "error" && "rounded bg-red-50 px-1 text-red-700 ring-1 ring-danger/40", issue?.level === "warning" && "rounded bg-warning-soft px-1 text-orange-800 ring-1 ring-warning/40", !v && issue && "italic")}>{v || (issue ? "Missing" : "—")}</span>
                      {issue && <span className={cn("mt-1 block text-xs leading-4", issue.level === "error" ? "text-danger" : "text-warning-strong")}>{issue.message}</span>}
                    </td>
                  );
                };
                return (
                  <tr key={r.row} className={cn("border-t border-gray-100", level === "error" && "bg-red-50/40", level === "warning" && "bg-warning-soft/40")}>
                    <td className="px-4 py-3 pl-6 align-top text-gray-500">{r.row}</td>
                    <td className="px-4 py-3 align-top">
                      {level === "ok" ? (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-success">
                          <CheckCircle2 className="size-4" /> Ready
                        </span>
                      ) : level === "warning" ? (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-warning-strong">
                          <AlertTriangle className="size-4" /> Warning
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-danger">
                          <AlertCircle className="size-4" /> Error
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 align-top font-medium whitespace-nowrap text-heading">
                      {r.first} {r.last}
                    </td>
                    {cell("Email", r.email)}
                    {cell("Programme", r.programme)}
                    {cell("Amount Paid", r.amount)}
                    <td className="px-4 py-3 align-top text-gray-700">{r.source}</td>
                    {cell("Sponsor Name", r.sponsor)}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="mt-4 text-sm text-gray-500">Showing rows 2–11 of 50</p>
      </Section>

      <div className="flex flex-col gap-3 rounded-lg border border-gray-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm leading-5 text-gray-700">
          <span className="font-semibold text-heading">46 students</span> will be created. 4 rows with errors will be skipped. Download them to fix later.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button variant="outline" className="h-10">
            <Download /> Download error rows
          </Button>
          <Button className="h-10 px-5" onClick={() => go("bulk-review")}>
            Continue with 46 students
          </Button>
        </div>
      </div>
    </div>
  );
}

function Stat({ tone, icon, label, value, note }: { tone: "success" | "warning" | "danger"; icon: React.ReactNode; label: string; value: number; note: string }) {
  const t = { success: "bg-success-soft text-success", warning: "bg-warning-soft text-warning", danger: "bg-red-50 text-danger" }[tone];
  return (
    <div className="flex items-center gap-4 rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
      <span className={cn("flex size-11 items-center justify-center rounded-full", t)}>{icon}</span>
      <div>
        <p className="text-sm text-gray-600">{label}</p>
        <p className="text-2xl leading-8 font-bold text-heading">{value}</p>
        <p className="text-xs text-gray-500">{note}</p>
      </div>
    </div>
  );
}

function Review({ go }: { go: Go }) {
  const b = BULK_SUMMARY;
  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
      <div className="flex flex-col gap-6">
        <Section title="By programme">
          <div className="-mx-5 overflow-x-auto sm:-mx-6">
            <table className="w-full min-w-[520px] text-left text-sm">
              <thead className="bg-table-head text-xs tracking-wide text-table-label uppercase">
                <tr>
                  <th className="px-6 py-3 font-medium">Programme</th>
                  <th className="px-4 py-3 font-medium">Cohort</th>
                  <th className="px-4 py-3 text-right font-medium">Students</th>
                  <th className="px-6 py-3 text-right font-medium">Amount paid</th>
                </tr>
              </thead>
              <tbody>
                {b.byProgramme.map((p) => (
                  <tr key={p.title} className="border-t border-gray-100">
                    <td className="px-6 py-3 font-medium text-heading">{p.title}</td>
                    <td className="px-4 py-3 text-gray-600">Cohort 4 · Jan 2027</td>
                    <td className="px-4 py-3 text-right">{p.count}</td>
                    <td className="px-6 py-3 text-right font-medium text-heading">{naira(p.amount)}</td>
                  </tr>
                ))}
                <tr className="border-t border-gray-200 bg-gray-50 font-semibold text-heading">
                  <td className="px-6 py-3" colSpan={2}>
                    Total
                  </td>
                  <td className="px-4 py-3 text-right">{b.students}</td>
                  <td className="px-6 py-3 text-right">{naira(b.total)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </Section>
        <Section title="By funding source">
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {b.bySource.map((s) => (
              <li key={s.source} className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 p-4">
                <div className="flex flex-col gap-1.5">
                  <SourcePill source={s.source} />
                  <span className="text-sm font-medium text-heading">{s.sponsor}</span>
                </div>
                <span className="text-2xl font-bold text-heading">{s.count}</span>
              </li>
            ))}
          </ul>
        </Section>
      </div>
      <aside className="flex flex-col gap-4 xl:sticky xl:top-4 xl:self-start">
        <Section title="Ready to create">
          <p className="text-4xl leading-10 font-bold text-heading">46</p>
          <p className="text-sm text-gray-600">students · {naira(b.total)} paid</p>
          <ul className="mt-4 flex flex-col gap-2 text-sm text-gray-700">
            <li className="flex justify-between">
              <span>New accounts</span>
              <span className="font-medium text-heading">45</span>
            </li>
            <li className="flex justify-between">
              <span>Existing accounts, enrolled</span>
              <span className="font-medium text-heading">1</span>
            </li>
            <li className="flex justify-between">
              <span>Skipped (errors)</span>
              <span className="font-medium text-danger">4</span>
            </li>
          </ul>
          <label className="mt-5 flex items-start gap-3 rounded-lg bg-gray-50 p-3">
            <input type="checkbox" defaultChecked className="mt-0.5 size-4 accent-[#302a91]" />
            <span className="text-sm leading-5 text-gray-700">Send activation emails to all 46 students now</span>
          </label>
          <Button className="mt-5 h-10 w-full" onClick={() => go("bulk-success")}>
            Create 46 students
          </Button>
          <Button variant="outline" className="mt-2 h-10 w-full" onClick={() => go("bulk-validate")}>
            Back to row check
          </Button>
        </Section>
      </aside>
    </div>
  );
}

function Done({ go }: { go: Go }) {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col items-center gap-6 rounded-lg border border-gray-200 bg-white px-6 py-10 text-center shadow-sm sm:px-10">
      <span className="flex size-16 items-center justify-center rounded-full bg-success-soft">
        <CheckCircle2 className="size-9 text-success" />
      </span>
      <div>
        <h2 className="text-2xl leading-8 font-bold text-heading">46 students created</h2>
        <p className="mt-2 text-base leading-6 text-gray-600">From {UPLOAD.file}. Each student is enrolled in their programme with payment recorded.</p>
      </div>
      <p className="flex items-center gap-2 rounded-full bg-info-soft px-4 py-2 text-sm text-info">
        <Send className="size-4" /> 46 activation emails are being sent
      </p>
      <div className="grid w-full grid-cols-3 gap-3 text-left">
        {[
          ["Created", "45", "text-success"],
          ["Enrolled (existing)", "1", "text-info"],
          ["Skipped", "4", "text-danger"],
        ].map(([l, v, c]) => (
          <div key={l} className="rounded-lg bg-gray-50 p-4">
            <p className={cn("text-2xl font-bold", c)}>{v}</p>
            <p className="text-xs text-gray-600">{l}</p>
          </div>
        ))}
      </div>
      <div className="flex w-full flex-col gap-3 sm:flex-row sm:justify-center">
        <Button variant="outline" className="h-10">
          <Download /> Download upload report
        </Button>
        <Button className="h-10 px-5" onClick={() => go("overview")}>
          View students
        </Button>
      </div>
    </div>
  );
}
