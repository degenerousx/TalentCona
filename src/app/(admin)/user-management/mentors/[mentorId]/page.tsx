import type { Metadata } from "next";
import MentorProfile from "../../_components/mentors/MentorProfile";

type Params = { params: Promise<{ mentorId: string }> };

export const metadata: Metadata = { title: "Mentor · User Management · TalentCona" };

export default async function MentorPage({ params }: Params) {
  const { mentorId } = await params;
  return <MentorProfile mentorId={mentorId} />;
}
