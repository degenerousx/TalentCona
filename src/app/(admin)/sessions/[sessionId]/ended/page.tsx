import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SessionEnded } from "../../_components/SessionEnded";
import { getSession, recentSessions, upcomingSessions } from "../../_components/data";

type Props = { params: Promise<{ sessionId: string }> };

export function generateStaticParams() {
  return [...upcomingSessions, ...recentSessions].map((s) => ({ sessionId: s.id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const session = getSession((await params).sessionId);
  return { title: session ? `Session ended: ${session.topic} · Sessions` : "Session not found" };
}

export default async function Page({ params }: Props) {
  const session = getSession((await params).sessionId);
  if (!session) notFound();
  return <SessionEnded session={session} />;
}
