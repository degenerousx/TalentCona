import { Award, Eye, MapPin } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Pill } from "@/components/ui/Pill";
import { Tag, TagList } from "@/components/ui/Tag";
import { cn } from "@/lib/cn";
import type { Talent } from "./data";

export const statusLabel = { available: "Available", hired: "Hired" } as const;

/** "Frontend Engineering • Jan 2026" */
export function ProgramLine({ talent }: { talent: Talent }) {
  return (
    <p className="flex flex-wrap items-center gap-x-4 text-sm leading-5 text-slate-700">
      <span>{talent.program}</span>
      <span aria-hidden="true" className="text-slate-900">
        •
      </span>
      <span>{talent.cohort}</span>
    </p>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <h4 className="text-xs leading-4 font-medium text-muted uppercase">{children}</h4>;
}

type TalentCardProps = { talent: Talent; onViewProfile: () => void };

export function TalentCard({ talent, onViewProfile }: TalentCardProps) {
  const highGrade = talent.grade >= 90;

  return (
    <Card as="li" tone="hairline" className="flex flex-col gap-4 p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-4">
          <span
            aria-hidden="true"
            className="grid size-16 shrink-0 place-items-center rounded-full bg-accent-light text-xl leading-7 font-bold text-accent-deep"
          >
            {talent.initials}
          </span>
          <div className="flex min-w-0 flex-col gap-0.5">
            <div className="flex flex-wrap items-center gap-2.5">
              <h3 className="text-lg leading-7 font-semibold text-ink">{talent.name}</h3>
              <Pill
                tone={talent.status === "hired" ? "success" : "warning"}
                className={talent.status === "hired" ? "px-6" : "px-3.5"}
              >
                {statusLabel[talent.status]}
              </Pill>
            </div>
            <ProgramLine talent={talent} />
            <p className="flex items-center gap-2 text-sm leading-5 text-slate-900">
              <MapPin aria-hidden className="size-4 text-muted" strokeWidth={1.33} />
              {talent.location}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 flex-col items-center">
          <span
            className={cn(
              "grid size-14 place-items-center rounded-full text-lg leading-7 font-bold",
              highGrade ? "bg-success-soft text-success" : "bg-info-soft text-info",
            )}
          >
            {talent.grade}%
          </span>
          <span className="text-xs leading-4 text-slate-700">Final Grade</span>
        </div>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-4">
          <section className="flex flex-col gap-2">
            <Label>Skills</Label>
            <TagList label={`${talent.name}'s skills`}>
              {talent.skills.map((s) => (
                <Tag key={s}>{s}</Tag>
              ))}
            </TagList>
          </section>
          <section className="flex flex-col gap-2">
            <Label>Certifications</Label>
            <ul className="flex flex-col gap-1">
              {talent.certifications.map((c) => (
                <li key={c} className="flex items-center gap-2 text-sm leading-5 text-slate-900">
                  <Award aria-hidden className="size-3.5 text-success" strokeWidth={1.17} />
                  {c}
                </li>
              ))}
            </ul>
          </section>
        </div>

        <Button
          variant="accent"
          onClick={onViewProfile}
          icon={<Eye aria-hidden className="size-4" strokeWidth={1.33} />}
          className="gap-3 self-start text-base leading-6 font-medium sm:self-auto"
        >
          View Profile<span className="sr-only"> of {talent.name}</span>
        </Button>
      </div>
    </Card>
  );
}
