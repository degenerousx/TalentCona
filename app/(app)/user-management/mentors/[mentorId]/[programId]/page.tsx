import type { Metadata } from "next";
import { notFound } from "next/navigation";
import MentorProgram from "@/components/users/MentorProgram";
import { MENTOR_PROFILES, getMentor, getMentorAssignment, programSlug } from "@/components/users/mentors";

type Params = { params: Promise<{ mentorId: string; programId: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return MENTOR_PROFILES.flatMap((m) => m.current.map((a) => ({ mentorId: m.id, programId: programSlug(a.program) })));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { mentorId, programId } = await params;
  const mentor = getMentor(mentorId);
  const assignment = mentor && getMentorAssignment(mentor, programId);
  return { title: `${assignment?.program ?? "Program"} · ${mentor?.name ?? "Mentor"} · TalentCona` };
}

export default async function MentorProgramPage({ params }: Params) {
  const { mentorId, programId } = await params;
  const mentor = getMentor(mentorId);
  const assignment = mentor && getMentorAssignment(mentor, programId);
  if (!mentor || !assignment) notFound();
  return <MentorProgram mentor={mentor} assignment={assignment} />;
}
