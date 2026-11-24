import type { Metadata } from "next";
import { CsrView } from "./_components/CsrView";

export const metadata: Metadata = {
  title: "CSR & Sponsorship Management · TalentCona",
  description: "Manage sponsorships, track funded talents, monitor contributions, and measure social impact.",
};

/** Mock design: sample data only, no API calls. */
export default function CsrManagementPage() {
  return <CsrView />;
}
