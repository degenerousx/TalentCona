import { Briefcase, CalendarDays, Code, MapPin, Star, Users } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Pill } from "@/components/ui/Pill";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Tag, TagList } from "@/components/ui/Tag";
import { Avatar, InfoRow } from "./CandidateCard";
import { openSlots, type Mentor } from "./data";

export function MentorCard({ mentor }: { mentor: Mentor }) {
  const free = openSlots(mentor);
  const full = free === 0;

  return (
    <Card as="li" tone="hairline" className="flex flex-col gap-5 p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-4">
          <Avatar person={mentor} />
          <div className="flex min-w-0 flex-col gap-1">
            <div className="flex flex-wrap items-center gap-2.5">
              <h3 className="text-lg leading-7 font-semibold text-ink">{mentor.name}</h3>
              <Pill tone={full ? "neutral" : "success"}>{full ? "Full" : "Available"}</Pill>
            </div>
            <p className="text-sm leading-5 text-slate-700">{mentor.title}</p>
          </div>
        </div>
        <p className="flex shrink-0 items-center gap-1 text-sm leading-5 font-semibold text-ink" title="Average mentee rating">
          <Star aria-hidden className="size-4 fill-warning text-warning" strokeWidth={1.33} />
          {mentor.rating.toFixed(1)}
          <span className="sr-only"> out of 5</span>
        </p>
      </div>

      <dl aria-label={`${mentor.name}'s key information`} className="divide-y divide-hairline border-y border-hairline py-3">
        <InfoRow icon={Code} label="Expertise">
          <TagList label={`${mentor.name}'s expertise`}>
            {mentor.expertise.map((e) => (
              <Tag key={e}>{e}</Tag>
            ))}
          </TagList>
        </InfoRow>
        <InfoRow icon={Briefcase} label="Experience">{mentor.yearsExperience} years</InfoRow>
        <InfoRow icon={MapPin} label="Location">{mentor.location}</InfoRow>
        <InfoRow icon={CalendarDays} label="Available">{mentor.availableDays.join(", ")}</InfoRow>
        <InfoRow icon={Users} label="Mentees">
          <span className="flex flex-col gap-1.5">
            <span>
              {mentor.currentMentees} of {mentor.maxMentees} · <span className={full ? "text-slate-500" : "text-success"}>{full ? "no places left" : `${free} ${free === 1 ? "place" : "places"} free`}</span>
            </span>
            <ProgressBar
              value={(mentor.currentMentees / mentor.maxMentees) * 100}
              label={`${mentor.name}'s mentee capacity`}
              barClassName={full ? "bg-slate-400" : "bg-accent"}
            />
          </span>
        </InfoRow>
      </dl>
    </Card>
  );
}
