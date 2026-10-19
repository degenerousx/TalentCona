import { PageHeader } from "@/components/ui/PageHeader";
import { AdmissionsView } from "./_components/AdmissionsView";

export const metadata = { title: "Admissions & Routing" };

export default function Page() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Admissions & Routing"
        description="Manage onboarding, and loan applications"
      />
      <AdmissionsView />
    </div>
  );
}
