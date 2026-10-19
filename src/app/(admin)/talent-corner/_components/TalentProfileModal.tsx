"use client";

import { useId } from "react";
import { Award, ChevronDown, ExternalLink, Mail, MapPin } from "lucide-react";
import { Modal, ModalSection } from "@/components/ui/Modal";
import { Tag, TagList } from "@/components/ui/Tag";
import { ProgramLine } from "./TalentCard";
import type { Talent, TalentRequest } from "./data";

type Props = {
  talent: Talent | null;
  /** Source for the "Hired By" and "Role" options. */
  requests: TalentRequest[];
  onClose: () => void;
};

const fieldClasses =
  "h-[41px] w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-slate-900 focus:border-accent focus:outline-none";

function SelectField({ label, options }: { label: string; options: string[] }) {
  const id = useId();
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-sm leading-5 font-medium text-gray-700">
        {label}
      </label>
      <div className="relative">
        <select id={id} defaultValue="" className={`${fieldClasses} appearance-none pr-10`}>
          <option value="" disabled>
            Select an option
          </option>
          {options.map((o) => (
            <option key={o}>{o}</option>
          ))}
        </select>
        <ChevronDown
          aria-hidden
          className="pointer-events-none absolute top-1/2 right-3 size-5 -translate-y-1/2 text-slate-900"
          strokeWidth={2.5}
        />
      </div>
    </div>
  );
}

function DateField({ label }: { label: string }) {
  const id = useId();
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-sm leading-5 font-medium text-gray-700">
        {label}
      </label>
      <input id={id} type="date" className={fieldClasses} />
    </div>
  );
}

export function TalentProfileModal({ talent, requests, onClose }: Props) {
  if (!talent) return null;

  const companies = requests.map((r) => r.company);
  const roles = [...new Set(requests.flatMap((r) => r.roles.map((role) => role.title)))];

  return (
    <Modal
      open
      onClose={onClose}
      title={talent.name}
      subtitle={<ProgramLine talent={talent} />}
    >
      <ModalSection title="Contact Information">
        <ul className="flex flex-col gap-2 text-sm leading-5 text-ink">
          <li className="flex items-center gap-2">
            <Mail aria-hidden className="size-4 text-accent" strokeWidth={1.33} />
            <a href={`mailto:${talent.email}`} className="text-accent hover:underline">
              {talent.email}
            </a>
          </li>
          <li className="flex items-center gap-2">
            <span aria-hidden="true">📱</span>
            <span className="sr-only">Phone:</span>
            {talent.phone}
          </li>
          <li className="flex items-center gap-2">
            <MapPin aria-hidden className="size-4 text-muted" strokeWidth={1.33} />
            <span className="sr-only">Location:</span>
            {talent.location}
          </li>
        </ul>
      </ModalSection>

      <ModalSection title="Online Presence">
        <ul className="flex flex-col gap-2 text-sm leading-5">
          {talent.links.map((l) => (
            <li key={l.label}>
              <a
                href={l.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-accent hover:underline"
              >
                <ExternalLink aria-hidden className="size-4" strokeWidth={1.33} />
                {l.label}: {l.url}
                <span className="sr-only">(opens in a new tab)</span>
              </a>
            </li>
          ))}
        </ul>
      </ModalSection>

      <ModalSection title="Academic Performance">
        <dl className="grid gap-4 sm:grid-cols-2 sm:gap-8">
          {[
            { label: "Final Grade", value: `${talent.grade}%` },
            { label: "Projects Completed", value: talent.projectsCompleted },
          ].map((s) => (
            <div key={s.label} className="rounded-lg bg-gray-50 p-4">
              <dt className="text-sm leading-5 text-muted">{s.label}</dt>
              <dd className="text-2xl leading-8 font-bold text-accent">{s.value}</dd>
            </div>
          ))}
        </dl>
      </ModalSection>

      <ModalSection title="Technical Skills">
        <TagList label="Technical skills">
          {talent.skills.map((s) => (
            <Tag key={s} variant="soft">
              {s}
            </Tag>
          ))}
        </TagList>
      </ModalSection>

      <ModalSection title="Certifications">
        <ul className="flex flex-col gap-2">
          {talent.certifications.map((c) => (
            <li
              key={c}
              className="flex min-h-12 items-center gap-2 rounded-lg bg-success-soft px-3 py-2 text-base leading-6 text-success"
            >
              <Award aria-hidden className="size-[18px] shrink-0" strokeWidth={1.5} />
              {c}
            </li>
          ))}
        </ul>
      </ModalSection>

      {talent.job ? (
        <ModalSection title="Job Information">
          <ul className="flex flex-col gap-2 text-sm leading-5 text-slate-700">
            <li className="font-bold text-accent">{talent.job.company}</li>
            <li>{talent.job.role}</li>
            <li>{talent.job.date}</li>
          </ul>
        </ModalSection>
      ) : (
        <section aria-label="Hiring status" className="flex flex-col gap-6">
          <SelectField label="Has been Hired?" options={["Yes", "No"]} />
          <SelectField label="Hired By" options={companies} />
          <DateField label="Hire Date" />
          <SelectField label="Role" options={roles} />
        </section>
      )}
    </Modal>
  );
}
