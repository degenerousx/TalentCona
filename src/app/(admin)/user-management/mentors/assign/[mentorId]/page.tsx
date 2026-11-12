import type { Metadata } from "next";
import MentorAssign from "../../../_components/mentors/MentorAssign";

type Params = { params: Promise<{ mentorId: string }> };

export const metadata: Metadata = { title: "Assign Mentor · TalentCona" };

export default async function MentorAssignPage({ params }: Params) {
  const { mentorId } = await params;
  return <MentorAssign mentorId={mentorId} />;
}
