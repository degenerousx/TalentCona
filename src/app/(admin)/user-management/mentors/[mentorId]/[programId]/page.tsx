import type { Metadata } from "next";
import MentorProgram from "../../../_components/mentors/MentorProgram";

type Params = { params: Promise<{ mentorId: string; programId: string }> };

export const metadata: Metadata = { title: "Mentor Program · User Management · TalentCona" };

export default async function MentorProgramPage({ params }: Params) {
  const { mentorId, programId } = await params;
  return <MentorProgram mentorId={mentorId} programId={programId} />;
}
