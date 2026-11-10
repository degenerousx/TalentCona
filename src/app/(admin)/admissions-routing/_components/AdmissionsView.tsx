"use client";

import { useDeferredValue, useState } from "react";
import { toast } from "sonner";
import { Toaster } from "@/components/shadcn/sonner";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/States";
import { TabPanel, Tabs, type TabItem } from "@/components/ui/Tabs";
import { FilterChips, SearchInput, type FilterOption } from "@/components/ui/Toolbar";
import { useAdmissionsSummary, useFundraising, useLoans, useOnboardingQueue, useReviewLoan, useSendReminder } from "./api";
import { FundraisingCard, LoanCard, OnboardingCard } from "./cards";
import type { FundraisingCampaign, LoanApplication, OnboardingApplicant, OnboardingStage } from "./data";

type TabId = "onboarding" | "fundraising" | "loans";

const ID = "admissions";

const stageFilters: FilterOption<OnboardingStage | "all">[] = [
  { id: "all", label: "All stages" },
  { id: "personalInfo", label: "Personal Info" },
  { id: "payment", label: "Payment" },
];

const loanFilters: FilterOption<string>[] = [
  { id: "Pending", label: "Pending" },
  { id: "UnderReview", label: "Under Review" },
  { id: "Approved", label: "Approved" },
  { id: "Rejected", label: "Rejected" },
  { id: "all", label: "All" },
];

function errorMessage(error: unknown) {
  return error instanceof Error && error.message ? error.message : "Something went wrong. Please try again.";
}

type PagedQuery<T> = {
  data?: { pages: { items: T[] }[] };
  isPending: boolean;
  isError: boolean;
  error: unknown;
  isFetching: boolean;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  refetch: () => Promise<unknown>;
  fetchNextPage: () => Promise<unknown>;
};

/** Shared list frame: loading, error, empty, the items, and "Load more". */
function PagedList<T>({
  query,
  empty,
  errorTitle,
  render,
}: {
  query: PagedQuery<T>;
  empty: React.ReactNode;
  errorTitle: string;
  render: (item: T) => React.ReactNode;
}) {
  if (query.isPending) return <LoadingState variant="block" />;
  if (query.isError && !query.data) {
    return <ErrorState error={query.error} title={errorTitle} onRetry={() => void query.refetch()} retrying={query.isFetching} />;
  }
  const items = query.data?.pages.flatMap((p) => p.items) ?? [];
  if (items.length === 0) return <>{empty}</>;
  return (
    <div className="flex flex-col gap-4">
      <ul className="flex flex-col gap-4">{items.map(render)}</ul>
      {query.hasNextPage && (
        <Button variant="outline" className="self-center px-5" onClick={() => void query.fetchNextPage()} disabled={query.isFetchingNextPage}>
          {query.isFetchingNextPage ? "Loading…" : "Load more"}
        </Button>
      )}
    </div>
  );
}

function OnboardingTab() {
  const [stage, setStage] = useState<OnboardingStage | "all">("all");
  const [search, setSearch] = useState("");
  const q = useDeferredValue(search.trim());
  const queue = useOnboardingQueue(stage, q);
  const remind = useSendReminder();

  const sendReminder = (id: string, name: string) =>
    remind.mutate(id, {
      onSuccess: () => toast.success(`Reminder email sent to ${name}`),
      onError: (error) => toast.error(errorMessage(error)),
    });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="sm:w-80">
          <SearchInput label="Search the onboarding queue" placeholder="Search by name or email" value={search} onChange={setSearch} />
        </div>
        <FilterChips label="Filter by stage" options={stageFilters} value={stage} onChange={setStage} />
      </div>
      <PagedList<OnboardingApplicant>
        query={queue}
        errorTitle="Couldn't load the onboarding queue"
        empty={
          <EmptyState
            title={q || stage !== "all" ? "No matching students" : "No one is stuck in onboarding"}
            description={q || stage !== "all" ? "Try another search or stage." : "Students who stop before finishing onboarding appear here."}
          />
        }
        render={(a) => (
          <OnboardingCard
            key={a.id}
            applicant={a}
            reminding={remind.isPending && remind.variables === a.id}
            onRemind={() => sendReminder(a.id, a.name)}
          />
        )}
      />
    </div>
  );
}

function FundraisingTab() {
  return (
    <PagedList<FundraisingCampaign>
      query={useFundraising()}
      errorTitle="Couldn't load fundraising campaigns"
      empty={<EmptyState title="No active campaigns" description="Campaigns from students who haven't finished onboarding appear here." />}
      render={(c) => <FundraisingCard key={c.id} campaign={c} />}
    />
  );
}

function LoansTab() {
  const [status, setStatus] = useState("Pending");
  const loans = useLoans(status);
  const review = useReviewLoan();
  const [pending, setPending] = useState<{ loan: LoanApplication; decision: "approve" | "reject" } | null>(null);
  const [note, setNote] = useState("");

  const close = () => {
    setPending(null);
    setNote("");
  };
  const confirm = () => {
    if (!pending) return;
    const { loan, decision } = pending;
    review.mutate(
      { id: loan.id, decision, note },
      {
        onSuccess: () => {
          toast.success(`${loan.name}'s loan was ${decision === "approve" ? "approved" : "rejected"}`);
          close();
        },
        onError: (error) => toast.error(errorMessage(error)),
      },
    );
  };

  return (
    <div className="flex flex-col gap-4">
      <FilterChips label="Filter by loan status" options={loanFilters} value={status} onChange={setStatus} />
      <PagedList<LoanApplication>
        query={loans}
        errorTitle="Couldn't load loan applications"
        empty={<EmptyState title="No loan applications" description="Try another status." />}
        render={(l) => (
          <LoanCard
            key={l.id}
            loan={l}
            busy={review.isPending && review.variables?.id === l.id}
            onApprove={() => setPending({ loan: l, decision: "approve" })}
            onReject={() => setPending({ loan: l, decision: "reject" })}
          />
        )}
      />

      {pending && (
        <Modal
          open
          size="sm"
          onClose={close}
          title={pending.decision === "approve" ? "Approve loan?" : "Reject loan?"}
          subtitle={`${pending.loan.name} · ${pending.loan.amount}`}
          footer={
            <div className="flex justify-end gap-2">
              <Button variant="outline" className="px-5" onClick={close} disabled={review.isPending}>
                Cancel
              </Button>
              <Button variant="primary" className="px-4" onClick={confirm} disabled={review.isPending}>
                {review.isPending ? "Saving…" : pending.decision === "approve" ? "Approve loan" : "Reject loan"}
              </Button>
            </div>
          }
        >
          {pending.decision === "approve" ? (
            <p className="text-base leading-6 text-slate-700">
              The student will repay {pending.loan.total} over {pending.loan.period} ({pending.loan.monthly} a month).
            </p>
          ) : (
            <label className="flex flex-col gap-2 text-sm leading-5 font-medium text-slate-700">
              Note for the student (optional)
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
                maxLength={500}
                className="rounded-lg border border-slate-300 p-3 text-base font-normal focus:border-accent focus:outline-none"
              />
            </label>
          )}
        </Modal>
      )}
    </div>
  );
}

export function AdmissionsView() {
  const [tab, setTab] = useState<TabId>("onboarding");
  const summary = useAdmissionsSummary();

  const tabs: TabItem<TabId>[] = [
    { id: "onboarding", label: "Onboarding Queue", count: summary.data?.onboardingQueueCount },
    { id: "fundraising", label: "Fundraising", count: summary.data?.fundraisingCount },
    { id: "loans", label: "Loan Applications" },
  ];

  return (
    <Card className="flex flex-col gap-6 overflow-hidden">
      <Tabs idBase={ID} label="Admissions queues" tabs={tabs} value={tab} onChange={setTab} weight="regular" />

      <TabPanel idBase={ID} id={tab} className="px-4 pb-6 sm:px-6">
        {tab === "onboarding" && <OnboardingTab />}
        {tab === "fundraising" && <FundraisingTab />}
        {tab === "loans" && <LoansTab />}
      </TabPanel>
      <Toaster />
    </Card>
  );
}
