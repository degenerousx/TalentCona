"use client";

import { useState } from "react";
import { Toaster } from "@/components/shadcn/sonner";
import { TabPanel, Tabs, type TabItem } from "@/components/ui/Tabs";
import { EmployerMatchView } from "./EmployerMatchView";
import { MentorMatchView } from "./MentorMatchView";

type TabId = "mentors" | "employers";

const tabs: TabItem<TabId>[] = [
  { id: "mentors", label: "Mentor Matching" },
  { id: "employers", label: "Employer Matching" },
];

const ID = "talent-match";

export function TalentMatchView() {
  const [tab, setTab] = useState<TabId>("mentors");

  return (
    <div className="flex flex-col gap-6">
      <Tabs idBase={ID} label="Talent Match views" tabs={tabs} value={tab} onChange={setTab} />
      <TabPanel idBase={ID} id={tab}>
        {tab === "mentors" ? <MentorMatchView /> : <EmployerMatchView />}
      </TabPanel>
      <Toaster />
    </div>
  );
}
