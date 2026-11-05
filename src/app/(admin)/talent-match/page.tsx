import { PageHeader } from "@/components/ui/PageHeader";
import { TalentMatchView } from "./_components/TalentMatchView";

export const metadata = { title: "Talent Match" };

export default function Page() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Talent Match"
        description="Match available talents with organizations' hiring requests"
      />
      <TalentMatchView />
    </div>
  );
}
