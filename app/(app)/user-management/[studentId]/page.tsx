import type { Metadata } from "next";
import { notFound } from "next/navigation";
import StudentProfile from "@/components/users/StudentProfile";
import { STUDENTS, getStudent } from "@/components/users/data";

type Params = { params: Promise<{ studentId: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return STUDENTS.map((s) => ({ studentId: s.id }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const student = getStudent((await params).studentId);
  return { title: `${student?.name ?? "Student"} · User Management · TalentCona` };
}

export default async function StudentPage({ params }: Params) {
  const student = getStudent((await params).studentId);
  if (!student) notFound();
  return <StudentProfile student={student} />;
}
