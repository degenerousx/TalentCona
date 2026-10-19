import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AssessmentView } from "../../../_components/AssessmentView";
import { getProgram, programs, sampleAssessment } from "../../../_components/data";

type Props = { params: Promise<{ programId: string; moduleId: string }> };

export function generateStaticParams() {
  return programs.flatMap((p) =>
    (getProgram(p.id)?.modulesList ?? []).map((m) => ({ programId: p.id, moduleId: m.id })),
  );
}

async function load(params: Props["params"]) {
  const { programId, moduleId } = await params;
  const program = getProgram(programId);
  const moduleItem = program?.modulesList.find((m) => m.id === moduleId);
  return program && moduleItem ? { program, moduleItem } : null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const found = await load(params);
  return { title: found ? `${found.moduleItem.title} Assessment · Manage Programs` : "Assessment not found" };
}

/** Preview of the learner test. Questions are the design's sample set until the API exists. */
export default async function AssessmentPage({ params }: Props) {
  const found = await load(params);
  if (!found) notFound();
  const { program, moduleItem } = found;

  return (
    <AssessmentView
      backHref={`/manage-programs/${program.id}`}
      assessment={{
        ...sampleAssessment,
        course: program.name,
        title: `Module ${moduleItem.order} Assessment`,
        passingScore: moduleItem.mcqPass ?? sampleAssessment.passingScore,
      }}
    />
  );
}
