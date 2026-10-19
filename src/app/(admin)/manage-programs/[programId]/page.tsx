import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProgramDetailView } from "../_components/ProgramDetailView";
import { getProgram, programs } from "../_components/data";

type Props = { params: Promise<{ programId: string }> };

export function generateStaticParams() {
  return programs.map((p) => ({ programId: p.id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const program = getProgram((await params).programId);
  return { title: program ? `${program.name} · Manage Programs` : "Program not found" };
}

export default async function ProgramPage({ params }: Props) {
  const program = getProgram((await params).programId);
  if (!program) notFound();

  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/manage-programs"
        className="self-start rounded text-base leading-6 font-semibold text-slate-900 hover:text-primary"
      >
        <span aria-hidden="true">← </span>Back<span className="sr-only"> to Manage Programs</span>
      </Link>

      <ProgramDetailView program={program} />
    </div>
  );
}
