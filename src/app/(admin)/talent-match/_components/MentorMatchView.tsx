"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { CircleCheck, FileText, Sparkles, Users } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { StatCard } from "@/components/ui/StatCard";
import { EmptyState, ErrorState, LoadingState, QueryState } from "@/components/ui/States";
import { useCandidates, useConfirmMatch, useConfirmedMatches, useMentors, useStartMentorMatch } from "./api";
import { Avatar, CandidateCard } from "./CandidateCard";
import { openSlots, type MentorSuggestion } from "./data";
import { MentorCard } from "./MentorCard";
import { SuggestionCard } from "./SuggestionCard";

function errorText(error: unknown) {
  return error instanceof Error && error.message ? error.message : "Something went wrong. Please try again.";
}

function SectionHeading({ id, title, count }: { id: string; title: string; count?: number }) {
  return (
    <h2 id={id} className="flex items-center gap-2 text-lg leading-7 font-semibold text-ink">
      {title}
      {count !== undefined && <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs leading-4 font-normal text-slate-600">{count}</span>}
    </h2>
  );
}

export function MentorMatchView() {
  const candidates = useCandidates();
  const mentors = useMentors();
  const confirmed = useConfirmedMatches();
  const startMatch = useStartMentorMatch();
  const confirmMatch = useConfirmMatch();

  const [selected, setSelected] = useState<Set<string>>(new Set());
  // Suggestions still waiting for a decision; confirmed or dismissed ones are removed.
  const [suggestions, setSuggestions] = useState<MentorSuggestion[]>([]);

  const mentorsById = useMemo(() => new Map(mentors.data?.map((m) => [m.id, m])), [mentors.data]);
  const candidatesById = useMemo(() => new Map(candidates.data?.map((c) => [c.id, c])), [candidates.data]);
  const matchFor = useMemo(() => new Map(confirmed.data?.map((m) => [m.candidateId, m])), [confirmed.data]);

  const unmatched = (candidates.data ?? []).filter((c) => !matchFor.has(c.id));
  const mentorsWithPlaces = (mentors.data ?? []).filter((m) => openSlots(m) > 0).length;
  // Start Match uses the selected CVs, or every unmatched CV when none is selected.
  const toMatch = selected.size ? [...selected] : unmatched.map((c) => c.id);
  const ready = candidates.data !== undefined && mentors.data !== undefined;

  function toggle(id: string, on: boolean) {
    setSelected((current) => {
      const next = new Set(current);
      if (on) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  function start() {
    startMatch.mutate(toMatch, {
      onSuccess: (result) => {
        setSuggestions(result);
        setSelected(new Set());
      },
      onError: (error) => toast.error(errorText(error)),
    });
  }

  function confirm(candidateId: string, mentorId: string, score: number) {
    confirmMatch.mutate(
      { candidateId, mentorId, score },
      {
        onSuccess: () => {
          setSuggestions((list) => list.filter((s) => s.candidateId !== candidateId));
          toast.success(`${candidatesById.get(candidateId)?.name} matched with ${mentorsById.get(mentorId)?.name}`);
        },
        onError: (error) => toast.error(errorText(error)),
      },
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-6 md:grid-cols-3">
        <StatCard label="CVs Submitted" value={candidates.data ? candidates.data.length : "–"} icon={<FileText className="text-accent" strokeWidth={2.67} />} />
        <StatCard label="Mentors with Free Places" value={mentors.data ? mentorsWithPlaces : "–"} valueClassName="text-warning" icon={<Users className="text-warning" strokeWidth={2.67} />} />
        <StatCard label="Confirmed Matches" value={confirmed.data ? confirmed.data.length : "–"} valueClassName="text-success" icon={<CircleCheck className="text-success" strokeWidth={2.67} />} />
      </div>

      {/* Start Match */}
      <Card as="section" tone="hairline" aria-labelledby="start-match-title" className="flex flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-1">
          <h2 id="start-match-title" className="flex items-center gap-2 text-lg leading-7 font-semibold text-ink">
            <Sparkles aria-hidden className="size-5 text-accent" strokeWidth={1.67} />
            Match CVs with Mentors
          </h2>
          <p className="text-sm leading-5 text-slate-500">
            {selected.size
              ? `${selected.size} CV${selected.size === 1 ? "" : "s"} selected.`
              : `Select CVs below, or start now to match all ${unmatched.length} unmatched CVs.`}{" "}
            Sample scoring for now — AI matching connects once the backend is ready.
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-3">
          {selected.size > 0 && (
            <Button variant="outline-accent" onClick={() => setSelected(new Set())} disabled={startMatch.isPending} className="font-medium">
              Clear selection
            </Button>
          )}
          <Button
            variant="accent"
            onClick={start}
            disabled={!ready || toMatch.length === 0 || startMatch.isPending}
            title={ready && toMatch.length === 0 ? "Every CV is already matched" : undefined}
            icon={<Sparkles aria-hidden className={startMatch.isPending ? "size-4 animate-pulse" : "size-4"} strokeWidth={1.33} />}
            className="font-medium"
          >
            {startMatch.isPending ? "Matching…" : "Start Match"}
          </Button>
        </div>
      </Card>

      {startMatch.isError && <ErrorState error={startMatch.error} title="Couldn't start matching" onRetry={start} retrying={startMatch.isPending} />}
      {startMatch.isPending && <LoadingState variant="block" label="Finding the best mentors…" />}

      {/* Suggestions waiting for Confirm Match */}
      {suggestions.length > 0 && (
        <section aria-labelledby="suggestions-title" className="flex flex-col gap-4">
          <SectionHeading id="suggestions-title" title="Suggested Matches" count={suggestions.length} />
          <ul className="grid gap-6 xl:grid-cols-2">
            {suggestions.map((s) => {
              const candidate = candidatesById.get(s.candidateId);
              if (!candidate) return null;
              return (
                <SuggestionCard
                  key={s.candidateId}
                  suggestion={s}
                  candidate={candidate}
                  mentorsById={mentorsById}
                  confirming={confirmMatch.isPending && confirmMatch.variables?.candidateId === s.candidateId}
                  onConfirm={(mentorId, score) => confirm(s.candidateId, mentorId, score)}
                  onDismiss={() => setSuggestions((list) => list.filter((x) => x.candidateId !== s.candidateId))}
                />
              );
            })}
          </ul>
        </section>
      )}

      {/* Approved pairings */}
      {confirmed.data && confirmed.data.length > 0 && (
        <Card as="section" tone="hairline" aria-labelledby="confirmed-title" className="flex flex-col gap-4 p-6">
          <SectionHeading id="confirmed-title" title="Confirmed Matches" count={confirmed.data.length} />
          <ul className="flex flex-col divide-y divide-hairline">
            {confirmed.data.map((m) => {
              const candidate = candidatesById.get(m.candidateId);
              const mentor = mentorsById.get(m.mentorId);
              if (!candidate || !mentor) return null;
              return (
                <li key={m.candidateId} className="flex flex-wrap items-center gap-3 py-3 first:pt-0 last:pb-0">
                  <Avatar person={candidate} size="md" />
                  <span className="text-sm leading-5 font-semibold text-ink">{candidate.name}</span>
                  <span aria-hidden="true" className="text-muted">→</span>
                  <span className="sr-only">matched with</span>
                  <Avatar person={mentor} size="md" />
                  <span className="text-sm leading-5 font-semibold text-ink">{mentor.name}</span>
                  <span className="ml-auto flex items-center gap-3 text-sm leading-5 text-slate-500">
                    <span className="rounded-full bg-success-soft px-2.5 py-0.5 text-xs leading-4 font-medium text-success">{m.score}% match</span>
                    {new Date(m.confirmedAt).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                  </span>
                </li>
              );
            })}
          </ul>
        </Card>
      )}

      {/* CVs and mentors side by side */}
      <div className="grid items-start gap-6 lg:grid-cols-2">
        <section aria-labelledby="cvs-title" className="flex flex-col gap-4">
          <SectionHeading id="cvs-title" title="Submitted CVs" count={candidates.data?.length} />
          <QueryState
            query={candidates}
            isEmpty={(data) => data.length === 0}
            errorTitle="Couldn't load CVs"
            empty={<EmptyState title="No CVs yet" description="Candidates appear here once they submit a CV." />}
            loading={<LoadingState rows={3} />}
          >
            {(data) => (
              <ul aria-label="Submitted CVs" className="flex flex-col gap-6">
                {data.map((c) => {
                  const match = matchFor.get(c.id);
                  return (
                    <CandidateCard
                      key={c.id}
                      candidate={c}
                      matchedWith={match ? mentorsById.get(match.mentorId)?.name : undefined}
                      selection={match ? undefined : { selected: selected.has(c.id), onChange: (on) => toggle(c.id, on), disabled: startMatch.isPending }}
                    />
                  );
                })}
              </ul>
            )}
          </QueryState>
        </section>

        <section aria-labelledby="mentors-title" className="flex flex-col gap-4">
          <SectionHeading id="mentors-title" title="Available Mentors" count={mentors.data?.length} />
          <QueryState
            query={mentors}
            isEmpty={(data) => data.length === 0}
            errorTitle="Couldn't load mentors"
            empty={<EmptyState title="No mentors yet" description="Approved mentors appear here." />}
            loading={<LoadingState rows={3} />}
          >
            {(data) => (
              <ul aria-label="Available mentors" className="flex flex-col gap-6">
                {data.map((m) => (
                  <MentorCard key={m.id} mentor={m} />
                ))}
              </ul>
            )}
          </QueryState>
        </section>
      </div>
    </div>
  );
}
