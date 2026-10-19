import { PageHeader } from "@/components/ui/PageHeader";
import { MenteesView } from "./_components/MenteesView";

export const metadata = { title: "My Mentees" };

export default function Page() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="My Mentees" description="Track progress and provide guidance" />
      <MenteesView />
    </div>
  );
}
