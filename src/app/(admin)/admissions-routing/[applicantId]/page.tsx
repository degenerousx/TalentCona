import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { getApplicant, onboardingQueue } from "../_components/data";

type Props = { params: Promise<{ applicantId: string }> };

export function generateStaticParams() {
  return onboardingQueue.map((a) => ({ applicantId: a.id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const applicant = getApplicant((await params).applicantId);
  return { title: applicant ? `${applicant.name} · Admissions & Routing` : "Applicant not found" };
}

function CardHeading({ icon, children }: { icon?: string; children: React.ReactNode }) {
  return (
    <h2 className="flex items-center gap-2 text-lg leading-7 font-semibold text-gray-900">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {icon && <img src={icon} alt="" width={20} height={20} />}
      {children}
    </h2>
  );
}

export default async function ApplicantPage({ params }: Props) {
  const applicant = getApplicant((await params).applicantId);
  if (!applicant) notFound();

  const personal = [
    { label: "Name", value: applicant.name },
    { label: "Email", value: applicant.email },
    { label: "Phone", value: applicant.phone },
  ];
  const summary = [
    { label: "Program", value: applicant.program },
    { label: "Application Date", value: applicant.applicationDate },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Link
          href="/admissions-routing"
          className="rounded text-base leading-6 font-semibold text-slate-900 hover:text-primary"
        >
          <span aria-hidden="true">← </span>Back<span className="sr-only"> to Admissions &amp; Routing</span>
        </Link>
        <Button variant="primary" className="px-4">
          Send Reminder Email
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
            {applicant.responses.map((r) => (
              <div key={r.question} className="flex flex-col gap-1">
                <dt className="text-base leading-5 text-heading">{r.question}</dt>
                <dd className="flex flex-col gap-2.5 rounded bg-gray-50 px-3 py-2.5 text-base leading-6 text-heading">
                  {r.answer}
                  {r.note && <span className="text-sm leading-5 text-slate-500">{r.note}</span>}
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
    </div>
  );
}
