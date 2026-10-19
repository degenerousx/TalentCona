import type { Metadata } from "next";
import { notFound } from "next/navigation";
import MentorProfile from "../../_components/mentors/MentorProfile";
import { MENTOR_PROFILES, getMentor } from "../../_components/data/mentors";

type Params = { params: Promise<{ mentorId: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return MENTOR_PROFILES.map((m) => ({ mentorId: m.id }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const mentor = getMentor((await params).mentorId);
  return { title: `${mentor?.name ?? "Mentor"} · User Management · TalentCona` };
}

export default async function MentorPage({ params }: Params) {
  const mentor = getMentor((await params).mentorId);
  if (!mentor) notFound();
  return <MentorProfile mentor={mentor} />;
}
