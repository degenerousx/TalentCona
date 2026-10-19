"use client";

import { useMemo, useState } from "react";
import { Award, Building2, CircleCheck, Clock } from "lucide-react";
import { StatCard } from "@/components/ui/StatCard";
import { TabPanel, Tabs, type TabItem } from "@/components/ui/Tabs";
import { FilterChips, ListToolbar, SearchInput } from "@/components/ui/Toolbar";
import { downloadCsv } from "@/lib/csv";
import { RequestCard } from "./RequestCard";
import { RequestDetailsModal } from "./RequestDetailsModal";
import { statusLabel, TalentCard } from "./TalentCard";
import { TalentProfileModal } from "./TalentProfileModal";
import {
  shortDate,
  talentRequests,
  talents,
  totalPositions,
  type RequestStatus,
  type TalentRequest,
  type TalentStatus,
} from "./data";

type TabId = "talents" | "requests";

const tabs: TabItem<TabId>[] = [
  { id: "talents", label: "Available Talents" },
  { id: "requests", label: "Talent Request" },
];

const ID = "talent-corner";
const matches = (query: string, fields: string[]) =>
  fields.some((f) => f.toLowerCase().includes(query.trim().toLowerCase()));

function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <p role="status" className="rounded-lg bg-white p-10 text-center text-sm text-slate-500">
      {children}
    </p>
  );
}

function TalentsPanel({ requests }: { requests: TalentRequest[] }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | TalentStatus>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const count = (s: TalentStatus) => talents.filter((t) => t.status === s).length;
  const avgGrade = Math.round(talents.reduce((sum, t) => sum + t.grade, 0) / talents.length);

  const visible = talents.filter(
    (t) =>
      (filter === "all" || t.status === filter) &&
      matches(query, [t.name, t.program, ...t.skills]),
  );

  const exportList = () =>
    downloadCsv(
      "talents.csv",
      visible.map((t) => ({
        Name: t.name,
        Program: t.program,
        Cohort: t.cohort,
        Location: t.location,
        Status: statusLabel[t.status],
        "Final Grade": `${t.grade}%`,
        Skills: t.skills.join("; "),
        Certifications: t.certifications.join("; "),
      })),
    );

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-6 sm:grid-cols-2">
        <StatCard
          label="Total Graduates"
          value={talents.length}
          icon={<Award className="text-accent" strokeWidth={2.67} />}
        />
        <StatCard
          label="Avg Grade"
          value={`${avgGrade}%`}
          valueClassName="text-accent"
          icon={<Award className="text-accent" strokeWidth={2.67} />}
        />
      </div>

      <ListToolbar
        search={
          <SearchInput
            label="Search talents"
            placeholder="Search by name, program, or skills..."
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
              { id: "all", label: `All (${talents.length})` },
              { id: "available", label: `Available (${count("available")})` },
              { id: "hired", label: `Hired (${count("hired")})` },
            ]}
          />
        }
        exportLabel="Export List"
        onExport={exportList}
      />

      {visible.length > 0 ? (
        <ul aria-label="Talents" className="flex flex-col gap-4">
          {visible.map((t) => (
            <TalentCard key={t.id} talent={t} onViewProfile={() => setSelectedId(t.id)} />
          ))}
        </ul>
      ) : (
        <EmptyState>No talents match your search.</EmptyState>
      )}

      <TalentProfileModal
        talent={talents.find((t) => t.id === selectedId) ?? null}
        requests={requests}
        onClose={() => setSelectedId(null)}
      />
    </div>
  );
}

type RequestsPanelProps = {
  requests: TalentRequest[];
  onMarkFulfilled: (id: string) => void;
};

function RequestsPanel({ requests, onMarkFulfilled }: RequestsPanelProps) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | RequestStatus>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const count = (s: RequestStatus) => requests.filter((r) => r.status === s).length;

  const visible = useMemo(
    () =>
      requests.filter(
        (r) =>
          (filter === "all" || r.status === filter) &&
          matches(query, [r.company, r.contact, r.location, ...r.roles.map((role) => role.title)]),
      ),
    [requests, filter, query],
  );

  const exportList = () =>
    downloadCsv(
      "talent-requests.csv",
      visible.map((r) => ({
        "Request ID": r.code,
        Company: r.company,
        Contact: r.contact,
        Email: r.email,
        Phone: r.phone,
        Location: r.location,
        Requested: shortDate(r.requestedOn),
        Deadline: shortDate(r.deadline),
        "Employment Type": r.employmentType,
        Positions: totalPositions(r),
        Status: r.status === "pending" ? "Pending" : "Fulfilled",
      })),
    );

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-6 md:grid-cols-3">
        <StatCard
          label="Total Requests"
          labelClassName="text-slate-500"
          value={requests.length}
          icon={<Building2 className="text-accent" strokeWidth={2.67} />}
        />
        <StatCard
          label="Pending"
          labelClassName="text-slate-500"
          value={count("pending")}
          valueClassName="text-warning"
          icon={<Clock className="text-warning" strokeWidth={2.67} />}
        />
        <StatCard
          label="Fulfilled"
          labelClassName="text-slate-500"
          value={count("fulfilled")}
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
              { id: "all", label: `All (${requests.length})` },
              { id: "pending", label: `Pending (${count("pending")})` },
              { id: "fulfilled", label: `Fulfilled (${count("fulfilled")})` },
            ]}
          />
        }
        exportLabel="Export"
        onExport={exportList}
      />

      {visible.length > 0 ? (
        <ul aria-label="Talent requests" className="flex flex-col gap-4">
          {visible.map((r) => (
            <RequestCard key={r.id} request={r} onViewDetails={() => setSelectedId(r.id)} />
          ))}
        </ul>
      ) : (
        <EmptyState>No talent requests match your search.</EmptyState>
      )}

      <RequestDetailsModal
        request={requests.find((r) => r.id === selectedId) ?? null}
        onClose={() => setSelectedId(null)}
        onMarkFulfilled={onMarkFulfilled}
      />
    </div>
  );
}

export function TalentCornerView() {
  const [tab, setTab] = useState<TabId>("talents");
  // Lives here so a request marked fulfilled stays fulfilled across tab switches.
  const [requests, setRequests] = useState<TalentRequest[]>(talentRequests);

  const markFulfilled = (id: string) =>
    setRequests((rs) => rs.map((r) => (r.id === id ? { ...r, status: "fulfilled" } : r)));

  return (
    <div className="flex flex-col gap-6">
      <Tabs idBase={ID} label="Talent Corner sections" tabs={tabs} value={tab} onChange={setTab} />
      <TabPanel idBase={ID} id={tab}>
        {tab === "talents" ? (
          <TalentsPanel requests={requests} />
        ) : (
          <RequestsPanel requests={requests} onMarkFulfilled={markFulfilled} />
        )}
      </TabPanel>
    </div>
  );
}
