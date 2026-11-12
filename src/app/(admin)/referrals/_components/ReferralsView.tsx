"use client";

import { useRef } from "react";
import { Download, Info } from "lucide-react";
import { toast } from "sonner";
import { Toaster } from "@/components/shadcn/sonner";
import { Card } from "@/components/ui/Card";
import { TabPanel, Tabs, type TabItem } from "@/components/ui/Tabs";
import { downloadCsv } from "@/lib/csv";
import { useAllPayouts, usePayoutRequests } from "./api";
import { ambassadorsFrom, naira, statusLabel } from "./data";
import { CommissionChart, PendingPayoutCard, StatCards } from "./Overview";
import { PayoutRequests } from "./PayoutRequests";
import { AmbassadorsTable } from "./Tables";
import { useHashTab } from "@/lib/useHashTab";

/** Tabs, in the URL hash so links (e.g. from notifications) can open one. */
const REFERRAL_TABS = ["ambassadors", "payouts"] as const;

type TabId = "ambassadors" | "payouts";

/**
 * Ambassador Management (Referrals), from the design videos. Everything comes
 * from the backend's payout (withdrawal) records — the only admin referral
 * data it offers.
 */
export function ReferralsView() {
  const [tab, setTab] = useHashTab(REFERRAL_TABS);
  const tabsRef = useRef<HTMLDivElement>(null);
  const pending = usePayoutRequests("Pending");
  const pendingItems = pending.data?.pages.flatMap((p) => p.items) ?? [];
  const pendingTotal = pendingItems.reduce((sum, r) => sum + r.amountValue, 0);
  const pendingCount = `${pendingItems.length}${pending.hasNextPage ? "+" : ""}`;
  const all = useAllPayouts();
  const payouts = all.data ?? [];
  const ambassadors = ambassadorsFrom(payouts);

  const tabs: TabItem<TabId>[] = [
    { id: "ambassadors", label: "Ambassadors", count: all.isSuccess ? ambassadors.length : undefined },
    { id: "payouts", label: "Payout requests", count: pending.isSuccess && !pending.hasNextPage ? pendingItems.length : undefined },
  ];

  const exportReport = () => {
    if (!all.isSuccess) return toast.error("The report is still loading. Try again in a moment.");
    if (ambassadors.length === 0) return toast.info("Nothing to export yet.");
    toast.success("Report export started");
    downloadCsv(
      "ambassadors.csv",
      ambassadors.map((a) => ({
        Ambassador: a.name,
        Email: a.email,
        Requests: a.requests,
        Requested: naira(a.requested),
        "Paid out": naira(a.paidOut),
        Outstanding: naira(a.outstanding),
        "Last request": new Date(a.lastRequest).toLocaleDateString("en-GB"),
        Status: statusLabel[a.status],
      })),
    );
  };

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

      {all.isError && !all.data && (
        <p role="alert" className="flex items-start gap-2 rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-xs leading-4 text-red-800">
          <Info aria-hidden className="mt-px size-3.5 shrink-0" />
          Couldn&apos;t load payout records, so the figures below are empty. {all.error instanceof Error ? all.error.message : ""}
        </p>
      )}

      <StatCards payouts={payouts} loading={all.isPending} />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <CommissionChart payouts={payouts} />
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
            {tab === "ambassadors" ? <AmbassadorsTable
                ambassadors={ambassadors}
                payouts={payouts}
                loading={all.isPending}
                error={all.isError && !all.data ? all.error : null}
                onRetry={() => void all.refetch()}
                retrying={all.isFetching}
                onReviewPayouts={() => {
                  setTab("payouts");
                  tabsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
                }}
              /> : <PayoutRequests />}
          </TabPanel>
        </Card>
      </div>
      <Toaster />
    </div>
  );
}
