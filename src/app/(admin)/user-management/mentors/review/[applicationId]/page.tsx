import type { Metadata } from "next";
import MentorReview from "../../../_components/mentors/MentorReview";

/** `applicationId` is the mentor's user id: review actions are POST /mentors/admin/:mentorId/…. */
type Params = { params: Promise<{ applicationId: string }> };

export const metadata: Metadata = { title: "Mentor Details · TalentCona" };

export default async function MentorReviewPage({ params }: Params) {
  const { applicationId } = await params;
  return <MentorReview mentorId={applicationId} />;
}
