"use client";

import { useDeferredValue, useState } from "react";
import { Award, Building2, CircleCheck, Clock } from "lucide-react";
import { toast } from "sonner";
import { Toaster } from "@/components/shadcn/sonner";
import { Button } from "@/components/ui/Button";
import { StatCard } from "@/components/ui/StatCard";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/States";
import { TabPanel, Tabs, type TabItem } from "@/components/ui/Tabs";
import { FilterChips, ListToolbar, SearchInput } from "@/components/ui/Toolbar";
import { downloadCsv } from "@/lib/csv";
import { fetchAllRequests, fetchAllTalents, useRequestSummary, useTalentRequests, useTalents, useTalentSummary } from "./api";
import { RequestCard } from "./RequestCard";
import { RequestDetailsModal } from "./RequestDetailsModal";
import { statusLabel, TalentCard } from "./TalentCard";
import { TalentProfileModal } from "./TalentProfileModal";
import { shortDate, type RequestStatus, type Talent, type TalentRequest, type TalentStatus } from "./data";

type TabId = "talents" | "requests";

const tabs: TabItem<TabId>[] = [
  { id: "talents", label: "Available Talents" },
  { id: "requests", label: "Talent Request" },
];

const ID = "talent-corner";

const errorMessage = (error: unknown) =>
  error instanceof Error && error.message ? error.message : "Something went wrong. Please try again.";

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

/** Loading, error, empty, the items, and "Load more". */
function PagedList<T>({
  query,
  label,
  errorTitle,
  empty,
  render,
}: {
  query: PagedQuery<T>;
  label: string;
  errorTitle: string;
  empty: React.ReactNode;
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
      <ul aria-label={label} className="flex flex-col gap-4">
        {items.map(render)}
      </ul>
      {query.hasNextPage && (
        <Button variant="outline" className="self-center px-5" onClick={() => void query.fetchNextPage()} disabled={query.isFetchingNextPage}>
          {query.isFetchingNextPage ? "Loading…" : "Load more"}
        </Button>
      )}
    </div>
  );
}

const count = (n: number | undefined) => (n === undefined ? "…" : n);

function useExport<T>(load: () => Promise<T[]>, file: string, row: (item: T) => Record<string, string | number>) {
  const [busy, setBusy] = useState(false);
  const run = async () => {
    setBusy(true);
    try {
      const items = await load();
      if (items.length === 0) toast.info("Nothing to export with these filters.");
      else downloadCsv(file, items.map(row));
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setBusy(false);
    }
  };
  return { busy, run };
}

function TalentsPanel() {
  const [query, setQuery] = useState("");
  const q = useDeferredValue(query.trim());
  const [filter, setFilter] = useState<"all" | TalentStatus>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const summary = useTalentSummary().data;
  const talents = useTalents(filter, q);

  const exporter = useExport<Talent>(() => fetchAllTalents(filter, q), "talents.csv", (t) => ({
    Name: t.name,
    Email: t.email,
    Program: t.program,
    Cohort: t.cohort,
    Location: t.location,
    Status: statusLabel[t.status],
    "Final Grade": t.grade === null ? "" : `${t.grade}%`,
    Seeking: t.seeking,
    "Target Role": t.targetRole,
    Skills: t.skills.join("; "),
    Certifications: t.certifications.join("; "),
  }));

  const filtered = q || filter !== "all";

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-6 sm:grid-cols-2">
        <StatCard label="Total Graduates" value={count(summary?.totalGraduates)} icon={<Award className="text-accent" strokeWidth={2.67} />} />
        <StatCard
          label="Avg Grade"
          value={summary ? (summary.averageFinalGradePercent == null ? "-" : `${Math.round(summary.averageFinalGradePercent)}%`) : "…"}
          valueClassName="text-accent"
          icon={<Award className="text-accent" strokeWidth={2.67} />}
        />
      </div>

      <ListToolbar
        search={<SearchInput label="Search talents" placeholder="Search by name, program, or skills..." value={query} onChange={setQuery} />}
        filters={
          <FilterChips
            label="Filter by status"
            value={filter}
            onChange={setFilter}
            options={[
              { id: "all", label: `All (${count(summary?.totalGraduates)})` },
              { id: "available", label: `Available (${count(summary?.availableCount)})` },
              { id: "hired", label: `Hired (${count(summary?.hiredCount)})` },
            ]}
          />
        }
        exportLabel={exporter.busy ? "Exporting…" : "Export List"}
        onExport={() => void exporter.run()}
      />

      <PagedList<Talent>
        query={talents}
        label="Talents"
        errorTitle="Couldn't load talents"
        empty={
          <EmptyState
            title={filtered ? "No talents match your search" : "No graduates in the talent pool yet"}
            description={filtered ? "Try another name, program, skill or status." : "Graduates appear here once they finish a program and opt in."}
          />
        }
        render={(t) => <TalentCard key={t.id} talent={t} onViewProfile={() => setSelectedId(t.id)} />}
      />

      {selectedId && <TalentProfileModal talentId={selectedId} onClose={() => setSelectedId(null)} />}
    </div>
  );
}

function RequestsPanel() {
  const [query, setQuery] = useState("");
  const search = useDeferredValue(query.trim());
  const [filter, setFilter] = useState<"all" | RequestStatus>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const summary = useRequestSummary().data;
  const requests = useTalentRequests(filter, search);

  const exporter = useExport<TalentRequest>(() => fetchAllRequests(filter, search), "talent-requests.csv", (r) => ({
    "Request ID": r.code,
    Company: r.company,
    Contact: r.contact,
    Email: r.email,
    Phone: r.phone,
    Location: r.location,
    Requested: shortDate(r.requestedOn),
    Deadline: shortDate(r.deadline),
    "Employment Type": r.employmentType,
    Roles: r.roles.map((role) => `${role.title} (${role.positions})`).join("; "),
    Positions: r.totalPositions,
    Status: r.status === "pending" ? "Pending" : "Fulfilled",
  }));

  const filtered = search || filter !== "all";

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-6 md:grid-cols-3">
        <StatCard label="Total Requests" labelClassName="text-slate-500" value={count(summary?.total)} icon={<Building2 className="text-accent" strokeWidth={2.67} />} />
        <StatCard
          label="Pending"
          labelClassName="text-slate-500"
          value={count(summary?.pending)}
          valueClassName="text-warning"
          icon={<Clock className="text-warning" strokeWidth={2.67} />}
        />
        <StatCard
          label="Fulfilled"
          labelClassName="text-slate-500"
          value={count(summary?.fulfilled)}
          valueClassName="text-success"
          icon={<CircleCheck className="text-success" strokeWidth={2.67} />}
        />
      </div>

      <ListToolbar
        search={
          <SearchInput
            label="Search talent requests"
            placeholder="Search by company, contact, location, or role..."
            value={query}
            onChange={setQuery}
          />
        }
        filters={
          <FilterChips
            label="Filter by status"
            value={filter}
            onChange={setFilter}
            options={[
              { id: "all", label: `All (${count(summary?.total)})` },
              { id: "pending", label: `Pending (${count(summary?.pending)})` },
              { id: "fulfilled", label: `Fulfilled (${count(summary?.fulfilled)})` },
            ]}
          />
        }
        exportLabel={exporter.busy ? "Exporting…" : "Export"}
        onExport={() => void exporter.run()}
      />

      <PagedList<TalentRequest>
        query={requests}
        label="Talent requests"
        errorTitle="Couldn't load talent requests"
        empty={
          <EmptyState
            title={filtered ? "No talent requests match your search" : "No talent requests yet"}
            description={filtered ? "Try another company, contact, location, role or status." : "Requests from companies appear here."}
          />
        }
        render={(r) => <RequestCard key={r.id} request={r} onViewDetails={() => setSelectedId(r.id)} />}
      />

      {selectedId && <RequestDetailsModal requestId={selectedId} onClose={() => setSelectedId(null)} />}
    </div>
  );
}

export function TalentCornerView() {
  const [tab, setTab] = useState<TabId>("talents");

  return (
    <div className="flex flex-col gap-6">
      <Tabs idBase={ID} label="Talent Corner sections" tabs={tabs} value={tab} onChange={setTab} />
      <TabPanel idBase={ID} id={tab}>
        {tab === "talents" ? <TalentsPanel /> : <RequestsPanel />}
      </TabPanel>
      <Toaster />
    </div>
  );
}
