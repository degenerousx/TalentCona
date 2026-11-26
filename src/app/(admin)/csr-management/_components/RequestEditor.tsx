"use client";

import { useState } from "react";
import { Lock } from "lucide-react";
import { cn } from "@/lib/cn";
import { CAREER_PATHS, ENGAGEMENT, IMPACT_FOCUS, ORG_TYPES, type FullApplication, type QuickRequest, type Submission } from "./data";
import { Btn, Field, Input, Select, TextArea } from "./ui";

/**
 * "Edit Information" form for a sponsorship request. Every field the sponsor
 * submitted can be corrected except the company / sponsor name, which is shown
 * locked. Mock only: the parent keeps the result in local state.
 */
export function RequestEditor({ value, onCancel, onSave }: { value: Submission; onCancel: () => void; onSave: (next: Submission) => void }) {
  const [draft, setDraft] = useState<Submission>(value);
  const [error, setError] = useState<string | null>(null);

  const save = () => {
    const email = draft.email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return setError("Enter a valid email address.");
    if (!draft.phone.trim()) return setError("Phone number is required.");
    if (draft.form === "Full Application") {
      if (!draft.contactPerson.trim()) return setError("Contact person is required.");
      if (!(draft.talents >= 1)) return setError("Number of talents must be at least 1.");
      if (!draft.careerPaths.length) return setError("Choose at least one career path.");
    }
    onSave({ ...draft, email });
  };

  return (
    <form
      className="flex flex-col gap-5"
      onSubmit={(e) => {
        e.preventDefault();
        save();
      }}
      noValidate
    >
      {draft.form === "Full Application" ? (
        <FullFields d={draft} set={(p) => setDraft({ ...draft, ...p })} />
      ) : (
        <QuickFields d={draft} set={(p) => setDraft({ ...draft, ...p })} />
      )}
      {error && (
        <p role="alert" className="text-sm text-[#c10007]">
          {error}
        </p>
      )}
      <div className="flex justify-end gap-3 border-t border-[#e5e7eb] pt-5">
        <Btn variant="outline" onClick={onCancel}>
          Cancel
        </Btn>
        <Btn type="submit">Save</Btn>
      </div>
    </form>
  );
}

function Locked({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-sm leading-5 font-medium text-[#364153]">{label}</span>
      <div className="flex items-center justify-between rounded-[8px] border border-[#e5e7eb] bg-[#f9fafb] px-3 py-2.5 text-sm text-[#6a7282]" aria-readonly="true">
        {value}
        <Lock className="size-3.5" aria-label="Can't be changed" />
      </div>
    </div>
  );
}

function FullFields({ d, set }: { d: FullApplication; set: (p: Partial<FullApplication>) => void }) {
  return (
    <>
      <Section title="Contact Information">
        <Locked label="Organization Name" value={d.organizationName} />
        <Field label="Organization Type">
          <Select value={d.organizationType} onChange={(e) => set({ organizationType: e.target.value })} options={[...ORG_TYPES]} />
        </Field>
        <Field label="Contact Person (Full Name)">
          <Input value={d.contactPerson} onChange={(e) => set({ contactPerson: e.target.value })} />
        </Field>
        <Field label="Email Address">
          <Input type="email" value={d.email} onChange={(e) => set({ email: e.target.value })} />
        </Field>
        <Field label="Country">
          <Input value={d.country} onChange={(e) => set({ country: e.target.value })} />
        </Field>
        <Field label="Phone Number">
          <Input type="tel" value={d.phone} onChange={(e) => set({ phone: e.target.value })} />
        </Field>
        <Field label="State/City">
          <Input value={d.stateCity} onChange={(e) => set({ stateCity: e.target.value })} />
        </Field>
      </Section>
      <Field label="Sponsorship Goals">
        <TextArea value={d.goals} onChange={(e) => set({ goals: e.target.value })} />
      </Field>
      <Section title="Sponsorship Preference">
        <Field label="Type of sponsorship">
          <Select value={d.preference} onChange={(e) => set({ preference: e.target.value as FullApplication["preference"] })} options={["Full Sponsorship", "Partial Sponsorship"]} />
        </Field>
        <Field label="Number of Talents to Sponsor">
          <Input type="number" min={1} value={d.talents} onChange={(e) => set({ talents: Number(e.target.value) })} />
        </Field>
      </Section>
      <Pick label="Career Path Interest" options={CAREER_PATHS} value={d.careerPaths} onChange={(careerPaths) => set({ careerPaths })} />
      <Pick label="Impact Focus" options={IMPACT_FOCUS} value={d.impactFocus} onChange={(impactFocus) => set({ impactFocus })} />
      <Pick label="Engagement Options" options={ENGAGEMENT} value={d.engagement} onChange={(engagement) => set({ engagement })} />
    </>
  );
}

function QuickFields({ d, set }: { d: QuickRequest; set: (p: Partial<QuickRequest>) => void }) {
  return (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Locked label="First name" value={d.firstName} />
        <Locked label="Last name" value={d.lastName} />
        <Field label="Email">
          <Input type="email" value={d.email} onChange={(e) => set({ email: e.target.value })} />
        </Field>
        <Field label="Phone number">
          <Input type="tel" value={d.phone} onChange={(e) => set({ phone: e.target.value })} />
        </Field>
      </div>
      <Locked label="Area of Interest" value={d.areaOfInterest} />
      <Field label="Additional information">
        <TextArea value={d.additionalInfo} onChange={(e) => set({ additionalInfo: e.target.value })} placeholder="Please add any additional information..." />
      </Field>
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset>
      <legend className="mb-3 text-sm font-semibold text-[#101828]">{title}</legend>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">{children}</div>
    </fieldset>
  );
}

/** Multi-select as toggle chips (the website uses checkboxes). */
export function Pick({ label, options, value, onChange }: { label: string; options: readonly string[]; value: string[]; onChange: (v: string[]) => void }) {
  return (
    <fieldset>
      <legend className="mb-2 text-sm leading-5 font-medium text-[#364153]">{label}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => {
          const on = value.includes(o);
          return (
            <button
              key={o}
              type="button"
              aria-pressed={on}
              onClick={() => onChange(on ? value.filter((v) => v !== o) : [...value, o])}
              className={cn("rounded-full border px-3 py-1 text-xs leading-4 font-medium", on ? "border-[#e9d4ff] bg-[#faf5ff] text-[#8200db]" : "border-[#e5e7eb] bg-white text-[#4a5565] hover:bg-slate-50")}
            >
              {o}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
