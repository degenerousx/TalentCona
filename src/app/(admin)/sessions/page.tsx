import { PageHeader } from "@/components/ui/PageHeader";
import { SessionsView } from "./_components/SessionsView";

export const metadata = { title: "Mentorship Sessions" };

export default function Page() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Mentorship Sessions" description="Manage bookings and provide feedback" />
      <SessionsView />
    </div>
  );
}
