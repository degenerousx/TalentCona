import type { Metadata } from "next";
import ProgramDetail from "../../_components/students/ProgramDetail";

/** `programId` is the enrollment id (GET /students/admin/:id/enrollments/:enrollmentId). */
type Params = { params: Promise<{ studentId: string; programId: string }> };

export const metadata: Metadata = { title: "Student Program · User Management · TalentCona" };

export default async function ProgramPage({ params }: Params) {
  const { studentId, programId } = await params;
  return <ProgramDetail studentId={studentId} enrollmentId={programId} />;
}
