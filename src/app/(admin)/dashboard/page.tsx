import type { Metadata } from "next";
import DashboardView from "./_components/DashboardView";

export const metadata: Metadata = {
  title: "Dashboard · TalentCona",
};

export default function DashboardPage() {
  return <DashboardView />;
}
