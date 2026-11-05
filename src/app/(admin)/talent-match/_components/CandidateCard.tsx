"use client";

import { useState } from "react";
import { Award, Briefcase, CircleCheck, Code, ExternalLink, FileText, GraduationCap, Mail, MapPin, Phone, Sparkles } from "lucide-react";
import { Checkbox } from "@/components/shadcn/checkbox";
import { Button, buttonClasses } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Pill, type PillTone } from "@/components/ui/Pill";
import { Tag, TagList } from "@/components/ui/Tag";
import { cn } from "@/lib/cn";
import { availabilityLabel, cvStatusLabel, shortDate, type Candidate, type CvStatus, type MatchResult } from "./data";

const cvStatusTone: Record<CvStatus, PillTone> = {
  new: "blue",
  verified: "success",
  "in-review": "info",
  "needs-update": "warning",
};

/** Profile picture, or initials when there's none or it fails to load. */
export function Avatar({ person, size = "lg" }: { person: { name: string; initials: string; photoUrl?: string }; size?: "md" | "lg" }) {
  const [failed, setFailed] = useState(false);
  const box = size === "lg" ? "size-16 text-xl" : "size-12 text-base";
  if (person.photoUrl && !failed) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- small local/API image; next/image adds nothing here
      <img
        src={person.photoUrl}
        alt={`${person.name}'s profile picture`}
        width={size === "lg" ? 64 : 48}
        height={size === "lg" ? 64 : 48}
        onError={() => setFailed(true)}
        className={cn(box, "shrink-0 rounded-full border border-hairline bg-accent-light object-cover")}
      />
    );
  }
  return (
    <span
      role="img"
      aria-label={`${person.name}'s initials`}
      className={cn(box, "grid shrink-0 place-items-center rounded-full bg-accent-light leading-7 font-bold text-accent-deep")}
    >
      {person.initials}
    </span>
  );
}

/** One labelled row of a card's key information. */
export function InfoRow({ icon: Icon, label, children }: { icon: typeof Briefcase; label: string; children: React.ReactNode }) {
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

type CandidateCardProps = {
  candidate: Candidate;
  match?: MatchResult;
  /** Shows a checkbox to pick this CV (Mentor Matching). */
  selection?: { selected: boolean; onChange: (selected: boolean) => void; disabled?: boolean };
  /** Name of the mentor this candidate is confirmed with. */
  matchedWith?: string;
};

export function CandidateCard({ candidate, match, selection, matchedWith }: CandidateCardProps) {
  const years = candidate.experienceLabel ?? `${candidate.yearsExperience} ${candidate.yearsExperience === 1 ? "year" : "years"}`;

  return (
    <Card as="li" tone="hairline" className="flex flex-col gap-5 p-6">
      {/* Who: photo, full name, role, availability, match score. */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-4">
          <Avatar person={candidate} />
          <div className="flex min-w-0 flex-col gap-1">
            <div className="flex flex-wrap items-center gap-2.5">
              <h3 className="text-lg leading-7 font-semibold text-ink">{candidate.name}</h3>
              <Pill tone={candidate.availability === "available" ? "warning" : "success"}>
                {availabilityLabel[candidate.availability]}
              </Pill>
            </div>
            <p className="text-sm leading-5 text-slate-700">{candidate.headline}</p>
            <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs leading-4 text-slate-500">
              <a href={`mailto:${candidate.email}`} className="inline-flex items-center gap-1 hover:text-accent hover:underline">
                <Mail aria-hidden className="size-3.5" strokeWidth={1.33} />
                {candidate.email}
              </a>
              {candidate.phone && (
                <a href={`tel:${candidate.phone.replace(/\s+/g, "")}`} className="inline-flex items-center gap-1 hover:text-accent hover:underline">
                  <Phone aria-hidden className="size-3.5" strokeWidth={1.33} />
                  {candidate.phone}
                </a>
              )}
              {candidate.linkedinUrl && (
                <a href={candidate.linkedinUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 hover:text-accent hover:underline">
                  <ExternalLink aria-hidden className="size-3.5" strokeWidth={1.33} />
                  LinkedIn<span className="sr-only"> profile of {candidate.name} (opens in a new tab)</span>
                </a>
              )}
            </p>
            {matchedWith && (
              <p className="flex items-center gap-1.5 text-sm leading-5 font-medium text-success">
                <CircleCheck aria-hidden className="size-4" strokeWidth={1.67} />
                Matched with {matchedWith}
              </p>
            )}
          </div>
        </div>

        {selection && (
          <Checkbox
            checked={selection.selected}
            onCheckedChange={(v) => selection.onChange(v === true)}
            disabled={selection.disabled}
            aria-label={`Select ${candidate.name}'s CV`}
            className="mt-1 size-5 border-accent data-[state=checked]:bg-accent data-[state=checked]:text-white"
          />
        )}

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
          {candidate.education ?? (candidate.certifications.length ? null : <span className="text-slate-500">{candidate.cvUrl ? "See CV" : "Not provided"}</span>)}
          {candidate.certifications.map((c) => (
            <span key={c} className="mt-1 flex items-center gap-1.5 text-slate-700">
              <Award aria-hidden className="size-3.5 shrink-0 text-success" strokeWidth={1.17} />
              {c}
            </span>
          ))}
        </InfoRow>
        <InfoRow icon={Briefcase} label="Experience">
          {years}
          {candidate.program && (
            <span className="block text-slate-700">
              {candidate.program}
              {candidate.cohort && <> <span aria-hidden="true">•</span> {candidate.cohort}</>}
            </span>
          )}
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
        {candidate.cvUrl ? (
          <a
            href={candidate.cvUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonClasses({ variant: "outline-accent", className: "font-medium" })}
          >
            <FileText aria-hidden className="size-4" strokeWidth={1.33} />
            View CV<span className="sr-only"> of {candidate.name} (opens in a new tab)</span>
          </a>
        ) : (
          <Button
            variant="outline-accent"
            disabled
            title="No CV file was uploaded"
            icon={<FileText aria-hidden className="size-4" strokeWidth={1.33} />}
            className="font-medium"
          >
            View CV<span className="sr-only"> of {candidate.name}</span>
          </Button>
        )}
      </div>
    </Card>
  );
}
