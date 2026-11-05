"use client";

import { useEffect, useState } from "react";
import { Check, ExternalLink, Eye, Sparkles, Star, StarHalf } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Pill } from "@/components/ui/Pill";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/States";
import { Tag, TagList } from "@/components/ui/Tag";
import { cn } from "@/lib/cn";
import { useMatchTalents } from "./api";
import { RequestStatusPill } from "./HiringRequestCard";
import { InitialsAvatar, scoreTone } from "./TalentCard";
import { levelFor, longDate, ratingFor, type HiringRequest, type Talent } from "./data";

const caps = "text-xs leading-4 font-medium text-slate-700 uppercase";

/** A section with the design's 18px heading. */
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h3 className="text-lg leading-7 font-semibold text-slate-900">{title}</h3>
      {children}
    </section>
  );
}

function SkillGroup({ title, skills }: { title: string; skills: string[] }) {
  if (skills.length === 0) return null;
  return (
    <div className="flex flex-col gap-2">
      <h5 className={caps}>{title}</h5>
      <TagList label={title}>
        {skills.map((s) => (
          <Tag key={s} variant="plain">{s}</Tag>
        ))}
      </TagList>
    </div>
  );
}

/** Five stars, filled to the rating (half stars allowed). */
function StarRating({ rating }: { rating: number }) {
  return (
    <span role="img" aria-label={`Rated ${rating} out of 5`} className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => {
        const Icon = rating < i && rating >= i - 0.5 ? StarHalf : Star;
        return (
          <Icon
            key={i}
            aria-hidden
            className={cn("size-4", rating >= i - 0.5 ? "fill-warning text-warning" : "text-slate-300")}
            strokeWidth={1.33}
          />
        );
      })}
      <span aria-hidden="true" className="ml-1 text-sm leading-5 font-semibold text-ink">{rating.toFixed(1)}</span>
    </span>
  );
}

type Props = {
  request: HiringRequest | null;
  talents: Talent[];
  /** Talent IDs already confirmed for this request. */
  confirmedIds: Set<string>;
  confirming: boolean;
  onConfirm: (talentId: string, score: number) => void;
  onViewProfile: (talent: Talent) => void;
  onClose: () => void;
};

/**
 * Talent Request Details (the Talent Corner popup design), plus Talent Matches:
 * every available talent rated for the role. Mark as Fulfilled confirms the
 * selected talent and fulfils the request.
 */
export function RequestDetailsModal({ request, talents, confirmedIds, confirming, onConfirm, onViewProfile, onClose }: Props) {
  const match = useMatchTalents();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { mutate } = match;

  // Rate the talents as soon as the details open.
  useEffect(() => {
    if (!request) return;
    mutate(request, { onSuccess: (ranked) => setSelectedId(ranked.find((m) => !confirmedIds.has(m.talentId))?.talentId ?? null) });
    // Re-rate only when a different request is opened.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [request?.id, mutate]);

  if (!request) return null;
  const byId = new Map(talents.map((t) => [t.id, t]));
  const ranked = match.data ?? [];
  const selected = ranked.find((m) => m.talentId === selectedId);
  const selectedTalent = selected ? byId.get(selected.talentId) : undefined;
  const pending = request.status === "pending";

  const company = [
    { label: "Contact Person", value: request.contactName },
    { label: "Location", value: request.location },
    { label: "Email", value: <a href={`mailto:${request.email}`} className="text-primary hover:underline">{request.email}</a> },
    request.website
      ? {
          label: "Website",
          value: (
            <a href={request.website} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline">
              {request.website.replace(/\/$/, "")}
              <ExternalLink aria-hidden className="size-3.5" />
              <span className="sr-only">(opens in a new tab)</span>
            </a>
          ),
        }
      : null,
    request.phone ? { label: "Phone", value: request.phone } : null,
    { label: "Employment Type", value: request.employmentType },
  ].filter((f) => f !== null);

  return (
    <Modal
      open
      onClose={onClose}
      title={request.organization}
      titleClassName="text-slate-900"
      subtitle={<p className="text-base leading-6 text-slate-700">Talent Request Details</p>}
      footer={
        pending ? (
          <div className="flex flex-col gap-2">
            {selectedTalent && selected && (
              <p className="text-sm leading-5 text-slate-700">
                Selected match: <span className="font-semibold text-ink">{selectedTalent.name}</span> · {selected.score}% match
              </p>
            )}
            <Button
              variant="primary"
              size="lg"
              className="w-full"
              disabled={!selected || confirming}
              title={selected ? undefined : "Select a talent under Talent Matches first"}
              onClick={() => selected && onConfirm(selected.talentId, selected.score)}
            >
              {confirming ? "Marking as Fulfilled…" : "Mark as Fulfilled"}
            </Button>
          </div>
        ) : undefined
      }
    >
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg bg-slate-50 p-4">
        <dl className="flex flex-col gap-3">
          <div className="flex items-center gap-1">
            <dt className="text-sm leading-5 text-slate-700">Request ID:</dt>
            <dd className="text-base leading-6 text-slate-900">#{request.code}</dd>
          </div>
          <div className="flex items-center gap-1">
            <dt className="text-sm leading-5 text-slate-700">Request Date:</dt>
            <dd className="text-base leading-6 text-slate-900">{longDate(request.submittedAt)}</dd>
          </div>
        </dl>
        <RequestStatusPill status={request.status} large />
      </div>

      <Section title="Company Information">
        <dl className="grid gap-3 sm:grid-cols-2">
          {company.map((f) => (
            <div key={f.label} className="flex flex-col gap-1">
              <dt className={caps}>{f.label}</dt>
              <dd className="text-base leading-6 break-words text-slate-900">{f.value}</dd>
            </div>
          ))}
        </dl>
      </Section>

      {request.description && (
        <Section title="Description">
          <p className="rounded-lg bg-slate-50 p-3.5 text-base leading-6 whitespace-pre-line text-slate-900">{request.description}</p>
        </Section>
      )}

      <Section title={`Role Requirements (${request.positions} total ${request.positions === 1 ? "position" : "positions"})`}>
        <div className="flex flex-col gap-3 rounded-lg border border-slate-100 p-4">
          <div className="flex flex-col gap-2">
            <h4 className="text-lg leading-7 font-semibold text-slate-900">{request.role}</h4>
            <div className="flex flex-wrap gap-2">
              <Pill tone="teal" size="sm">{levelFor(request.minYearsExperience)}</Pill>
              <Pill tone="neutral" size="sm">{request.employmentType}</Pill>
              <Pill tone="primary" size="sm">
                {request.positions} {request.positions === 1 ? "Position" : "Positions"}
              </Pill>
            </div>
          </div>
          <SkillGroup title="Required Skills" skills={request.requiredSkills} />
          <SkillGroup title="Nice to Have Skills" skills={request.niceToHaveSkills} />
        </div>
      </Section>

      <Section title="Talent Matches">
        <p className="-mt-1 text-xs leading-4 text-slate-500">
          Available talents rated for this role on required skills, experience and location. Sample scoring for now; AI matching connects
          once the backend is ready.
        </p>
        {match.isPending && <LoadingState variant="block" label="Rating available talents…" />}
        {match.isError && <ErrorState error={match.error} title="Couldn't rate talents" onRetry={() => mutate(request)} retrying={match.isPending} />}
        {match.isSuccess && ranked.length === 0 && (
          <EmptyState title="No talents yet" description="Talents appear here once they submit the talent network form." />
        )}
        {match.isSuccess && ranked.length > 0 && (
          <div role="radiogroup" aria-label={`Talents rated for ${request.role}`} className="flex flex-col gap-3">
            {ranked.map((m, rank) => {
              const talent = byId.get(m.talentId);
              if (!talent) return null;
              const isSelected = m.talentId === selectedId;
              const confirmed = confirmedIds.has(m.talentId);
              return (
                <div
                  key={m.talentId}
                  className={cn(
                    "flex items-start gap-3 rounded-lg border-2 p-4 transition-colors",
                    isSelected ? "border-accent bg-primary-soft/60" : "border-hairline bg-white",
                  )}
                >
                  {pending && (
                    <button
                      type="button"
                      role="radio"
                      aria-checked={isSelected}
                      aria-label={`Select ${talent.name}`}
                      onClick={() => setSelectedId(m.talentId)}
                      className={cn(
                        "mt-1 grid size-5 shrink-0 place-items-center rounded-full border-2",
                        isSelected ? "border-accent bg-accent text-white" : "border-slate-400",
                      )}
                    >
                      {isSelected && <Check aria-hidden className="size-3" strokeWidth={3} />}
                    </button>
                  )}
                  <InitialsAvatar initials={talent.initials} size="md" />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-base leading-6 font-semibold text-ink">{talent.name}</span>
                      {rank === 0 && !confirmed && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-accent px-2 py-0.5 text-[11px] leading-4 font-medium text-white">
                          <Sparkles aria-hidden className="size-3" /> Best match
                        </span>
                      )}
                      {confirmed && (
                        <span className="rounded-full bg-success-soft px-2 py-0.5 text-[11px] leading-4 font-medium text-success">Matched</span>
                      )}
                    </div>
                    <p className="text-sm leading-5 text-slate-700">{talent.title}</p>
                    <div className="mt-1">
                      <StarRating rating={ratingFor(m.score)} />
                    </div>
                    <p className="mt-1 text-xs leading-4 text-slate-700">{m.reasons.join(" · ")}</p>
                    {m.missingSkills.length > 0 && (
                      <p className="mt-1 text-xs leading-4 text-slate-500">Missing: {m.missingSkills.join(", ")}</p>
                    )}
                    <button
                      type="button"
                      onClick={() => onViewProfile(talent)}
                      className="mt-2 inline-flex items-center gap-1 text-sm leading-5 font-medium text-accent hover:underline"
                    >
                      <Eye aria-hidden className="size-4" strokeWidth={1.33} />
                      View Profile<span className="sr-only"> of {talent.name}</span>
                    </button>
                  </div>
                  <div className="flex shrink-0 flex-col items-center">
                    <span className={cn("grid size-14 place-items-center rounded-full text-lg font-bold", scoreTone(m.score))}>{m.score}%</span>
                    <span className="text-xs leading-4 text-slate-700">Match</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Section>
    </Modal>
  );
}
