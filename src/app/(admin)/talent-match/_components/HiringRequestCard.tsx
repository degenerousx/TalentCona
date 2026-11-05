import { Briefcase, Building2, Calendar, CircleCheck, Clock, ExternalLink, Mail, MapPin, Phone, Sparkles, Users } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Pill } from "@/components/ui/Pill";
import { Tag, TagList } from "@/components/ui/Tag";
import { requestStatusLabel, shortDate, type HiringRequest, type RequestStatus } from "./data";

export function RequestStatusPill({ status }: { status: RequestStatus }) {
  const open = status === "open";
  const Icon = open ? Clock : CircleCheck;
  return (
    <Pill tone={open ? "warning" : "success"} icon={<Icon aria-hidden className="size-3.5" strokeWidth={1.17} />}>
      {requestStatusLabel[status]}
    </Pill>
  );
}

const iconProps = { "aria-hidden": true, className: "size-4 shrink-0 text-muted", strokeWidth: 1.33 } as const;
const caps = "text-xs leading-4 font-medium text-muted uppercase";

type HiringRequestCardProps = {
  request: HiringRequest;
  /** Names of the talents confirmed for this request. */
  matchedTalents: string[];
  onMatch: () => void;
};

export function HiringRequestCard({ request, matchedTalents, onMatch }: HiringRequestCardProps) {
  return (
    <Card as="li" tone="hairline" className="flex flex-col gap-4 p-6">
      <div className="flex items-start gap-4">
        <span aria-hidden="true" className="grid size-14 shrink-0 place-items-center rounded-lg bg-purple-100">
          <Building2 className="size-7 text-accent" strokeWidth={2.33} />
        </span>
        <div className="flex min-w-0 flex-1 flex-wrap items-start justify-between gap-2">
          <div className="flex min-w-0 flex-col gap-0.5">
            <h3 className="text-lg leading-7 font-semibold text-ink">{request.organization}</h3>
            <p className="text-sm leading-5 text-slate-500">{request.contactName}</p>
          </div>
          <RequestStatusPill status={request.status} />
        </div>
      </div>

      <dl className="grid gap-3 text-sm leading-5 text-slate-900 sm:grid-cols-2 sm:gap-x-8">
        <div className="flex items-center gap-2">
          <dt><Mail {...iconProps} /><span className="sr-only">Email</span></dt>
          <dd className="min-w-0 truncate">
            <a href={`mailto:${request.email}`} className="text-primary hover:underline">{request.email}</a>
          </dd>
        </div>
        {request.phone && (
          <div className="flex items-center gap-2">
            <dt><Phone {...iconProps} /><span className="sr-only">Phone</span></dt>
            <dd>{request.phone}</dd>
          </div>
        )}
        <div className="flex items-center gap-2">
          <dt><MapPin {...iconProps} /><span className="sr-only">Location</span></dt>
          <dd>{request.location}</dd>
        </div>
        <div className="flex items-center gap-2">
          <dt><Briefcase {...iconProps} /><span className="sr-only">Employment type and work mode</span></dt>
          <dd>{request.employmentType} · {request.workMode}</dd>
        </div>
        <div className="flex items-center gap-2">
          <dt className="flex items-center gap-2 text-slate-500"><Calendar {...iconProps} />Requested:</dt>
          <dd>{shortDate(request.submittedAt)}</dd>
        </div>
        {request.deadline && (
          <div className="flex items-center gap-2">
            <dt className="flex items-center gap-2 text-slate-500"><Clock {...iconProps} />Deadline:</dt>
            <dd className="font-medium text-warning">{shortDate(request.deadline)}</dd>
          </div>
        )}
        {request.website && (
          <div className="flex items-center gap-2">
            <dt><ExternalLink {...iconProps} /><span className="sr-only">Website</span></dt>
            <dd className="min-w-0 truncate">
              <a href={request.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                {request.website.replace(/^https?:\/\//, "").replace(/\/$/, "")}
                <span className="sr-only"> (opens in a new tab)</span>
              </a>
            </dd>
          </div>
        )}
      </dl>

      <section className="flex flex-col gap-2 rounded-lg border border-hairline p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h4 className={caps}>Role</h4>
            <p className="text-base leading-6 font-semibold text-ink">{request.role}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {request.experienceLabel && <Pill tone="neutral">{request.experienceLabel}</Pill>}
            <Pill tone="primary" icon={<Users aria-hidden className="size-3.5" strokeWidth={1.33} />}>
              {request.positions} {request.positions === 1 ? "position" : "positions"}
            </Pill>
          </div>
        </div>
        {request.requiredSkills.length > 0 && (
          <div className="flex flex-col gap-2">
            <h4 className={caps}>Required Skills</h4>
            <TagList label={`Skills required by ${request.organization}`}>
              {request.requiredSkills.map((s) => (
                <Tag key={s} variant="plain">{s}</Tag>
              ))}
            </TagList>
          </div>
        )}
      </section>

      {request.description && <p className="rounded-lg bg-hairline p-3 text-sm leading-5 whitespace-pre-line text-slate-900">{request.description}</p>}

      {matchedTalents.length > 0 && (
        <p className="flex items-center gap-2 text-sm leading-5 font-medium text-success">
          <CircleCheck aria-hidden className="size-4 shrink-0" strokeWidth={1.67} />
          Matched: {matchedTalents.join(", ")}
        </p>
      )}

      <div className="border-t border-hairline pt-4">
        <Button
          variant="accent"
          onClick={onMatch}
          icon={<Sparkles aria-hidden className="size-4" strokeWidth={1.33} />}
          className="h-10 w-full gap-3 font-semibold"
        >
          Match Talents<span className="sr-only"> to {request.organization}</span>
        </Button>
      </div>
    </Card>
  );
}
