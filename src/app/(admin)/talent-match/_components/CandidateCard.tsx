import { Briefcase, Clock, FileText, GraduationCap, MapPin, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Pill } from "@/components/ui/Pill";
import { Tag, TagList } from "@/components/ui/Tag";
import { cn } from "@/lib/cn";
import { availabilityLabel, shortDate, type Candidate, type MatchResult } from "./data";

/** One line of the card's key information: icon + text. */
function InfoLine({ icon: Icon, label, children }: { icon: typeof Briefcase; label: string; children: React.ReactNode }) {
  return (
    <li className="flex min-w-0 items-start gap-2 text-sm leading-5 text-slate-900">
      <Icon aria-hidden className="mt-0.5 size-4 shrink-0 text-muted" strokeWidth={1.33} />
      <span className="sr-only">{label}: </span>
      <span className="min-w-0">{children}</span>
    </li>
  );
}

function scoreTone(score: number) {
  if (score >= 75) return "bg-success-soft text-success";
  if (score >= 50) return "bg-info-soft text-info";
  return "bg-warning-soft text-warning";
}

type CandidateCardProps = { candidate: Candidate; match?: MatchResult };

export function CandidateCard({ candidate, match }: CandidateCardProps) {
  return (
    <Card as="li" tone="hairline" className="flex flex-col gap-4 p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-4">
          <span
            aria-hidden="true"
            className="grid size-14 shrink-0 place-items-center rounded-full bg-accent-light text-lg leading-7 font-bold text-accent-deep"
          >
            {candidate.initials}
          </span>
          <div className="flex min-w-0 flex-col gap-1">
            <div className="flex flex-wrap items-center gap-2.5">
              <h3 className="text-lg leading-7 font-semibold text-ink">{candidate.name}</h3>
              <Pill tone={candidate.availability === "available" ? "warning" : "success"}>
                {availabilityLabel[candidate.availability]}
              </Pill>
            </div>
            <p className="flex items-center gap-1.5 text-xs leading-4 text-slate-500">
              <FileText aria-hidden className="size-3.5" strokeWidth={1.33} />
              CV submitted {shortDate(candidate.cvSubmittedOn)}
            </p>
          </div>
        </div>

        {match && (
          <div className="flex shrink-0 flex-col items-center">
            <span className={cn("grid size-14 place-items-center rounded-full text-lg leading-7 font-bold", scoreTone(match.score))}>
              {match.score}%
            </span>
            <span className="text-xs leading-4 text-slate-700">Match</span>
          </div>
        )}
      </div>

      {/* The five lines of key information. */}
      <ul aria-label={`${candidate.name}'s key information`} className="flex flex-col gap-2">
        <InfoLine icon={Briefcase} label="Role">{candidate.headline}</InfoLine>
        <InfoLine icon={GraduationCap} label="Program">
          {candidate.program} <span aria-hidden="true">•</span> {candidate.cohort}
        </InfoLine>
        <InfoLine icon={Clock} label="Experience and education">
          {candidate.yearsExperience} {candidate.yearsExperience === 1 ? "year" : "years"} experience · {candidate.education}
        </InfoLine>
        <InfoLine icon={MapPin} label="Location">{candidate.location}</InfoLine>
        <li className="pt-1">
          <TagList label={`${candidate.name}'s skills`}>
            {candidate.skills.map((s) => (
              <Tag key={s}>{s}</Tag>
            ))}
          </TagList>
        </li>
      </ul>

      {match && (
        <section aria-label="Match details" className="flex flex-col gap-1 rounded-lg bg-slate-50 p-3 text-sm leading-5">
          <p className="flex items-start gap-2 text-slate-900">
            <Sparkles aria-hidden className="mt-0.5 size-4 shrink-0 text-accent" strokeWidth={1.33} />
            {match.summary}
          </p>
          {match.missingSkills.length > 0 && (
            <p className="pl-6 text-slate-500">Missing: {match.missingSkills.join(", ")}</p>
          )}
        </section>
      )}

      <div className="mt-auto flex justify-end">
        {/* CV files aren't stored by the backend yet. */}
        <Button
          variant="outline-accent"
          disabled
          title="Available once CVs are connected to the backend"
          icon={<FileText aria-hidden className="size-4" strokeWidth={1.33} />}
          className="font-medium"
        >
          View CV<span className="sr-only"> of {candidate.name}</span>
        </Button>
      </div>
    </Card>
  );
}
