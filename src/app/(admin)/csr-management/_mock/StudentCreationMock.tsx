"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { FileSpreadsheet, MailCheck, MoreHorizontal, Route, Search, UserPlus, Users, Wallet } from "lucide-react";
import { Button } from "@/components/shadcn/button";
import { CREATED_STUDENTS, naira } from "./data";
import { MockBanner, SourcePill, StatusPill } from "./parts";
import { SingleStudent, type SingleStep } from "./SingleStudent";
import { BulkUpload, type BulkStep } from "./BulkUpload";
import { Onboarding } from "./Onboarding";

/**
 * MOCK DESIGN: Student Creation & Onboarding (CSR Management).
 * Every screen is reachable by clicking through, or directly with ?view=:
 *   overview · single · single-errors · single-review · single-success ·
 *   bulk · bulk-error · bulk-validate · bulk-review · bulk-success · onboarding
 */
export default function StudentCreationMock() {
  const [view, setView] = useState(useSearchParams().get("view") ?? "overview");
  const go = (v: string) => {
    setView(v);
    window.history.replaceState(null, "", v === "overview" ? "?" : `?view=${v}`);
    document.querySelector("main")?.scrollTo({ top: 0 });
  };

  if (view.startsWith("single")) {
    const step = ({ single: "form", "single-errors": "errors", "single-review": "review", "single-success": "success" } as Record<string, SingleStep>)[view] ?? "form";
    return <SingleStudent step={step} go={go} />;
  }
  if (view.startsWith("bulk")) {
    const step = ({ bulk: "upload", "bulk-error": "upload-error", "bulk-validate": "validate", "bulk-review": "review", "bulk-success": "success" } as Record<string, BulkStep>)[view] ?? "upload";
    return <BulkUpload step={step} go={go} />;
  }
  if (view === "onboarding") return <Onboarding go={go} />;
  return <Overview go={go} />;
}

function Overview({ go }: { go: (v: string) => void }) {
  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-3">
        <h1 className="text-[28px] leading-[1.3] font-bold text-heading sm:text-[32px]">CSR Management</h1>
        <p className="text-base leading-5 text-slate-900">Create sponsored students and follow their onboarding</p>
      </header>
      <MockBanner />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { icon: Users, label: "Students created", value: "128", note: "This year", tone: "bg-primary-soft text-primary" },
          { icon: MailCheck, label: "Activated", value: "96", note: "75% of invitations", tone: "bg-success-soft text-success" },
          { icon: Route, label: "Awaiting activation", value: "24", note: "3 invitations expired", tone: "bg-warning-soft text-warning" },
          { icon: Wallet, label: "Sponsored value", value: naira(3840000000), note: "Across 6 sponsors", tone: "bg-finance-info text-finance-blue" },
        ].map((k) => (
          <article key={k.label} className="flex items-start gap-4 rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
            <span className={`flex size-11 shrink-0 items-center justify-center rounded-full ${k.tone}`}>
              <k.icon className="size-5" />
            </span>
            <div>
              <p className="text-sm text-gray-600">{k.label}</p>
              <p className="text-2xl leading-8 font-bold text-heading">{k.value}</p>
              <p className="text-xs text-gray-500">{k.note}</p>
            </div>
          </article>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <ActionCard icon={<UserPlus className="size-6" />} title="Add a single student" body="Fill in one student's details, programme and sponsorship." cta="Add student" onClick={() => go("single")} primary />
        <ActionCard icon={<FileSpreadsheet className="size-6" />} title="Bulk upload from Excel" body="Upload a sheet of students. We check every row before anything is created." cta="Upload sheet" onClick={() => go("bulk")} />
        <ActionCard icon={<Route className="size-6" />} title="Student onboarding journey" body="See the email, activation and first sign-in your students go through." cta="View journey" onClick={() => go("onboarding")} />
      </div>

      <section className="rounded-lg border border-gray-200 bg-white shadow-sm">
        <header className="flex flex-col gap-4 border-b border-gray-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div>
            <h2 className="text-lg leading-6 font-semibold text-heading">Recently created students</h2>
            <p className="text-sm text-gray-600">Track who has activated their account</p>
          </div>
          <div className="flex h-10 w-full items-center gap-2 rounded-md border border-gray-300 px-3 sm:w-72">
            <Search className="size-4 text-gray-400" />
            <span className="text-sm text-gray-400">Search name, email or sponsor</span>
          </div>
        </header>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[960px] text-left text-sm">
            <thead className="bg-table-head text-xs tracking-wide text-table-label uppercase">
              <tr>
                {["Student", "Programme", "Funding", "Amount paid", "Added", "Onboarding", ""].map((h) => (
                  <th key={h} className="px-4 py-3 font-medium first:pl-6">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {CREATED_STUDENTS.map((s) => (
                <tr key={s.email} className="border-t border-gray-100">
                  <td className="px-4 py-4 pl-6">
                    <p className="font-medium text-heading">{s.name}</p>
                    <p className="text-xs text-gray-500">{s.email}</p>
                  </td>
                  <td className="px-4 py-4 text-gray-700">{s.programme}</td>
                  <td className="px-4 py-4">
                    <SourcePill source={s.source} />
                    <p className="mt-1 text-xs text-gray-500">{s.sponsor}</p>
                  </td>
                  <td className="px-4 py-4 font-medium text-heading">{naira(s.amount)}</td>
                  <td className="px-4 py-4 text-gray-700">
                    {s.created}
                    <p className="text-xs text-gray-500">{s.via === "Bulk" ? "Bulk upload" : "Single"}</p>
                  </td>
                  <td className="px-4 py-4">
                    <StatusPill status={s.status} />
                  </td>
                  <td className="px-4 py-4 pr-6 text-right">
                    {s.status === "Invitation sent" || s.status === "Invite expired" ? (
                      <Button variant="outline" size="sm">
                        Resend email
                      </Button>
                    ) : (
                      <Button variant="ghost" size="icon" aria-label={`More actions for ${s.name}`}>
                        <MoreHorizontal />
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function ActionCard({ icon, title, body, cta, onClick, primary }: { icon: React.ReactNode; title: string; body: string; cta: string; onClick: () => void; primary?: boolean }) {
  return (
    <article className="flex flex-col gap-4 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <span className="flex size-12 items-center justify-center rounded-lg bg-primary-soft text-primary">{icon}</span>
      <div className="flex-1">
        <h2 className="text-lg leading-6 font-semibold text-heading">{title}</h2>
        <p className="mt-1 text-sm leading-5 text-gray-600">{body}</p>
      </div>
      <Button variant={primary ? "default" : "outline"} className="h-10 w-fit px-5" onClick={onClick}>
        {cta}
      </Button>
    </article>
  );
}
