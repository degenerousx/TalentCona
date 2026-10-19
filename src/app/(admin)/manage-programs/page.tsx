import { PageHeader } from "@/components/ui/PageHeader";
import { ProgramsView } from "./_components/ProgramsView";

export const metadata = { title: "Manage Programs" };

export default function Page() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Manage Programs"
        description="Manage programs, modules, assessments, and grading configurations"
      />
      <ProgramsView />
    </div>
  );
}
