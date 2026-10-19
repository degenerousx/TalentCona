import { Briefcase, Building2, Calendar, CircleCheck, Clock, Eye, Mail, MapPin, Phone } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Pill } from "@/components/ui/Pill";
import { shortDate, type RequestStatus, type TalentRequest } from "./data";

export function RequestStatusPill({ status, large }: { status: RequestStatus; large?: boolean }) {
  const pending = status === "pending";
  const Icon = pending ? Clock : CircleCheck;
  return (
    <Pill
      tone={pending ? "warning" : "success"}
      size={large ? "sm" : "xs"}
      icon={<Icon aria-hidden className="size-3.5" strokeWidth={1.17} />}
      className={large ? "gap-2 rounded-lg px-4 py-2 text-warning-strong" : undefined}
    >
      {pending ? "Pending" : "Fulfilled"}
    </Pill>
  );
}

const iconProps = { "aria-hidden": true, className: "size-4 shrink-0 text-muted", strokeWidth: 1.33 } as const;

type RequestCardProps = { request: TalentRequest; onViewDetails: () => void };

export function RequestCard({ request, onViewDetails }: RequestCardProps) {
  return (
    <Card as="li" tone="hairline" className="flex flex-col gap-4 p-6">
      <div className="flex items-start gap-4">
        <span aria-hidden="true" className="grid size-14 shrink-0 place-items-center rounded-lg bg-purple-100">
          <Building2 className="size-7 text-accent" strokeWidth={2.33} />
        </span>
        <div className="flex min-w-0 flex-1 flex-wrap items-start justify-between gap-2">
          <div className="flex min-w-0 flex-col gap-0.5">
            <h3 className="text-lg leading-7 font-semibold text-ink">{request.company}</h3>
            <p className="text-sm leading-5 text-slate-500">{request.contact}</p>
          </div>
          <RequestStatusPill status={request.status} />
        </div>
      </div>

      <dl className="grid gap-3 text-sm leading-5 text-slate-900 sm:grid-cols-2 sm:gap-x-8">
        <div className="flex items-center gap-2">
          <dt>
            <Mail {...iconProps} />
            <span className="sr-only">Email</span>
          </dt>
          <dd className="min-w-0 truncate">
            <a href={`mailto:${request.email}`} className="text-primary hover:underline">
              {request.email}
            </a>
          </dd>
        </div>
        <div className="flex items-center gap-2">
          <dt>
            <Phone {...iconProps} />
            <span className="sr-only">Phone</span>
          </dt>
          <dd>{request.phone}</dd>
        </div>
        <div className="flex items-center gap-2">
          <dt>
            <MapPin {...iconProps} />
            <span className="sr-only">Location</span>
          </dt>
          <dd>{request.location}</dd>
        </div>
        <div className="flex items-center gap-2">
          <dt className="flex items-center gap-2 text-slate-500">
            <Calendar {...iconProps} />
            Requested:
          </dt>
          <dd>{shortDate(request.requestedOn)}</dd>
        </div>
        <div className="flex items-center gap-2">
          <dt className="flex items-center gap-2 text-slate-500">
            <Clock {...iconProps} />
            Deadline:
          </dt>
          <dd className="font-medium text-warning">{shortDate(request.deadline)}</dd>
        </div>
        <div className="flex items-center gap-2">
          <dt>
            <Briefcase {...iconProps} />
            <span className="sr-only">Employment type</span>
          </dt>
          <dd>{request.employmentType}</dd>
        </div>
      </dl>

      <p className="rounded-lg bg-hairline p-3 text-sm leading-5 text-slate-900">{request.description}</p>

      <div className="border-t border-hairline pt-4">
        <Button
          variant="accent"
          onClick={onViewDetails}
          icon={<Eye aria-hidden className="size-4" strokeWidth={1.33} />}
          className="h-10 w-full gap-3 font-semibold"
        >
          View Full Details<span className="sr-only"> for {request.company}</span>
        </Button>
      </div>
    </Card>
  );
}
