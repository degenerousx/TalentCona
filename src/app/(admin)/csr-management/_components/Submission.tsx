"use client";

import type { Submission } from "./data";
import { InfoTile, PathChip } from "./ui";

/** Everything a sponsor submitted on talentcona.com/sponsor-talent, as label/value tiles. */
export function SubmissionDetails({ s }: { s: Submission }) {
  if (s.form === "Quick Sponsor Request") {
    return (
      <div className="flex flex-col gap-5">
        <Source form={s.form} at={s.submittedAt} />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <InfoTile label="First name">{s.firstName}</InfoTile>
          <InfoTile label="Last name">{s.lastName}</InfoTile>
          <InfoTile label="Email">{s.email}</InfoTile>
          <InfoTile label="Phone number">{s.phone}</InfoTile>
        </div>
        <Chips label="Area of Interest" items={[s.areaOfInterest]} />
        <InfoTile label="Additional information">{s.additionalInfo || "None provided"}</InfoTile>
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-5">
      <Source form={s.form} at={s.submittedAt} />
      <Group title="Contact Information">
        <InfoTile label="Organization Type">{s.organizationType}</InfoTile>
        <InfoTile label="Organization Name">{s.organizationName}</InfoTile>
        <InfoTile label="Contact Person">{s.contactPerson}</InfoTile>
        <InfoTile label="Email Address">{s.email}</InfoTile>
        <InfoTile label="Country">{s.country}</InfoTile>
        <InfoTile label="Phone Number">{s.phone}</InfoTile>
        <InfoTile label="State/City">{s.stateCity}</InfoTile>
      </Group>
      <div>
        <h3 className="mb-3 text-sm font-semibold text-[#101828]">Sponsorship Goals</h3>
        <p className="rounded-[12px] bg-[#f9fafb] p-3 text-sm leading-5 text-[#364153]">{s.goals}</p>
      </div>
      <Group title="Sponsorship Preference">
        <InfoTile label="Type of sponsorship">{s.preference}</InfoTile>
        <InfoTile label="Number of Talents to Sponsor">{s.talents}</InfoTile>
      </Group>
      <Chips label="Career Path Interest" items={s.careerPaths} />
      <Chips label="Impact Focus" items={s.impactFocus} />
      <Chips label="Engagement Options" items={s.engagement} />
    </div>
  );
}

function Source({ form, at }: { form: string; at: string }) {
  return (
    <p className="rounded-[12px] border border-[#dbeafe] bg-[#eff6ff] p-3 text-xs leading-4 text-[#1447e6]">
      Submitted through the website&apos;s <strong>{form}</strong> form on {at}.
    </p>
  );
}
function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="mb-3 text-sm font-semibold text-[#101828]">{title}</h3>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">{children}</div>
    </div>
  );
}
export function Chips({ label, items }: { label: string; items: string[] }) {
  return (
    <div>
      <p className="text-xs leading-4 text-[#6a7282]">{label}</p>
      <div className="mt-1.5 flex flex-wrap gap-2">
        {items.map((i) => (
          <PathChip key={i} strong>
            {i}
          </PathChip>
        ))}
      </div>
    </div>
  );
}
