import { PageHeader } from "@/components/ui/PageHeader";
import { TalentCornerView } from "./_components/TalentCornerView";

export const metadata = { title: "Talent Corner" };

export default function Page() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Talent Corner"
        description="Manage available talents and company hiring requests"
      />
      <TalentCornerView />
    </div>
  );
}
