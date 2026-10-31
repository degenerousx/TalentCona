"use client";

import { useState } from "react";
import { Award, Briefcase, Code, FileText, GraduationCap, MapPin, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Pill, type PillTone } from "@/components/ui/Pill";
import { Tag, TagList } from "@/components/ui/Tag";
import { cn } from "@/lib/cn";
import { availabilityLabel, cvStatusLabel, shortDate, type Candidate, type CvStatus, type MatchResult } from "./data";

const cvStatusTone: Record<CvStatus, PillTone> = {
  verified: "success",
  "in-review": "info",
  "needs-update": "warning",
};

/** Profile picture, or initials when there's none or it fails to load. */
function Avatar({ candidate }: { candidate: Candidate }) {
  const [failed, setFailed] = useState(false);
  if (candidate.photoUrl && !failed) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- small local/API image; next/image adds nothing here
      <img
        src={candidate.photoUrl}
        alt={`${candidate.name}'s profile picture`}
        width={64}
        height={64}
        onError={() => setFailed(true)}
        className="size-16 shrink-0 rounded-full border border-hairline bg-accent-light object-cover"
      />
    );
  }
  return (
    <span
      role="img"
      aria-label={`${candidate.name}'s initials`}
      className="grid size-16 shrink-0 place-items-center rounded-full bg-accent-light text-xl leading-7 font-bold text-accent-deep"
    >
      {candidate.initials}
    </span>
  );
}

/** One labelled row of the card's key information. */
function InfoRow({ icon: Icon, label, children }: { icon: typeof Briefcase; label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[7.5rem_1fr] items-start gap-3 py-2.5 first:pt-0 last:pb-0">
      <dt className="flex items-center gap-2 text-xs leading-5 font-medium text-muted uppercase">
        <Icon aria-hidden className="size-4 shrink-0" strokeWidth={1.33} />
        {label}
      </dt>
      <dd className="min-w-0 text-sm leading-5 text-slate-900">{children}</dd>
    </div>
  );
}

function scoreTone(score: number) {
  if (score >= 75) return "bg-success-soft text-success";
  if (score >= 50) return "bg-info-soft text-info";
  return "bg-warning-soft text-warning";
}

type CandidateCardProps = { candidate: Candidate; match?: MatchResult };

export function CandidateCard({ candidate, match }: CandidateCardProps) {
  const years = `${candidate.yearsExperience} ${candidate.yearsExperience === 1 ? "year" : "years"}`;

  return (
    <Card as="li" tone="hairline" className="flex flex-col gap-5 p-6">
      {/* Who: photo, full name, role, availability, match score. */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-4">
          <Avatar candidate={candidate} />
          <div className="flex min-w-0 flex-col gap-1">
            <div className="flex flex-wrap items-center gap-2.5">
              <h3 className="text-lg leading-7 font-semibold text-ink">{candidate.name}</h3>
              <Pill tone={candidate.availability === "available" ? "warning" : "success"}>
                {availabilityLabel[candidate.availability]}
              </Pill>
            </div>
            <p className="text-sm leading-5 text-slate-700">{candidate.headline}</p>
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
      <dl aria-label={`${candidate.name}'s key information`} className="divide-y divide-hairline border-y border-hairline py-3">
        <InfoRow icon={Code} label="Skills">
          <TagList label={`${candidate.name}'s skills`}>
            {candidate.skills.map((s) => (
              <Tag key={s}>{s}</Tag>
            ))}
          </TagList>
        </InfoRow>
        <InfoRow icon={GraduationCap} label="Qualifications">
          {candidate.education}
          {candidate.certifications.map((c) => (
            <span key={c} className="mt-1 flex items-center gap-1.5 text-slate-700">
              <Award aria-hidden className="size-3.5 shrink-0 text-success" strokeWidth={1.17} />
              {c}
            </span>
          ))}
        </InfoRow>
        <InfoRow icon={Briefcase} label="Experience">
          {years}
          <span className="block text-slate-700">
            {candidate.program} <span aria-hidden="true">•</span> {candidate.cohort}
          </span>
        </InfoRow>
        <InfoRow icon={MapPin} label="Location">{candidate.location}</InfoRow>
        <InfoRow icon={FileText} label="CV status">
          <span className="flex flex-wrap items-center gap-2">
            <Pill tone={cvStatusTone[candidate.cvStatus]}>{cvStatusLabel[candidate.cvStatus]}</Pill>
            <span className="text-slate-500">Submitted {shortDate(candidate.cvSubmittedOn)}</span>
          </span>
        </InfoRow>
      </dl>

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
