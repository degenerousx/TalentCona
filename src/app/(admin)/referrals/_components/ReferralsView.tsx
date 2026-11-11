"use client";

import { useRef, useState } from "react";
import { Download, Info } from "lucide-react";
import { Toaster } from "@/components/shadcn/sonner";
import { Card } from "@/components/ui/Card";
import { TabPanel, Tabs, type TabItem } from "@/components/ui/Tabs";
import { downloadCsv } from "@/lib/csv";
import { usePayoutRequests } from "./api";
import { naira, sampleAmbassadors, statusLabel } from "./data";
import { CommissionChart, PendingPayoutCard, StatCards } from "./Overview";
import { AmbassadorsTable, PayoutRequestsTable } from "./Tables";

type TabId = "ambassadors" | "payouts";

/**
 * Ambassador Management (Referrals), from the design video. Payout requests
 * are live; the rest is sample data until the backend adds endpoints.
 */
export function ReferralsView() {
  const [tab, setTab] = useState<TabId>("ambassadors");
  const tabsRef = useRef<HTMLDivElement>(null);
  const pending = usePayoutRequests("Pending");
  const pendingItems = pending.data?.pages.flatMap((p) => p.items) ?? [];
  const pendingTotal = pendingItems.reduce((sum, r) => sum + r.amountValue, 0);
  const pendingCount = `${pendingItems.length}${pending.hasNextPage ? "+" : ""}`;

  const tabs: TabItem<TabId>[] = [
    { id: "ambassadors", label: "Ambassadors", count: sampleAmbassadors.length },
    { id: "payouts", label: "Payout requests", count: pending.isSuccess && !pending.hasNextPage ? pendingItems.length : undefined },
  ];

  const exportReport = () =>
    downloadCsv(
      "ambassadors.csv",
      sampleAmbassadors.map((a) => ({
        Ambassador: a.name,
        Email: a.email,
        Students: a.students,
        "Student payments": naira(a.studentPayments),
        "Commission earned": naira(a.commission),
        "Commission rate": `${a.rate}%`,
        Withdrawn: naira(a.withdrawn),
        Available: naira(a.available),
        Status: statusLabel[a.status],
      })),
    );

  return (
    <div className="mx-auto flex w-full max-w-[1100px] flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-[28px] leading-[1.3] font-bold text-heading">Ambassador Management</h1>
          <p className="text-base leading-5 text-slate-900">Manage ambassadors, student referrals, commissions, and payouts</p>
        </div>
        <button
          type="button"
          onClick={exportReport}
          className="flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-white shadow-sm hover:bg-primary/90"
        >
          <Download aria-hidden className="size-4" />
          Export report
        </button>
      </div>

      <p className="flex items-start gap-2 rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-xs leading-4 text-blue-900">
        <Info aria-hidden className="mt-px size-3.5 shrink-0" />
        Payout requests are live. Ambassador figures, stat cards and the chart show sample data until the backend adds ambassador endpoints.
      </p>

      <StatCards />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <CommissionChart />
        <PendingPayoutCard
          count={pendingCount}
          total={pendingTotal}
          loading={pending.isPending}
          onReview={() => {
            setTab("payouts");
            tabsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
          }}
        />
      </div>

      <div ref={tabsRef} className="scroll-mt-4">
        <Card tone="hairline" className="overflow-hidden">
          <Tabs idBase="referrals" label="Referral records" tabs={tabs} value={tab} onChange={setTab} weight="regular" />
          <TabPanel idBase="referrals" id={tab}>
            {tab === "ambassadors" ? <AmbassadorsTable ambassadors={sampleAmbassadors} /> : <PayoutRequestsTable />}
          </TabPanel>
        </Card>
      </div>
      <Toaster />
    </div>
  );
}
