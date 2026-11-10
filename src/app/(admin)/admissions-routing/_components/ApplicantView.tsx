"use client";

import Link from "next/link";
import { toast } from "sonner";
import { Toaster } from "@/components/shadcn/sonner";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ErrorState, LoadingState } from "@/components/ui/States";
import { useApplicant, useSendReminder } from "./api";

function CardHeading({ icon, children }: { icon?: string; children: React.ReactNode }) {
  return (
    <h2 className="flex items-center gap-2 text-lg leading-7 font-semibold text-gray-900">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {icon && <img src={icon} alt="" width={20} height={20} />}
      {children}
    </h2>
  );
}

const backLink = (
  <Link href="/admissions-routing" className="rounded text-base leading-6 font-semibold text-slate-900 hover:text-primary">
    <span aria-hidden="true">← </span>Back<span className="sr-only"> to Admissions &amp; Routing</span>
  </Link>
);

/** One onboarding applicant, from GET /admissions/admin/onboarding-queue/:studentId. */
export function ApplicantView({ studentId }: { studentId: string }) {
  const query = useApplicant(studentId);
  const remind = useSendReminder();

  if (query.isPending) {
    return (
      <div className="flex flex-col gap-6">
        {backLink}
        <LoadingState variant="block" label="Loading application…" />
      </div>
    );
  }
  if (query.isError) {
    return (
      <div className="flex flex-col gap-6">
        {backLink}
        <ErrorState error={query.error} title="Couldn't load this application" onRetry={() => void query.refetch()} retrying={query.isFetching} />
      </div>
    );
  }

  const applicant = query.data;
  const personal = [
    { label: "Name", value: applicant.name },
    { label: "Email", value: applicant.email },
    { label: "Phone", value: applicant.phone },
  ];
  const summary = [
    { label: "Program", value: applicant.program },
    { label: "Application Date", value: applicant.applicationDate },
    { label: "Current Stage", value: `${applicant.stage} · ${applicant.progress}%` },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        {backLink}
        <Button
          variant="primary"
          className="px-4"
          disabled={remind.isPending}
          onClick={() =>
            remind.mutate(studentId, {
              onSuccess: () => toast.success(`Reminder email sent to ${applicant.name}`),
              onError: (error) => toast.error(error instanceof Error ? error.message : "Couldn't send the reminder."),
            })
          }
        >
          {remind.isPending ? "Sending…" : "Send Reminder Email"}
        </Button>
      </div>

      <h1 className="sr-only">Application from {applicant.name}</h1>

      <div className="flex flex-col gap-10">
        <div className="flex flex-col gap-6 lg:flex-row lg:gap-10">
          <Card as="section" className="flex flex-1 flex-col gap-4 p-6">
            <CardHeading icon="/admissions-routing/user-blue.svg">Personal Information</CardHeading>
            <dl className="grid gap-4 sm:grid-cols-2">
              {personal.map((f) => (
                <div key={f.label}>
                  <dt className="text-sm leading-5 text-gray-600">{f.label}</dt>
                  <dd className="text-base leading-6 font-medium break-words text-gray-900">{f.value}</dd>
                </div>
              ))}
            </dl>
          </Card>

          <Card as="section" className="flex flex-col gap-4 p-6 lg:w-[315px]">
            <CardHeading>Application Summary</CardHeading>
            <dl className="flex flex-col gap-3">
              {summary.map((f) => (
                <div key={f.label}>
                  <dt className="text-sm leading-5 text-gray-600">{f.label}</dt>
                  <dd className="text-sm leading-5 font-medium text-gray-900">{f.value}</dd>
                </div>
              ))}
            </dl>
          </Card>
        </div>

        <Card as="section" className="flex flex-col gap-4 p-6">
          <CardHeading icon="/admissions-routing/file-purple.svg">Application Responses</CardHeading>
          <dl className="flex flex-col gap-4">
            {applicant.responses.length === 0 && (
              <div>
                <dt className="sr-only">Responses</dt>
                <dd className="text-base leading-6 text-slate-500">This student hasn&apos;t submitted their profile answers yet.</dd>
              </div>
            )}
            {applicant.responses.map((r) => (
              <div key={r.question} className="flex flex-col gap-1">
                <dt className="text-base leading-5 text-heading">{r.question}</dt>
                <dd className="flex flex-col gap-2.5 rounded bg-gray-50 px-3 py-2.5 text-base leading-6 whitespace-pre-line text-heading">
                  {r.answer}
                </dd>
              </div>
            ))}
            <div className="mt-6 flex flex-col gap-1">
              <dt className="text-sm leading-5 font-medium text-gray-700">Constraints</dt>
              <dd className="rounded bg-gray-50 p-3 text-base leading-6 text-heading">{applicant.constraints}</dd>
            </div>
          </dl>
        </Card>
      </div>
      <Toaster />
    </div>
  );
}
