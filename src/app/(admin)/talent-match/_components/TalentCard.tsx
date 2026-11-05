import { Award, Eye, FileText, MapPin } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Pill, type PillTone } from "@/components/ui/Pill";
import { Tag, TagList } from "@/components/ui/Tag";
import { cn } from "@/lib/cn";
import { talentStatusLabel, type Talent, type TalentStatus } from "./data";

const statusTone: Record<TalentStatus, PillTone> = { new: "warning", "in-review": "info", matched: "success" };

export function TalentStatusPill({ status }: { status: TalentStatus }) {
  return (
    <Pill tone={statusTone[status]} className={status === "matched" ? "px-6" : "px-3.5"}>
      {talentStatusLabel[status]}
    </Pill>
  );
}

/** "Data Analyst • 4–6 years" */
export function TitleLine({ talent }: { talent: Talent }) {
  return (
    <p className="flex flex-wrap items-center gap-x-4 text-sm leading-5 text-slate-700">
      <span>{talent.title}</span>
      {talent.experienceLabel && (
        <>
          <span aria-hidden="true" className="text-slate-900">•</span>
          <span>{talent.experienceLabel}</span>
        </>
      )}
    </p>
  );
}

export function InitialsAvatar({ initials, size = "lg" }: { initials: string; size?: "md" | "lg" }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "grid shrink-0 place-items-center rounded-full bg-accent-light font-bold text-accent-deep",
        size === "lg" ? "size-16 text-xl leading-7" : "size-12 text-base",
      )}
    >
      {initials}
    </span>
  );
}

export function scoreTone(score: number) {
  if (score >= 75) return "bg-success-soft text-success";
  if (score >= 50) return "bg-info-soft text-info";
  return "bg-warning-soft text-warning";
}

function Label({ children }: { children: React.ReactNode }) {
  return <h4 className="text-xs leading-4 font-medium text-muted uppercase">{children}</h4>;
}

type TalentCardProps = { talent: Talent; onViewProfile: () => void; onViewCv: () => void };

export function TalentCard({ talent, onViewProfile, onViewCv }: TalentCardProps) {
  return (
    <Card as="li" tone="hairline" className="flex flex-col gap-4 p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-4">
          <InitialsAvatar initials={talent.initials} />
          <div className="flex min-w-0 flex-col gap-0.5">
            <div className="flex flex-wrap items-center gap-2.5">
              <h3 className="text-lg leading-7 font-semibold text-ink">{talent.name}</h3>
              <TalentStatusPill status={talent.status} />
            </div>
            <TitleLine talent={talent} />
            <p className="flex items-center gap-2 text-sm leading-5 text-slate-900">
              <MapPin aria-hidden className="size-4 text-muted" strokeWidth={1.33} />
              {talent.location}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 flex-col items-center">
          <span className="grid size-14 place-items-center rounded-full bg-info-soft text-lg leading-7 font-bold text-info">
            {talent.yearsExperience}+
          </span>
          <span className="text-xs leading-4 text-slate-700">Years Exp.</span>
        </div>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex min-w-0 flex-col gap-4">
          <section className="flex flex-col gap-2">
            <Label>Skills</Label>
            {talent.skills.length ? (
              <TagList label={`${talent.name}'s skills`}>
                {talent.skills.map((s) => (
                  <Tag key={s}>{s}</Tag>
                ))}
              </TagList>
            ) : (
              <p className="text-sm leading-5 text-slate-500">Not provided</p>
            )}
          </section>
          <section className="flex flex-col gap-2">
            <Label>Qualifications</Label>
            {talent.education.length ? (
              <ul className="flex flex-col gap-1">
                {talent.education.map((e) => (
                  <li key={e} className="flex items-center gap-2 text-sm leading-5 text-slate-900">
                    <Award aria-hidden className="size-3.5 shrink-0 text-success" strokeWidth={1.17} />
                    {e}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm leading-5 text-slate-500">Not provided</p>
            )}
          </section>
        </div>

        <div className="flex shrink-0 flex-wrap gap-3 self-start sm:self-auto">
          <Button
            variant="outline-accent"
            onClick={onViewCv}
            disabled={!talent.cvUrl}
            title={talent.cvUrl ? undefined : "No CV file was uploaded"}
            icon={<FileText aria-hidden className="size-4" strokeWidth={1.33} />}
            className="gap-3 text-base leading-6 font-medium"
          >
            View CV<span className="sr-only"> of {talent.name}</span>
          </Button>
          <Button
            variant="accent"
            onClick={onViewProfile}
            icon={<Eye aria-hidden className="size-4" strokeWidth={1.33} />}
            className="gap-3 text-base leading-6 font-medium"
          >
            View Profile<span className="sr-only"> of {talent.name}</span>
          </Button>
        </div>
      </div>
    </Card>
  );
}
