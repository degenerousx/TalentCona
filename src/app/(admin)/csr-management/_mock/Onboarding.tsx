"use client";

import { ArrowLeft, BookOpen, CheckCircle2, Eye, Lock, Mail, MousePointerClick, PlayCircle, UserPlus } from "lucide-react";
import { cn } from "@/lib/cn";
import { MockBanner } from "./parts";

/** The email a newly created student receives (mock). */
export function ActivationEmail({ name, programme, sponsor }: { name: string; programme: string; sponsor: string }) {
  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
      <div className="border-b border-gray-100 bg-gray-50 px-4 py-3 text-xs leading-5 text-gray-600">
        <p>
          <span className="text-gray-400">From:</span> TalentCona &lt;hello@talentcona.com&gt;
        </p>
        <p>
          <span className="text-gray-400">Subject:</span> <span className="font-medium text-heading">Your TalentCona place is ready: activate your account</span>
        </p>
      </div>
      <div className="px-6 py-6">
        <p className="text-lg font-bold text-primary">Talent Cona</p>
        <h3 className="mt-4 text-xl leading-7 font-bold text-heading">Welcome, {name}! 🎉</h3>
        <p className="mt-3 text-sm leading-6 text-gray-700">
          You&apos;ve been enrolled in <strong className="text-heading">{programme}</strong>. Your place is sponsored by <strong className="text-heading">{sponsor}</strong>, so there&apos;s nothing to pay.
        </p>
        <p className="mt-3 text-sm leading-6 text-gray-700">Activate your account to set your password and start learning:</p>
        <span className="mt-5 inline-flex h-11 items-center rounded-md bg-primary px-6 text-sm font-semibold text-white">Activate my account</span>
        <p className="mt-5 text-xs leading-5 text-gray-500">
          This link expires in 7 days. If it expires, ask your programme coordinator to resend it. Didn&apos;t expect this email? You can ignore it.
        </p>
      </div>
    </div>
  );
}

const JOURNEY = [
  { icon: UserPlus, title: "Admin creates the student", body: "One at a time, or in bulk from Excel. Programme and payment are recorded.", who: "Admin" },
  { icon: Mail, title: "Activation email", body: "The student receives a personal link, valid for 7 days. Admins can resend it.", who: "System" },
  { icon: Lock, title: "Activate & verify", body: "The student opens the link, confirms their email and sets a password.", who: "Student" },
  { icon: MousePointerClick, title: "Sign in & complete profile", body: "The usual onboarding, without programme selection or payment: those are already done.", who: "Student" },
  { icon: PlayCircle, title: "Start the programme", body: "The dashboard opens on the assigned programme and cohort. Mentor matching follows as usual.", who: "Student" },
];

export function Onboarding({ go }: { go: (v: string) => void }) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4">
        <button onClick={() => go("overview")} className="inline-flex w-fit items-center gap-1.5 text-sm text-primary hover:underline">
          <ArrowLeft className="size-4" /> Back to CSR Management
        </button>
        <header className="flex flex-col gap-2">
          <h1 className="text-[28px] leading-[1.3] font-bold text-heading sm:text-[32px]">Student Onboarding Journey</h1>
          <p className="text-base leading-5 text-slate-900">What a student created by an admin sees, from the email to their first lesson.</p>
        </header>
        <MockBanner />
      </div>

      <ol className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {JOURNEY.map((j, i) => (
          <li key={j.title} className="relative flex flex-col gap-3 rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="flex size-10 items-center justify-center rounded-full bg-primary-soft text-primary">
                <j.icon className="size-5" />
              </span>
              <span className="text-xs font-medium text-gray-400">Step {i + 1}</span>
            </div>
            <p className="text-base leading-6 font-semibold text-heading">{j.title}</p>
            <p className="text-sm leading-5 text-gray-600">{j.body}</p>
            <span className={cn("mt-auto w-fit rounded-full px-2.5 py-0.5 text-xs font-medium", j.who === "Admin" ? "bg-primary-soft text-primary" : j.who === "System" ? "bg-info-soft text-info" : "bg-teal-soft text-teal")}>{j.who}</span>
          </li>
        ))}
      </ol>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Screen n={1} title="The email">
          <ActivationEmail name="Amaka" programme="UI/UX Design" sponsor="Zenith Tech Ltd" />
        </Screen>
        <Screen n={2} title="Activate & set password">
          <StudentFrame url="talentcona.com/activate">
            <h3 className="text-xl leading-7 font-bold text-heading">Activate your account</h3>
            <p className="mt-1 text-sm text-gray-600">Set a password to finish setting up your TalentCona account.</p>
            <p className="mt-4 flex items-center gap-2 rounded-md bg-success-soft px-3 py-2 text-xs text-success">
              <CheckCircle2 className="size-4" /> Email verified: amaka.nwosu@example.com
            </p>
            <MockInput label="Create password" value="••••••••••" icon />
            <ul className="mt-2 space-y-1 text-xs text-gray-600">
              <li className="text-success">✓ At least 8 characters</li>
              <li className="text-success">✓ One number</li>
              <li className="text-gray-400">○ One special character</li>
            </ul>
            <MockInput label="Confirm password" value="••••••••••" icon />
            <span className="mt-5 flex h-11 w-full items-center justify-center rounded-md bg-primary text-sm font-semibold text-white">Activate account</span>
            <p className="mt-3 text-center text-xs text-red-600">Link expired? You&apos;ll see “This link has expired” and a button to request a new one.</p>
          </StudentFrame>
        </Screen>
        <Screen n={3} title="Sign in, then continue">
          <StudentFrame url="talentcona.com/dashboard">
            <p className="text-sm text-gray-600">Welcome back,</p>
            <h3 className="text-xl leading-7 font-bold text-heading">Amaka 👋</h3>
            <div className="mt-4 rounded-lg border border-gray-200 p-4">
              <p className="text-xs font-medium tracking-wide text-gray-500 uppercase">Your programme</p>
              <p className="mt-1 text-base font-semibold text-heading">UI/UX Design</p>
              <p className="text-xs text-gray-600">Cohort 4 · Jan 2027 · Sponsored by Zenith Tech Ltd</p>
              <div className="mt-3 h-2 rounded-full bg-gray-100">
                <div className="h-2 w-[8%] rounded-full bg-primary" />
              </div>
              <p className="mt-1 text-xs text-gray-500">Profile 2 of 3 steps done</p>
            </div>
            <ul className="mt-4 space-y-2 text-sm">
              <li className="flex items-center gap-2 text-gray-500 line-through">
                <CheckCircle2 className="size-4 text-success" /> Choose a programme
              </li>
              <li className="flex items-center gap-2 text-gray-500 line-through">
                <CheckCircle2 className="size-4 text-success" /> Payment
              </li>
              <li className="flex items-center gap-2 font-medium text-heading">
                <Eye className="size-4 text-primary" /> Complete your profile
              </li>
            </ul>
            <span className="mt-5 flex h-11 w-full items-center justify-center gap-2 rounded-md bg-primary text-sm font-semibold text-white">
              <BookOpen className="size-4" /> Continue to your programme
            </span>
          </StudentFrame>
        </Screen>
      </div>
    </div>
  );
}

function Screen({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm leading-5 font-semibold text-heading">
        <span className="mr-2 inline-flex size-6 items-center justify-center rounded-full bg-primary text-xs text-white">{n}</span>
        {title}
      </p>
      {children}
    </div>
  );
}

function StudentFrame({ url, children }: { url: string; children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
      <div className="flex items-center gap-2 border-b border-gray-100 bg-gray-50 px-3 py-2">
        <span className="size-2.5 rounded-full bg-red-300" />
        <span className="size-2.5 rounded-full bg-yellow-300" />
        <span className="size-2.5 rounded-full bg-green-300" />
        <span className="ml-2 truncate rounded bg-white px-2 py-0.5 text-xs text-gray-500">{url}</span>
      </div>
      <div className="px-6 py-6">{children}</div>
    </div>
  );
}

function MockInput({ label, value, icon }: { label: string; value: string; icon?: boolean }) {
  return (
    <div className="mt-4">
      <p className="text-sm font-medium text-gray-800">{label}</p>
      <div className="mt-1.5 flex h-11 items-center justify-between rounded-md border border-gray-300 px-3 text-sm tracking-[0.2em] text-gray-600">
        {value}
        {icon && <Eye className="size-4 text-gray-400" />}
      </div>
    </div>
  );
}
