"use client";

import { ArrowLeft, CheckCircle2, Mail, Pencil, Send } from "lucide-react";
import { Button } from "@/components/shadcn/button";
import { cn } from "@/lib/cn";
import { COHORTS, FUNDING_SOURCES, PROGRAMMES, naira, type FundingSource } from "./data";
import { Facts, Field, MockBanner, Section, SelectInput, SourcePill, Stepper, TextInput } from "./parts";
import { ActivationEmail } from "./Onboarding";

export type SingleStep = "form" | "errors" | "review" | "success";
type Go = (view: string) => void;

const STUDENT = {
  first: "Amaka",
  last: "Nwosu",
  email: "amaka.nwosu@example.com",
  phone: "+234 803 123 4567",
  gender: "Female",
  location: "Ikeja, Lagos, Nigeria",
  programme: PROGRAMMES[2],
  cohort: COHORTS[0],
  source: "Corporate Organisation" as FundingSource,
  sponsor: "Zenith Tech Ltd",
  amount: 38000000,
  reference: "ZTL-2026-0141",
  paidOn: "20 Nov 2026",
};

export function SingleStudent({ step, go }: { step: SingleStep; go: Go }) {
  const current = step === "review" ? 1 : step === "success" ? 2 : 0;
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4">
        <button onClick={() => go("overview")} className="inline-flex w-fit items-center gap-1.5 text-sm text-primary hover:underline">
          <ArrowLeft className="size-4" /> Back to CSR Management
        </button>
        <header className="flex flex-col gap-2">
          <h1 className="text-[28px] leading-[1.3] font-bold text-heading sm:text-[32px]">Add a Student</h1>
          <p className="text-base leading-5 text-slate-900">Create one student account, assign a programme and record who is paying.</p>
        </header>
        <Stepper steps={["Student details", "Review & create", "Done"]} current={current} />
        <MockBanner />
      </div>
      {step === "form" || step === "errors" ? <Form errors={step === "errors"} go={go} /> : step === "review" ? <Review go={go} /> : <Success go={go} />}
    </div>
  );
}

function Form({ errors, go }: { errors: boolean; go: Go }) {
  const s = STUDENT;
  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
      <div className="flex flex-col gap-6">
        {errors && (
          <div role="alert" className="rounded-lg border border-danger/30 bg-red-50 px-4 py-3 text-sm leading-5 text-red-800">
            <p className="font-semibold">Fix 3 fields to continue</p>
            <ul className="mt-1 list-disc pl-5">
              <li>Email address isn&apos;t valid</li>
              <li>Amount paid is required</li>
              <li>Sponsor or organisation name is required for Corporate Organisation</li>
            </ul>
          </div>
        )}

        <Section title="Personal details" description="The student signs in with this email. Everything else they can update later.">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="First name" required>
              <TextInput defaultValue={s.first} />
            </Field>
            <Field label="Last name" required>
              <TextInput defaultValue={s.last} />
            </Field>
            <Field label="Email address" required error={errors ? "Enter a valid email address, e.g. name@example.com" : undefined} hint="The activation email goes here">
              <TextInput type="email" defaultValue={errors ? "amaka.nwosu@example" : s.email} error={errors} />
            </Field>
            <Field label="Phone number">
              <TextInput defaultValue={s.phone} />
            </Field>
            <Field label="Gender">
              <SelectInput options={["Female", "Male", "Prefer not to say"]} defaultValue={s.gender} />
            </Field>
            <Field label="Location">
              <TextInput defaultValue={s.location} />
            </Field>
          </div>
        </Section>

        <Section title="Programme" description="The student is profiled for this programme and skips programme selection during onboarding.">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Programme" required>
              <SelectInput options={PROGRAMMES.map((p) => p.title)} defaultValue={s.programme.title} />
            </Field>
            <Field label="Cohort" required>
              <SelectInput options={COHORTS} defaultValue={s.cohort} />
            </Field>
          </div>
          <p className="mt-4 rounded-lg bg-gray-50 p-4 text-sm leading-5 text-gray-700">
            <span className="font-medium text-heading">{s.programme.title}</span> · {s.programme.school} · Programme fee <span className="font-medium text-heading">{naira(s.programme.fee)}</span>
          </p>
        </Section>

        <Section title="Payment & sponsorship" description="Who is paying for this student, and how much has been paid.">
          <fieldset>
            <legend className="mb-2 text-sm leading-5 font-medium text-gray-800">
              Funding source <span className="text-danger">*</span>
            </legend>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 2xl:grid-cols-4">
              {FUNDING_SOURCES.map((f) => {
                const on = f.id === s.source;
                return (
                  <label key={f.id} className={cn("flex cursor-pointer gap-3 rounded-lg border p-3.5 transition-colors", on ? "border-primary bg-primary-soft" : "border-gray-200 hover:border-gray-300")}>
                    <input type="radio" name="source" defaultChecked={on} className="mt-0.5 size-4 accent-[#302a91]" />
                    <span>
                      <span className="block text-sm leading-5 font-semibold text-heading">{f.id}</span>
                      <span className="block text-xs leading-4 text-gray-600">{f.hint}</span>
                    </span>
                  </label>
                );
              })}
            </div>
          </fieldset>
          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Sponsor / organisation name" required error={errors ? "Required for Corporate Organisation" : undefined} hint="Shown on the student's funding record and CSR reports">
              <TextInput defaultValue={errors ? "" : s.sponsor} placeholder="e.g. Zenith Tech Ltd" error={errors} />
            </Field>
            <Field label="Amount paid" required error={errors ? "Enter the amount paid for this student" : undefined} hint={`Programme fee: ${naira(s.programme.fee)}`}>
              <TextInput prefix="₦" defaultValue={errors ? "" : "380,000"} placeholder="0.00" error={errors} />
            </Field>
            <Field label="Payment reference" hint="Invoice, transfer or receipt number">
              <TextInput defaultValue={s.reference} />
            </Field>
            <Field label="Date paid">
              <TextInput defaultValue={s.paidOn} />
            </Field>
          </div>
        </Section>

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button variant="outline" className="h-10 px-5" onClick={() => go("overview")}>
            Cancel
          </Button>
          <Button className="h-10 px-5" onClick={() => go(errors ? "single" : "single-review")}>
            Review student
          </Button>
        </div>
      </div>

      <aside className="flex flex-col gap-4 xl:sticky xl:top-4 xl:self-start">
        <Section title="Summary">
          <div className="flex items-center gap-3">
            <span className="flex size-11 items-center justify-center rounded-full bg-accent-light text-sm font-semibold text-accent-deep">AN</span>
            <div>
              <p className="text-base leading-6 font-semibold text-heading">
                {s.first} {s.last}
              </p>
              <p className="text-sm text-gray-600">{errors ? "amaka.nwosu@example" : s.email}</p>
            </div>
          </div>
          <dl className="mt-5 flex flex-col gap-3 text-sm leading-5">
            <div className="flex justify-between gap-4">
              <dt className="text-gray-600">Programme</dt>
              <dd className="text-right font-medium text-heading">{s.programme.title}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-gray-600">Funding</dt>
              <dd>
                <SourcePill source={s.source} />
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-gray-600">Programme fee</dt>
              <dd className="font-medium text-heading">{naira(s.programme.fee)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-gray-600">Amount paid</dt>
              <dd className="font-medium text-heading">{errors ? "—" : naira(s.amount)}</dd>
            </div>
            <div className="flex justify-between gap-4 border-t border-gray-100 pt-3">
              <dt className="text-gray-600">Balance</dt>
              <dd className={cn("font-semibold", errors ? "text-gray-400" : "text-finance-positive")}>{errors ? "—" : "Fully paid"}</dd>
            </div>
          </dl>
        </Section>
        <div className="rounded-lg border border-gray-200 bg-white p-4 text-sm leading-5 text-gray-700 shadow-sm">
          <p className="flex items-center gap-2 font-semibold text-heading">
            <Mail className="size-4 text-primary" /> What happens next
          </p>
          <ol className="mt-2 list-decimal space-y-1 pl-5">
            <li>Amaka gets an activation email.</li>
            <li>She sets a password and verifies her account.</li>
            <li>She completes her profile and starts {s.programme.title}. Payment is already recorded.</li>
          </ol>
        </div>
      </aside>
    </div>
  );
}

function Review({ go }: { go: Go }) {
  const s = STUDENT;
  const edit = (
    <Button variant="ghost" size="sm" onClick={() => go("single")} className="text-primary">
      <Pencil /> Edit
    </Button>
  );
  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
      <div className="flex flex-col gap-6">
        <Section title="Personal details" action={edit}>
          <Facts rows={[["Full name", `${s.first} ${s.last}`], ["Email", s.email], ["Phone", s.phone], ["Gender", s.gender], ["Location", s.location]]} />
        </Section>
        <Section title="Programme" action={edit}>
          <Facts rows={[["Programme", s.programme.title], ["School", s.programme.school], ["Cohort", s.cohort], ["Programme fee", naira(s.programme.fee)]]} />
        </Section>
        <Section title="Payment & sponsorship" action={edit}>
          <Facts
            rows={[
              ["Funding source", <SourcePill key="s" source={s.source} />],
              ["Sponsor / organisation", s.sponsor],
              ["Amount paid", naira(s.amount)],
              ["Balance", <span key="b" className="text-finance-positive">Fully paid</span>],
              ["Payment reference", s.reference],
              ["Date paid", s.paidOn],
            ]}
          />
        </Section>
        <label className="flex items-start gap-3 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <input type="checkbox" defaultChecked className="mt-0.5 size-4 accent-[#302a91]" />
          <span className="text-sm leading-5">
            <span className="block font-medium text-heading">Send the activation email now</span>
            <span className="text-gray-600">Untick to create the account quietly and send the invitation later from the student list.</span>
          </span>
        </label>
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button variant="outline" className="h-10 px-5" onClick={() => go("single")}>
            Back
          </Button>
          <Button className="h-10 px-5" onClick={() => go("single-success")}>
            Create student &amp; send email
          </Button>
        </div>
      </div>
      <aside className="flex flex-col gap-3">
        <p className="text-sm leading-5 font-semibold text-heading">Email preview</p>
        <ActivationEmail name={s.first} programme={s.programme.title} sponsor={s.sponsor} />
      </aside>
    </div>
  );
}

function Success({ go }: { go: Go }) {
  const s = STUDENT;
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col items-center gap-6 rounded-lg border border-gray-200 bg-white px-6 py-10 text-center shadow-sm sm:px-10">
      <span className="flex size-16 items-center justify-center rounded-full bg-success-soft">
        <CheckCircle2 className="size-9 text-success" />
      </span>
      <div>
        <h2 className="text-2xl leading-8 font-bold text-heading">Student created</h2>
        <p className="mt-2 text-base leading-6 text-gray-600">
          {s.first} {s.last} is enrolled in <span className="font-medium text-heading">{s.programme.title}</span> ({s.cohort}), funded by {s.sponsor}.
        </p>
      </div>
      <p className="flex items-center gap-2 rounded-full bg-info-soft px-4 py-2 text-sm text-info">
        <Send className="size-4" /> Activation email sent to {s.email}
      </p>
      <div className="w-full rounded-lg bg-gray-50 p-5 text-left">
        <p className="text-sm leading-5 font-semibold text-heading">Onboarding status</p>
        <ol className="mt-3 flex flex-col gap-3 text-sm leading-5">
          {[
            ["Account created", "Just now", true],
            ["Activation email sent", "Just now", true],
            ["Student activates account", "Waiting · link valid for 7 days", false],
            ["Completes profile & starts programme", "After activation", false],
          ].map(([label, when, done]) => (
            <li key={label as string} className="flex items-start gap-3">
              <span className={cn("mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full", done ? "bg-success text-white" : "border-2 border-gray-300 bg-white")}>
                {done && <CheckCircle2 className="size-3.5" />}
              </span>
              <span>
                <span className="block font-medium text-heading">{label}</span>
                <span className="text-gray-500">{when}</span>
              </span>
            </li>
          ))}
        </ol>
      </div>
      <div className="flex w-full flex-col gap-3 sm:flex-row sm:justify-center">
        <Button variant="outline" className="h-10 px-5" onClick={() => go("overview")}>
          View in student list
        </Button>
        <Button className="h-10 px-5" onClick={() => go("single")}>
          Add another student
        </Button>
      </div>
    </div>
  );
}
