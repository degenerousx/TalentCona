"use client";

import { useEffect, useState } from "react";
import { Check, CircleCheck, Eye, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/States";
import { cn } from "@/lib/cn";
import { useMatchTalents } from "./api";
import { InitialsAvatar, scoreTone } from "./TalentCard";
import type { HiringRequest, Talent } from "./data";

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

/** Ranks the available talents against one hiring request; pick one and Confirm Match. */
export function MatchTalentsModal({ request, talents, confirmedIds, confirming, onConfirm, onViewProfile, onClose }: Props) {
  const match = useMatchTalents();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { mutate } = match;

  // Rank as soon as the modal opens for a request.
  useEffect(() => {
    if (!request) return;
    mutate(request, { onSuccess: (ranked) => setSelectedId(ranked.find((m) => !confirmedIds.has(m.talentId))?.talentId ?? null) });
    // Re-rank only when a different request is opened.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [request?.id, mutate]);

  if (!request) return null;
  const byId = new Map(talents.map((t) => [t.id, t]));
  const ranked = match.data ?? [];
  const selected = ranked.find((m) => m.talentId === selectedId);

  return (
    <Modal
      open
      onClose={onClose}
      title="Match Talents"
      subtitle={
        <p className="text-base leading-6 text-slate-700">
          {request.role} · {request.organization}
        </p>
      }
      footer={
        <div className="flex flex-col gap-2">
          <p className="text-xs leading-4 text-slate-500">
            Sample scoring for now: required skills, experience and location. AI matching connects once the backend is ready.
          </p>
          <Button
            variant="accent"
            size="lg"
            className="w-full"
            disabled={!selected || confirming || confirmedIds.has(selected.talentId)}
            onClick={() => selected && onConfirm(selected.talentId, selected.score)}
            icon={<CircleCheck aria-hidden className="size-4" strokeWidth={1.67} />}
          >
            {confirming ? "Confirming…" : selected ? `Confirm Match: ${byId.get(selected.talentId)?.name}` : "Confirm Match"}
          </Button>
        </div>
      }
    >
      {match.isPending && <LoadingState variant="block" label="Finding the best talents…" />}
      {match.isError && <ErrorState error={match.error} title="Couldn't match talents" onRetry={() => mutate(request)} retrying={match.isPending} />}
      {match.isSuccess && ranked.length === 0 && (
        <EmptyState title="No talents yet" description="Talents appear here once they submit the talent network form." />
      )}
      {match.isSuccess && ranked.length > 0 && (
        <div role="radiogroup" aria-label={`Talents ranked for ${request.role}`} className="flex flex-col gap-3">
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
                <button
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  aria-label={`Select ${talent.name}`}
                  disabled={confirmed}
                  onClick={() => setSelectedId(m.talentId)}
                  className={cn(
                    "mt-1 grid size-5 shrink-0 place-items-center rounded-full border-2 disabled:opacity-40",
                    isSelected ? "border-accent bg-accent text-white" : "border-slate-400",
                  )}
                >
                  {isSelected && <Check aria-hidden className="size-3" strokeWidth={3} />}
                </button>
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
                <span className={cn("grid size-14 shrink-0 place-items-center rounded-full text-lg font-bold", scoreTone(m.score))}>
                  {m.score}%
                </span>
              </div>
            );
          })}
        </div>
      )}
    </Modal>
  );
}
