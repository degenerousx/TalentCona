import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ChatView } from "../../_components/ChatView";
import { getMentee, mentees } from "../../_components/data";

type Props = { params: Promise<{ menteeId: string }> };

export function generateStaticParams() {
  return mentees.map((m) => ({ menteeId: m.id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const mentee = getMentee((await params).menteeId);
  return { title: mentee ? `Chat with ${mentee.name} · My Mentees` : "Mentee not found" };
}

export default async function ChatPage({ params }: Props) {
  const mentee = getMentee((await params).menteeId);
  if (!mentee) notFound();
  return <ChatView mentee={mentee} />;
}
