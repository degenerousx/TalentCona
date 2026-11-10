"use client";

import { ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Modal, ModalSection } from "@/components/ui/Modal";
import { Pill } from "@/components/ui/Pill";
import { ErrorState, LoadingState } from "@/components/ui/States";
import { Tag, TagList } from "@/components/ui/Tag";
import { useFulfillRequest, useTalentRequest } from "./api";
import { RequestStatusPill } from "./RequestCard";
import { longDate } from "./data";

type Props = { requestId: string; onClose: () => void };

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

/** GET /talent-requests/admin/:id; "Mark as Fulfilled" → PATCH …/:id/fulfill. */
export function RequestDetailsModal({ requestId, onClose }: Props) {
  const query = useTalentRequest(requestId);
  const fulfill = useFulfillRequest();
  const request = query.data;

  const markFulfilled = () =>
    fulfill.mutate(requestId, {
      onSuccess: () => {
        toast.success(`${request?.company ?? "The"} request was marked as fulfilled`);
        void query.refetch();
      },
      onError: (error) => toast.error(error instanceof Error && error.message ? error.message : "Couldn't mark it as fulfilled."),
    });

  const company = request
    ? [
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
                <a href={request.website} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline">
                  {request.website}
                  <ExternalLink aria-hidden className="size-3.5" />
                  <span className="sr-only">(opens in a new tab)</span>
                </a>
              ),
            }
          : null,
        { label: "Phone", value: request.phone },
        { label: "Employment Type", value: request.employmentType },
        request.deadline ? { label: "Deadline", value: longDate(request.deadline) } : null,
      ].filter((f) => f !== null)
    : [];

  return (
    <Modal
      open
      onClose={onClose}
      title={request?.company ?? "Talent Request"}
      titleClassName="text-slate-900"
      subtitle={<p className="text-base leading-6 text-slate-700">Talent Request Details</p>}
      footer={
        request?.status === "pending" ? (
          <Button variant="primary" size="lg" className="w-full" onClick={markFulfilled} disabled={fulfill.isPending}>
            {fulfill.isPending ? "Marking as Fulfilled…" : "Mark as Fulfilled"}
          </Button>
        ) : undefined
      }
    >
      {query.isPending && <LoadingState variant="block" label="Loading request…" />}
      {query.isError && <ErrorState error={query.error} title="Couldn't load this request" onRetry={() => void query.refetch()} retrying={query.isFetching} />}
      {request && (
        <>
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
              {request.status === "fulfilled" && request.fulfilledAt && (
                <div className="flex items-center gap-1">
                  <dt className="text-sm leading-5 text-slate-700">Fulfilled:</dt>
                  <dd className="text-base leading-6 text-slate-900">
                    {longDate(request.fulfilledAt)}
                    {request.fulfilledBy ? ` by ${request.fulfilledBy}` : ""}
                  </dd>
                </div>
              )}
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

          {request.description && (
            <ModalSection title="Description">
              <p className="rounded-lg bg-slate-50 p-3.5 text-base leading-6 whitespace-pre-line text-slate-900">{request.description}</p>
            </ModalSection>
          )}

          <ModalSection title={`Role Requirements (${request.totalPositions} total ${request.totalPositions === 1 ? "position" : "positions"})`}>
            <ul className="flex flex-col gap-4">
              {request.roles.map((role) => (
                <li key={role.id} className="flex flex-col gap-3 rounded-lg border border-slate-100 p-4">
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
                        {role.positions} {role.positions === 1 ? "Position" : "Positions"}
                      </Pill>
                    </div>
                  </div>
                  <SkillGroup title="Required Skills" skills={role.requiredSkills} />
                  <SkillGroup title="Nice to Have Skills" skills={role.niceToHaveSkills} />
                </li>
              ))}
            </ul>
          </ModalSection>
        </>
      )}
    </Modal>
  );
}
