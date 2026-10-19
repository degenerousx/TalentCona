import { PageHeader } from "@/components/ui/PageHeader";
import { ReportsView } from "./_components/ReportsView";

export const metadata = { title: "Reports & Insights" };

export default function Page() {
  return (
    <div className="flex flex-col gap-8">
      <PageHeader title="Reports & Insights" description="Comprehensive analytics and AI audit trails" />
      <ReportsView />
    </div>
  );
}
