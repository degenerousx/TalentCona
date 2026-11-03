"use client";

import { useState } from "react";
import { ArrowRight, Check, CircleCheck, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/cn";
import { Avatar } from "./CandidateCard";
import type { Candidate, Mentor, MentorSuggestion } from "./data";

function scoreTone(score: number) {
  if (score >= 75) return "bg-success-soft text-success";
  if (score >= 50) return "bg-info-soft text-info";
  return "bg-warning-soft text-warning";
}

type SuggestionCardProps = {
  suggestion: MentorSuggestion;
  candidate: Candidate;
  mentorsById: Map<string, Mentor>;
  confirming: boolean;
  onConfirm: (mentorId: string, score: number) => void;
  onDismiss: () => void;
};

/** One candidate's suggested mentors: pick one, then Confirm Match. */
export function SuggestionCard({ suggestion, candidate, mentorsById, confirming, onConfirm, onDismiss }: SuggestionCardProps) {
  // The best suggestion is picked by default.
  const [selectedId, setSelectedId] = useState(suggestion.options[0]?.mentorId ?? null);
  const selected = suggestion.options.find((o) => o.mentorId === selectedId);
  const groupLabel = `Suggested mentors for ${candidate.name}`;

  return (
    <Card as="li" tone="hairline" className="flex flex-col gap-4 p-6">
      <div className="flex items-center gap-3">
        <Avatar person={candidate} size="md" />
        <div className="min-w-0">
          <h3 className="text-base leading-6 font-semibold text-ink">{candidate.name}</h3>
          <p className="text-sm leading-5 text-slate-700">{candidate.headline}</p>
        </div>
        <ArrowRight aria-hidden className="ml-auto size-5 shrink-0 text-muted" strokeWidth={1.67} />
        <span className="text-sm leading-5 text-slate-500">Suggested mentors</span>
      </div>

      {suggestion.options.length === 0 ? (
        <p className="rounded-lg bg-slate-50 p-4 text-sm leading-5 text-slate-500">
          No mentor has a free place right now. Free up capacity, then start matching again.
        </p>
      ) : (
        <div role="radiogroup" aria-label={groupLabel} className="flex flex-col gap-2">
          {suggestion.options.map((option, rank) => {
            const mentor = mentorsById.get(option.mentorId);
            if (!mentor) return null;
            const isSelected = option.mentorId === selectedId;
            return (
              <button
                key={option.mentorId}
                type="button"
                role="radio"
                aria-checked={isSelected}
                onClick={() => setSelectedId(option.mentorId)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg border-2 p-3 text-left transition-colors",
                  isSelected ? "border-accent bg-primary-soft/60" : "border-border bg-white hover:bg-slate-50",
                )}
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    "grid size-5 shrink-0 place-items-center rounded-full border-2",
                    isSelected ? "border-accent bg-accent text-white" : "border-slate-400",
                  )}
                >
                  {isSelected && <Check className="size-3" strokeWidth={3} />}
                </span>
                <Avatar person={mentor} size="md" />
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="text-sm leading-5 font-semibold text-ink">{mentor.name}</span>
                    {rank === 0 && <span className="rounded-full bg-accent px-2 py-0.5 text-[11px] leading-4 font-medium text-white">Best match</span>}
                  </span>
                  <span className="block text-xs leading-4 text-slate-500">{mentor.title}</span>
                  <span className="mt-1 block text-xs leading-4 text-slate-700">{option.reasons.join(" · ")}</span>
                </span>
                <span className={cn("grid size-12 shrink-0 place-items-center rounded-full text-sm font-bold", scoreTone(option.score))}>
                  {option.score}%
                </span>
              </button>
            );
          })}
        </div>
      )}

      <div className="flex flex-wrap justify-end gap-3">
        <Button variant="outline" onClick={onDismiss} disabled={confirming} icon={<X aria-hidden className="size-4" strokeWidth={1.67} />} className="font-medium">
          Dismiss
        </Button>
        <Button
          variant="accent"
          disabled={!selected || confirming}
          onClick={() => selected && onConfirm(selected.mentorId, selected.score)}
          icon={<CircleCheck aria-hidden className="size-4" strokeWidth={1.67} />}
          className="font-medium"
        >
          {confirming ? "Confirming…" : "Confirm Match"}
          <span className="sr-only"> for {candidate.name}</span>
        </Button>
      </div>
    </Card>
  );
}
