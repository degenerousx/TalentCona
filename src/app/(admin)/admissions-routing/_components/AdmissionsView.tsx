"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { TabPanel, Tabs, type TabItem } from "@/components/ui/Tabs";
import { FundraisingCard, LoanCard, OnboardingCard } from "./cards";
import { fundraisingCampaigns, loanApplications, onboardingQueue } from "./data";

type TabId = "onboarding" | "fundraising" | "loans";

const tabs: TabItem<TabId>[] = [
  { id: "onboarding", label: "Onboarding Queue", count: onboardingQueue.length },
  { id: "fundraising", label: "Fundraising", count: fundraisingCampaigns.length },
  { id: "loans", label: "Loan Applications", count: loanApplications.length },
];

const ID = "admissions";

export function AdmissionsView() {
  const [tab, setTab] = useState<TabId>("onboarding");

  return (
    <Card className="flex flex-col gap-6 overflow-hidden">
      <Tabs
        idBase={ID}
        label="Admissions queues"
        tabs={tabs}
        value={tab}
        onChange={setTab}
        weight="regular"
      />

      <TabPanel idBase={ID} id={tab} className="px-4 pb-6 sm:px-6">
        <ul className="flex flex-col gap-4">
          {tab === "onboarding" &&
            onboardingQueue.map((a) => <OnboardingCard key={a.id} applicant={a} />)}
          {tab === "fundraising" &&
            fundraisingCampaigns.map((c) => <FundraisingCard key={c.id} campaign={c} />)}
          {tab === "loans" && loanApplications.map((l) => <LoanCard key={l.id} loan={l} />)}
        </ul>
      </TabPanel>
    </Card>
  );
}
