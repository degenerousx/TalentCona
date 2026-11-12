import type { Metadata } from "next";
import StudentProfile from "../_components/students/StudentProfile";

type Params = { params: Promise<{ studentId: string }> };

export const metadata: Metadata = { title: "Student · User Management · TalentCona" };

export default async function StudentPage({ params }: Params) {
  const { studentId } = await params;
  return <StudentProfile studentId={studentId} />;
}
