"use client";

import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Modal, ModalSection } from "@/components/ui/Modal";
import { Pill } from "@/components/ui/Pill";
import { Tag, TagList } from "@/components/ui/Tag";
import { RequestStatusPill } from "./RequestCard";
import { longDate, totalPositions, type TalentRequest } from "./data";

type Props = {
  request: TalentRequest | null;
  onClose: () => void;
  onMarkFulfilled: (id: string) => void;
};

const caps = "text-xs leading-4 font-medium text-slate-700 uppercase";

function SkillGroup({ title, skills }: { title: string; skills: string[] }) {
  if (skills.length === 0) return null;
  return (
    <div className="flex flex-col gap-2">
      <h5 className={caps}>{title}</h5>
      <TagList label={title}>
        {skills.map((s) => (
          <Tag key={s} variant="plain">
            {s}
          </Tag>
        ))}
      </TagList>
    </div>
  );
}

export function RequestDetailsModal({ request, onClose, onMarkFulfilled }: Props) {
  if (!request) return null;

  const company = [
    { label: "Contact Person", value: request.contact },
    { label: "Location", value: request.location },
    {
      label: "Email",
      value: (
        <a href={`mailto:${request.email}`} className="text-primary hover:underline">
          {request.email}
        </a>
      ),
    },
    request.website
      ? {
          label: "Website",
          value: (
            <a
              href={request.website}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-primary hover:underline"
            >
              {request.website}
              <ExternalLink aria-hidden className="size-3.5" />
              <span className="sr-only">(opens in a new tab)</span>
            </a>
          ),
        }
      : null,
    { label: "Phone", value: request.phone },
    { label: "Employment Type", value: request.employmentType },
  ].filter((f) => f !== null);

  return (
    <Modal
      open
      onClose={onClose}
      title={request.company}
      titleClassName="text-slate-900"
      subtitle={<p className="text-base leading-6 text-slate-700">Talent Request Details</p>}
      footer={
        request.status === "pending" ? (
          <Button variant="primary" size="lg" className="w-full" onClick={() => onMarkFulfilled(request.id)}>
            Mark as Fulfilled
          </Button>
        ) : undefined
      }
    >
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg bg-slate-50 p-4">
        <dl className="flex flex-col gap-3">
          <div className="flex items-center gap-1">
            <dt className="text-sm leading-5 text-slate-700">Request ID:</dt>
            <dd className="text-base leading-6 text-slate-900">{request.code}</dd>
          </div>
          <div className="flex items-center gap-1">
            <dt className="text-sm leading-5 text-slate-700">Request Date:</dt>
            <dd className="text-base leading-6 text-slate-900">{longDate(request.requestedOn)}</dd>
          </div>
        </dl>
        <RequestStatusPill status={request.status} large />
      </div>

      <ModalSection title="Company Information">
        <dl className="grid gap-3 sm:grid-cols-2">
          {company.map((f) => (
            <div key={f.label} className="flex flex-col gap-1">
              <dt className={caps}>{f.label}</dt>
              <dd className="text-base leading-6 break-words text-slate-900">{f.value}</dd>
            </div>
          ))}
        </dl>
      </ModalSection>

      <ModalSection title="Description">
        <p className="rounded-lg bg-slate-50 p-3.5 text-base leading-6 text-slate-900">{request.description}</p>
      </ModalSection>

      <ModalSection title={`Role Requirements (${totalPositions(request)} total positions)`}>
        <ul className="flex flex-col gap-4">
          {request.roles.map((role) => (
            <li key={role.title} className="flex flex-col gap-3 rounded-lg border border-slate-100 p-4">
              <div className="flex flex-col gap-2">
                <h4 className="text-lg leading-7 font-semibold text-slate-900">{role.title}</h4>
                <div className="flex flex-wrap gap-2">
                  <Pill tone="teal" size="sm">
                    {role.level}
                  </Pill>
                  <Pill tone="neutral" size="sm">
                    {role.employment}
                  </Pill>
                  <Pill tone="primary" size="sm">
                    {role.positions} Positions
                  </Pill>
                </div>
              </div>
              <SkillGroup title="Required Skills" skills={role.requiredSkills} />
              <SkillGroup title="Nice to Have Skills" skills={role.niceToHaveSkills} />
            </li>
          ))}
        </ul>
      </ModalSection>
    </Modal>
  );
}
