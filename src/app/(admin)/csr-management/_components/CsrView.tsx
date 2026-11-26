"use client";

import { useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { TabPanel, Tabs } from "@/components/ui/Tabs";
import { Overview } from "./Overview";
import { SponsoredTalentTab } from "./SponsoredTalent";
import { SponsorsTab } from "./Sponsors";
import { RequestsTab } from "./Requests";
import { PaymentsTab } from "./Payments";
import { SPONSORS, TALENTS, type Sponsor, type SponsoredTalent } from "./data";

/**
 * CSR & Sponsorship Management (Figma "CSR" section).
 * MOCK: sample data only, no API calls. Actions update local state and say so.
 */
const TABS = [
  { id: "overview", label: "Overview" },
  { id: "talent", label: "Sponsored Talent" },
  { id: "sponsors", label: "Sponsors" },
  { id: "requests", label: "Sponsorship Requests" },
  { id: "payments", label: "Payments" },
] as const;
export type CsrTab = (typeof TABS)[number]["id"];

export function CsrView() {
  const [tab, setTab] = useState<CsrTab>("overview");
  // Shared by tabs: students are assigned to sponsors from the Sponsors list.
  const [sponsors, setSponsors] = useState<Sponsor[]>(SPONSORS);
  const [talents, setTalents] = useState<SponsoredTalent[]>(TALENTS);
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="CSR & Sponsorship Management" description="Manage sponsorships, track funded talents, monitor contributions, and measure social impact." />
      <Tabs idBase="csr" label="CSR sections" tabs={[...TABS]} value={tab} onChange={setTab} />
      <TabPanel idBase="csr" id={tab}>
        {tab === "overview" && <Overview onOpen={setTab} talents={talents} />}
        {tab === "talent" && <SponsoredTalentTab talents={talents} setTalents={setTalents} sponsors={sponsors} />}
        {tab === "sponsors" && <SponsorsTab sponsors={sponsors} setSponsors={setSponsors} />}
        {tab === "requests" && <RequestsTab />}
        {tab === "payments" && <PaymentsTab />}
      </TabPanel>
    </div>
  );
}
