import type { Metadata } from "next";
import { notFound } from "next/navigation";
import MentorReview from "@/components/users/MentorReview";
import { MENTOR_APPLICATIONS, getApplication } from "@/components/users/mentorApplications";

type Params = { params: Promise<{ applicationId: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return MENTOR_APPLICATIONS.map((a) => ({ applicationId: a.id }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const application = getApplication((await params).applicationId);
  return { title: `${application?.name ?? "Mentor"} · Mentor Details · TalentCona` };
}

export default async function MentorReviewPage({ params }: Params) {
  const application = getApplication((await params).applicationId);
  if (!application) notFound();
  return <MentorReview application={application} />;
}
