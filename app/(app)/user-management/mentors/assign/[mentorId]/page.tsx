import type { Metadata } from "next";
import { notFound } from "next/navigation";
import MentorAssign from "@/components/users/MentorAssign";
import { ASSIGNABLE_MENTOR_IDS, getAssignableMentor } from "@/components/users/assignableMentors";

type Params = { params: Promise<{ mentorId: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return ASSIGNABLE_MENTOR_IDS.map((mentorId) => ({ mentorId }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const mentor = getAssignableMentor((await params).mentorId);
  return { title: `${mentor?.name ?? "Mentor"} · Mentor Details · TalentCona` };
}

export default async function MentorAssignPage({ params }: Params) {
  const mentor = getAssignableMentor((await params).mentorId);
  if (!mentor) notFound();
  return <MentorAssign mentor={mentor} />;
}
