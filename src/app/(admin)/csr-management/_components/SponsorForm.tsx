"use client";

import { useState } from "react";
import { CAREER_PATHS, ENGAGEMENT, IMPACT_FOCUS, ORG_TYPES, type OrgType, type Sponsor, type SponsorshipType, type SponsorStatus } from "./data";
import { Btn, Field, Input, Select, TextArea } from "./ui";
import { Pick } from "./RequestEditor";

/** Everything an admin fills in to add or edit a sponsor. */
export type SponsorDraft = {
  name: string;
  orgType: OrgType;
  organizationType: string;
  status: SponsorStatus;
  type: SponsorshipType;
  contact: string;
  email: string;
  phone: string;
  country: string;
  stateCity: string;
  start: string;
  end: string;
  talents: string;
  pledged: string;
  received: string;
  activeSponsorships: string;
  careerPaths: string[];
  impactFocus: string[];
  engagement: string[];
  goals: string;
};

export const EMPTY_SPONSOR: SponsorDraft = {
  name: "", orgType: "Corporate", organizationType: "Corporate Organization", status: "Pending", type: "Full",
  contact: "", email: "", phone: "", country: "", stateCity: "", start: "", end: "",
  talents: "1", pledged: "", received: "0", activeSponsorships: "0",
  careerPaths: [], impactFocus: [], engagement: [], goals: "",
};

export const toDraft = (s: Sponsor): SponsorDraft => ({
  name: s.name, orgType: s.orgType, organizationType: s.application.organizationType, status: s.status, type: s.type,
  contact: s.contact, email: s.email, phone: s.application.phone, country: s.country, stateCity: s.application.stateCity,
  start: s.start, end: s.end, talents: String(s.talents), pledged: String(s.pledged), received: String(s.received),
  activeSponsorships: String(s.activeSponsorships), careerPaths: s.careerPaths, impactFocus: s.application.impactFocus,
  engagement: s.application.engagement, goals: s.application.goals,
});

/** Builds the sponsor (and the company-info record behind "View Company Info") from the form. */
export function fromDraft(d: SponsorDraft, id: string, previous?: Sponsor): Sponsor {
  const talents = Number(d.talents);
  return {
    id, name: d.name.trim(), orgType: d.orgType, type: d.type, status: d.status,
    contact: d.contact.trim(), email: d.email.trim(), country: d.country.trim(), start: d.start, end: d.end,
    talents, pledged: Number(d.pledged), received: Number(d.received || 0), activeSponsorships: Number(d.activeSponsorships || 0),
    careerPaths: d.careerPaths,
    application: {
      form: "Full Application",
      organizationType: d.organizationType, organizationName: d.name.trim(), contactPerson: d.contact.trim(),
      email: d.email.trim(), country: d.country.trim(), phone: d.phone.trim(), stateCity: d.stateCity.trim(),
      goals: d.goals.trim(), preference: d.type === "Full" ? "Full Sponsorship" : "Partial Sponsorship", talents,
      careerPaths: d.careerPaths, impactFocus: d.impactFocus, engagement: d.engagement,
      submittedAt: previous?.application.submittedAt ?? new Date().toISOString().slice(0, 10),
    },
  };
}

/** Field labels, for the "edited the sponsor" history entry. */
const LABELS: Record<keyof SponsorDraft, string> = {
  name: "Name", orgType: "Sponsor Type", organizationType: "Organization Type", status: "Status", type: "Sponsorship Type",
  contact: "Contact Person", email: "Email", phone: "Phone", country: "Country", stateCity: "State/City", start: "Start Date",
  end: "End Date", talents: "Talents", pledged: "Amount Pledged", received: "Amount Received", activeSponsorships: "Active Sponsorships",
  careerPaths: "Career Paths", impactFocus: "Impact Focus", engagement: "Engagement Options", goals: "Sponsorship Goals",
};
export const changedSponsorFields = (a: SponsorDraft, b: SponsorDraft) =>
  (Object.keys(LABELS) as (keyof SponsorDraft)[]).filter((k) => JSON.stringify(a[k]) !== JSON.stringify(b[k])).map((k) => LABELS[k]);

function validate(d: SponsorDraft, takenNames: string[]) {
  const num = (v: string) => v.trim() !== "" && Number.isFinite(Number(v)) && Number(v) >= 0;
  if (!d.name.trim()) return "Sponsor name is required.";
  if (takenNames.includes(d.name.trim().toLowerCase())) return "A sponsor with this name already exists.";
  if (!d.contact.trim()) return "Contact person is required.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email.trim())) return "Enter a valid email address.";
  if (!d.phone.trim()) return "Phone number is required.";
  if (!d.country.trim()) return "Country is required.";
  if (!d.start || !d.end) return "Start and end dates are required.";
  if (d.end < d.start) return "End date can't be before the start date.";
  if (!num(d.talents) || Number(d.talents) < 1) return "Number of talents must be at least 1.";
  if (!num(d.pledged) || Number(d.pledged) <= 0) return "Enter the amount pledged.";
  if (!num(d.received || "0")) return "Amount received must be 0 or more.";
  if (Number(d.received || 0) > Number(d.pledged)) return "Amount received can't be more than the amount pledged.";
  if (!num(d.activeSponsorships || "0")) return "Active sponsorships must be 0 or more.";
  if (!d.careerPaths.length) return "Choose at least one career path.";
  return null;
}

/** Add / edit sponsor form. Mock only: the parent keeps the result in local state. */
export function SponsorForm({
  initial,
  takenNames,
  submitLabel,
  onCancel,
  onSave,
}: {
  initial: SponsorDraft;
  /** Lower-case names of other sponsors, to prevent duplicates. */
  takenNames: string[];
  submitLabel: string;
  onCancel: () => void;
  onSave: (d: SponsorDraft) => void;
}) {
  const [d, setD] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const set = (p: Partial<SponsorDraft>) => setD((x) => ({ ...x, ...p }));

  return (
    <form
      noValidate
      className="flex flex-col gap-5"
      onSubmit={(e) => {
        e.preventDefault();
        const err = validate(d, takenNames);
        setError(err);
        if (!err) onSave(d);
      }}
    >
      <Group title="Sponsor">
        <Field label="Sponsor Name *">
          <Input value={d.name} onChange={(e) => set({ name: e.target.value })} placeholder="Organization or individual name" />
        </Field>
        <Field label="Sponsor Type *">
          <Select value={d.orgType} onChange={(e) => set({ orgType: e.target.value as OrgType })} options={["Corporate", "Individual"]} />
        </Field>
        <Field label="Organization Type">
          <Select value={d.organizationType} onChange={(e) => set({ organizationType: e.target.value })} options={[...ORG_TYPES]} />
        </Field>
        <Field label="Status *">
          <Select value={d.status} onChange={(e) => set({ status: e.target.value as SponsorStatus })} options={["Pending", "Active", "Completed"]} />
        </Field>
      </Group>
      <Group title="Contact Information">
        <Field label="Contact Person *">
          <Input value={d.contact} onChange={(e) => set({ contact: e.target.value })} placeholder="Full name" />
        </Field>
        <Field label="Email *">
          <Input type="email" value={d.email} onChange={(e) => set({ email: e.target.value })} placeholder="email@company.com" />
        </Field>
        <Field label="Phone *">
          <Input type="tel" value={d.phone} onChange={(e) => set({ phone: e.target.value })} placeholder="+234 800 000 0000" />
        </Field>
        <Field label="Country *">
          <Input value={d.country} onChange={(e) => set({ country: e.target.value })} placeholder="Nigeria" />
        </Field>
        <Field label="State/City">
          <Input value={d.stateCity} onChange={(e) => set({ stateCity: e.target.value })} placeholder="Lagos" />
        </Field>
      </Group>
      <Group title="Sponsorship">
        <Field label="Sponsorship Type *">
          <Select value={d.type} onChange={(e) => set({ type: e.target.value as SponsorshipType })} options={["Full", "Partial"]} />
        </Field>
        <Field label="Number of Talents *">
          <Input type="number" min={1} value={d.talents} onChange={(e) => set({ talents: e.target.value })} />
        </Field>
        <Field label="Start Date *">
          <Input type="date" value={d.start} onChange={(e) => set({ start: e.target.value })} />
        </Field>
        <Field label="End Date *">
          <Input type="date" value={d.end} onChange={(e) => set({ end: e.target.value })} />
        </Field>
        <Field label="Amount Pledged (USD) *">
          <Input type="number" min={0} value={d.pledged} onChange={(e) => set({ pledged: e.target.value })} placeholder="0.00" />
        </Field>
        <Field label="Amount Received (USD)">
          <Input type="number" min={0} value={d.received} onChange={(e) => set({ received: e.target.value })} placeholder="0.00" />
        </Field>
        <Field label="Active Sponsorships">
          <Input type="number" min={0} value={d.activeSponsorships} onChange={(e) => set({ activeSponsorships: e.target.value })} />
        </Field>
      </Group>
      <Pick label="Career Paths *" options={CAREER_PATHS} value={d.careerPaths} onChange={(careerPaths) => set({ careerPaths })} />
      <Pick label="Impact Focus" options={IMPACT_FOCUS} value={d.impactFocus} onChange={(impactFocus) => set({ impactFocus })} />
      <Pick label="Engagement Options" options={ENGAGEMENT} value={d.engagement} onChange={(engagement) => set({ engagement })} />
      <Field label="Sponsorship Goals">
        <TextArea value={d.goals} onChange={(e) => set({ goals: e.target.value })} placeholder="What does the sponsor want to achieve?" />
      </Field>
      {error && (
        <p role="alert" className="text-sm text-[#c10007]">
          {error}
        </p>
      )}
      <div className="flex justify-end gap-3 border-t border-[#e5e7eb] pt-5">
        <Btn variant="outline" onClick={onCancel}>
          Cancel
        </Btn>
        <Btn type="submit">{submitLabel}</Btn>
      </div>
    </form>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset>
      <legend className="mb-3 text-sm font-semibold text-[#101828]">{title}</legend>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">{children}</div>
    </fieldset>
  );
}
