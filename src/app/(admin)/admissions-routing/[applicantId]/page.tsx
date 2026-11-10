import { ApplicantView } from "../_components/ApplicantView";

type Props = { params: Promise<{ applicantId: string }> };

export const metadata = { title: "Applicant · Admissions & Routing" };

export default async function ApplicantPage({ params }: Props) {
  const { applicantId } = await params;
  return <ApplicantView studentId={decodeURIComponent(applicantId)} />;
}
