import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ProgramDetail from "../../_components/students/ProgramDetail";
import { STUDENTS, getProgram, getStudent, programsOf } from "../../_components/data/students";

type Params = { params: Promise<{ studentId: string; programId: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return STUDENTS.flatMap((s) => programsOf(s).map((p) => ({ studentId: s.id, programId: p.id })));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { studentId, programId } = await params;
  const student = getStudent(studentId);
  const program = student && getProgram(student, programId);
  return { title: `${program?.title ?? "Program"} · ${student?.name ?? "Student"} · TalentCona` };
}

export default async function ProgramPage({ params }: Params) {
  const { studentId, programId } = await params;
  const student = getStudent(studentId);
  const program = student && getProgram(student, programId);
  if (!student || !program) notFound();
  return <ProgramDetail student={student} program={program} />;
}
