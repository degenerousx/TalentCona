import { ButtonLink } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";
import { ProgramsView } from "./_components/ProgramsView";

export const metadata = { title: "Manage Programs" };

export default function Page() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <PageHeader
          title="Manage Programs"
          description="Manage programs, modules, assessments, and grading configurations"
        />
        <ButtonLink href="/manage-programs/grading" size="md" variant="outline" className="font-semibold">
          Grading Rubrics
        </ButtonLink>
      </div>
      <ProgramsView />
    </div>
  );
}
