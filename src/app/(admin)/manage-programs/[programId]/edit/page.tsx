import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProgramWizard } from "../../_components/ProgramWizard";
import { draftFromProgram, getProgram, programs } from "../../_components/data";

type Props = { params: Promise<{ programId: string }> };

export function generateStaticParams() {
  return programs.map((p) => ({ programId: p.id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const program = getProgram((await params).programId);
  return { title: program ? `Edit ${program.name} · Manage Programs` : "Program not found" };
}

export default async function EditProgramPage({ params }: Props) {
  const program = getProgram((await params).programId);
  if (!program) notFound();

  return <ProgramWizard mode="edit" initial={draftFromProgram(program)} />;
}
