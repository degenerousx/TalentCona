"use client";

import { useId, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/cn";
import { schools, type ProgramDraft } from "./data";
import { Field, ImageDrop, ListEditor, Select, TextArea, TextInput } from "./FormFields";

/**
 * "Create New Program" / "Edit Program" — three steps with a progress bar
 * (Figma 293:23199 – 293:24878). Nothing is saved yet: both actions return to
 * the programs list until the API exists.
 */

const steps = ["Basic Details", "More Details", "Pricing"] as const;

function Panel({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-col gap-6 rounded-lg border border-gray-200 bg-white p-6">{children}</div>;
}

export function ProgramWizard({ mode, initial }: { mode: "create" | "edit"; initial: ProgramDraft }) {
  const router = useRouter();
  const formId = useId();
  const coverId = useId();
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState(initial);
  const last = step === steps.length - 1;

  const set =
    <K extends keyof ProgramDraft>(key: K) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setDraft({ ...draft, [key]: e.target.value });

  const finish = () => router.push("/manage-programs");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (last) finish();
    else setStep(step + 1);
  };

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-[28px] leading-[1.3] font-bold text-slate-900 sm:text-[32px]">
        <Link
          href="/manage-programs"
          className="inline-flex items-center gap-2 rounded hover:text-primary"
          aria-label={`Back to Manage Programs — ${mode === "create" ? "Create New Program" : "Edit Program"}`}
        >
          <ArrowLeft aria-hidden className="size-7" />
          {mode === "create" ? "Create New Program" : "Edit Program"}
        </Link>
      </h1>

      {/* Step progress */}
      <nav aria-label="Program setup steps" className="flex flex-col gap-2">
        <div
          role="progressbar"
          aria-label="Setup progress"
          aria-valuemin={1}
          aria-valuemax={steps.length}
          aria-valuenow={step + 1}
          aria-valuetext={`Step ${step + 1} of ${steps.length}: ${steps[step]}`}
          className="h-2 overflow-hidden rounded-full bg-white"
        >
          <div
            className="h-full rounded-full bg-success transition-[width]"
            style={{ width: `${((step + 1) / steps.length) * 100}%` }}
          />
        </div>
        <ol className="flex justify-between text-sm leading-5">
          {steps.map((label, i) => (
            <li key={label}>
              <button
                type="button"
                disabled={i > step}
                onClick={() => setStep(i)}
                aria-current={i === step ? "step" : undefined}
                className={cn(
                  "rounded disabled:cursor-default",
                  i === step ? "text-primary" : i < step ? "text-slate-900 hover:underline" : "text-slate-700",
                )}
              >
                {label}
              </button>
            </li>
          ))}
        </ol>
      </nav>

      <form id={formId} onSubmit={submit} className="flex flex-col gap-6">
        {step === 0 && (
          <Panel>
            <Field label="School" required>
              {(id) => (
                <Select
                  id={id}
                  required
                  value={draft.school}
                  onChange={set("school")}
                  options={schools.map((s) => s.name)}
                  placeholder="Select a school"
                />
              )}
            </Field>
            <Field label="Program Title" required>
              {(id) => (
                <TextInput
                  id={id}
                  required
                  value={draft.title}
                  onChange={set("title")}
                  placeholder="Full-Stack Development"
                />
              )}
            </Field>
            <Field label="Description" required>
              {(id) => (
                <TextArea
                  id={id}
                  required
                  value={draft.description}
                  onChange={set("description")}
                  placeholder="Brief description of the program"
                />
              )}
            </Field>
            <Field label="Duration" required>
              {(id) => (
                <TextInput id={id} required value={draft.duration} onChange={set("duration")} placeholder="6 months" />
              )}
            </Field>
            <div className="flex flex-col gap-2">
              <span className="text-sm leading-5 text-gray-900">Cover Image *</span>
              <ImageDrop id={coverId} />
            </div>
          </Panel>
        )}

        {step === 1 && (
          <>
            <Panel>
              <Field label="About This Program" required>
                {(id) => (
                  <TextArea
                    id={id}
                    required
                    value={draft.about}
                    onChange={set("about")}
                    placeholder="Brief description of the program"
                  />
                )}
              </Field>
            </Panel>
            <Panel>
              <ListEditor
                label="What You'll Get"
                items={draft.whatYoullGet}
                onChange={(whatYoullGet) => setDraft({ ...draft, whatYoullGet })}
              />
            </Panel>
            <Panel>
              <ListEditor
                label="What You'll Learn"
                items={draft.whatYoullLearn}
                onChange={(whatYoullLearn) => setDraft({ ...draft, whatYoullLearn })}
              />
            </Panel>
            <Panel>
              <ListEditor
                label="Expected Outcomes"
                items={draft.outcomes}
                onChange={(outcomes) => setDraft({ ...draft, outcomes })}
              />
            </Panel>
          </>
        )}

        {step === 2 && (
          <Panel>
            <Field label="Program Fee" required>
              {(id) => (
                <TextInput
                  id={id}
                  required
                  inputMode="numeric"
                  value={draft.fee}
                  onChange={set("fee")}
                  placeholder="₦ 0"
                />
              )}
            </Field>
            <Field label="Enable Discount" required>
              {(id) => (
                <Select
                  id={id}
                  required
                  value={draft.discountEnabled}
                  onChange={set("discountEnabled")}
                  options={["Yes", "No"]}
                />
              )}
            </Field>
            <Field label="% Discount" required={draft.discountEnabled === "Yes"}>
              {(id) => (
                <TextInput
                  id={id}
                  type="number"
                  min={0}
                  max={100}
                  required={draft.discountEnabled === "Yes"}
                  disabled={draft.discountEnabled !== "Yes"}
                  value={draft.discount}
                  onChange={set("discount")}
                  className="disabled:bg-gray-50"
                />
              )}
            </Field>
          </Panel>
        )}

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={finish}
            className="h-11 rounded-lg border border-gray-300 bg-white px-6 text-sm leading-5 font-semibold text-gray-700 hover:bg-gray-50"
          >
            Save as Draft
          </button>
          <button
            type="submit"
            className="h-11 rounded-lg bg-primary px-6 text-sm leading-5 font-semibold text-white hover:bg-primary/90"
          >
            {last ? "Publish Program" : "Continue"}
          </button>
        </div>
      </form>
    </div>
  );
}
