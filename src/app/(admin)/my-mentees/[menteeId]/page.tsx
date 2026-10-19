import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MenteeProfile } from "../_components/MenteeProfile";
import { getMentee, mentees } from "../_components/data";

type Props = { params: Promise<{ menteeId: string }> };

export function generateStaticParams() {
  return mentees.map((m) => ({ menteeId: m.id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const mentee = getMentee((await params).menteeId);
  return { title: mentee ? `${mentee.name} · My Mentees` : "Mentee not found" };
}

export default async function MenteePage({ params }: Props) {
  const mentee = getMentee((await params).menteeId);
  if (!mentee) notFound();
  return <MenteeProfile mentee={mentee} />;
}
