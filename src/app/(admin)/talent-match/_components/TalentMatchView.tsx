"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Award, Building2, CircleCheck, Clock, Search } from "lucide-react";
import { Toaster } from "@/components/shadcn/sonner";
import { StatCard } from "@/components/ui/StatCard";
import { EmptyState, QueryState } from "@/components/ui/States";
import { TabPanel, Tabs, type TabItem } from "@/components/ui/Tabs";
import { FilterChips, ListToolbar, SearchInput } from "@/components/ui/Toolbar";
import { downloadCsv } from "@/lib/csv";
import { scoreTalent, useConfirmMatch, useConfirmedMatches, useHiringRequests, useTalents } from "./api";
import { CvViewerModal } from "./CvViewerModal";
import { HiringRequestCard } from "./HiringRequestCard";
import { RequestDetailsModal } from "./RequestDetailsModal";
import { TalentCard } from "./TalentCard";
import { TalentProfileModal, type HireDetails } from "./TalentProfileModal";
import {
  requestStatusLabel,
  shortDate,
  talentStatusLabel,
  type HiringRequest,
  type RequestStatus,
  type Talent,
  type TalentStatus,
} from "./data";

type TabId = "talents" | "requests";
const ID = "talent-match";

const matches = (query: string, fields: (string | undefined)[]) =>
  fields.some((f) => f?.toLowerCase().includes(query.trim().toLowerCase()));

function errorText(error: unknown) {
  return error instanceof Error && error.message ? error.message : "Something went wrong. Please try again.";
}

// ---- Available Talents --------------------------------------------------------

type TalentsPanelProps = { talents: Talent[]; onViewProfile: (t: Talent) => void; onViewCv: (t: Talent) => void };

function TalentsPanel({ talents, onViewProfile, onViewCv }: TalentsPanelProps) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | TalentStatus>("all");
  const count = (s: TalentStatus) => talents.filter((t) => t.status === s).length;
  const avgYears = talents.length ? (talents.reduce((sum, t) => sum + t.yearsExperience, 0) / talents.length).toFixed(1) : "0";

  const visible = talents.filter(
    (t) =>
      (filter === "all" || t.status === filter) &&
      matches(query, [t.name, t.title, t.location, t.email, ...t.skills, ...t.education]),
  );

  const exportList = () =>
    downloadCsv(
      "talents.csv",
      visible.map((t) => ({
        Name: t.name,
        Email: t.email,
        Phone: t.phone ?? "",
        Location: t.location,
        Title: t.title,
        Experience: t.experienceLabel ?? `${t.yearsExperience}+ years`,
        Skills: t.skills.join("; "),
        Qualifications: t.education.join("; "),
        "Work Experience": t.workExperience ?? "",
        "Portfolio / LinkedIn": t.portfolioUrl ?? "",
        CV: t.cvUrl ?? "",
        Status: talentStatusLabel[t.status],
        Submitted: shortDate(t.submittedAt),
      })),
    );

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-6 sm:grid-cols-2">
        <StatCard label="Total Talents" value={talents.length} icon={<Award className="text-accent" strokeWidth={2.67} />} />
        <StatCard label="Avg Experience" value={`${avgYears} yrs`} valueClassName="text-accent" icon={<Award className="text-accent" strokeWidth={2.67} />} />
      </div>

      <ListToolbar
        search={<SearchInput label="Search talents" placeholder="Search by name, title, skills, or location..." value={query} onChange={setQuery} />}
        filters={
          <FilterChips
            label="Filter by status"
            value={filter}
            onChange={setFilter}
            options={[
              { id: "all", label: `All (${talents.length})` },
              { id: "new", label: `New (${count("new")})` },
              { id: "in-review", label: `In review (${count("in-review")})` },
              { id: "matched", label: `Matched (${count("matched")})` },
            ]}
          />
        }
        exportLabel="Export List"
        onExport={exportList}
      />

      {visible.length > 0 ? (
        <ul aria-label="Available talents" className="flex flex-col gap-4">
          {visible.map((t) => (
            <TalentCard key={t.id} talent={t} onViewProfile={() => onViewProfile(t)} onViewCv={() => onViewCv(t)} />
          ))}
        </ul>
      ) : (
        <EmptyState icon={Search} title="No results" description="Try changing your search or filters." />
      )}
    </div>
  );
}

// ---- Hiring Requests ----------------------------------------------------------

type RequestsPanelProps = {
  requests: HiringRequest[];
  matchedNames: (requestId: string) => string[];
  onViewDetails: (r: HiringRequest) => void;
};

function RequestsPanel({ requests, matchedNames, onViewDetails }: RequestsPanelProps) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | RequestStatus>("all");
  const count = (s: RequestStatus) => requests.filter((r) => r.status === s).length;

  const visible = requests.filter(
    (r) =>
      (filter === "all" || r.status === filter) &&
      matches(query, [r.organization, r.contactName, r.role, r.location, ...r.requiredSkills]),
  );

  const exportList = () =>
    downloadCsv(
      "hiring-requests.csv",
      visible.map((r) => ({
        Organization: r.organization,
        Contact: r.contactName,
        Email: r.email,
        Phone: r.phone ?? "",
        Website: r.website ?? "",
        Location: r.location,
        Role: r.role,
        "Required Skills": r.requiredSkills.join("; "),
        Experience: r.experienceLabel ?? "",
        "Employment Type": r.employmentType,
        "Work Mode": r.workMode,
        Positions: r.positions,
        Deadline: r.deadline ? shortDate(r.deadline) : "",
        Requested: shortDate(r.submittedAt),
        Status: requestStatusLabel[r.status],
        "Matched Talents": matchedNames(r.id).join("; "),
      })),
    );

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-6 md:grid-cols-3">
        <StatCard label="Total Requests" labelClassName="text-slate-500" value={requests.length} icon={<Building2 className="text-accent" strokeWidth={2.67} />} />
        <StatCard label="Pending" labelClassName="text-slate-500" value={count("pending")} valueClassName="text-warning" icon={<Clock className="text-warning" strokeWidth={2.67} />} />
        <StatCard label="Fulfilled" labelClassName="text-slate-500" value={count("fulfilled")} valueClassName="text-success" icon={<CircleCheck className="text-success" strokeWidth={2.67} />} />
      </div>

      <ListToolbar
        search={<SearchInput label="Search hiring requests" placeholder="Search by company, contact, location, or role..." value={query} onChange={setQuery} />}
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
        <ul aria-label="Hiring requests" className="flex flex-col gap-4">
          {visible.map((r) => (
            <HiringRequestCard key={r.id} request={r} onViewDetails={() => onViewDetails(r)} />
          ))}
        </ul>
      ) : (
        <EmptyState icon={Search} title="No results" description="Try changing your search or filters." />
      )}
    </div>
  );
}

// ---- Page -----------------------------------------------------------------------

export function TalentMatchView() {
  const [tab, setTab] = useState<TabId>("talents");
  const talentsQuery = useTalents();
  const requestsQuery = useHiringRequests();
  const confirmed = useConfirmedMatches();
  const confirmMatch = useConfirmMatch();

  const [profile, setProfile] = useState<Talent | null>(null);
  const [cv, setCv] = useState<Talent | null>(null);
  const [matching, setMatching] = useState<HiringRequest | null>(null);

  // Confirmed matches mark their talents and requests as Matched.
  const confirmedList = useMemo(() => confirmed.data ?? [], [confirmed.data]);
  const talents = useMemo(() => {
    const ids = new Set(confirmedList.map((m) => m.talentId));
    return talentsQuery.data?.map((t) => (ids.has(t.id) ? { ...t, status: "matched" as const } : t));
  }, [talentsQuery.data, confirmedList]);
  const requests = useMemo(() => {
    const ids = new Set(confirmedList.map((m) => m.requestId));
    return requestsQuery.data?.map((r) => (ids.has(r.id) ? { ...r, status: "fulfilled" as const } : r));
  }, [requestsQuery.data, confirmedList]);

  const talentName = (id: string) => talents?.find((t) => t.id === id)?.name ?? "Unknown talent";
  const matchedNames = (requestId: string) =>
    confirmedList.filter((m) => m.requestId === requestId).map((m) => talentName(m.talentId));
  const confirmedForMatching = new Set(confirmedList.filter((m) => m.requestId === matching?.id).map((m) => m.talentId));

  function confirm(request: HiringRequest, talentId: string, score: number, hire?: Omit<HireDetails, "requestId">) {
    confirmMatch.mutate(
      { requestId: request.id, talentId, score, ...hire },
      {
        onSuccess: () => toast.success(`${request.organization}'s request fulfilled: matched with ${talentName(talentId)}`),
        onError: (error) => toast.error(errorText(error)),
      },
    );
  }

  function recordHire(talent: Talent, { requestId, hiredOn, role }: HireDetails) {
    const request = requests?.find((r) => r.id === requestId);
    if (request) confirm(request, talent.id, scoreTalent(talent, request).score, { hiredOn, role });
  }

  // The latest confirmed match of the open profile.
  const profileMatch = profile ? [...confirmedList].reverse().find((m) => m.talentId === profile.id) : undefined;

  const tabs: TabItem<TabId>[] = [
    { id: "talents", label: "Available Talents", count: talents?.length },
    { id: "requests", label: "Hiring Requests", count: requests?.length },
  ];

  return (
    <div className="flex flex-col gap-6">
      <Tabs idBase={ID} label="Talent Match sections" tabs={tabs} value={tab} onChange={setTab} />
      <TabPanel idBase={ID} id={tab}>
        {tab === "talents" ? (
          <QueryState
            query={talentsQuery}
            isEmpty={(d) => d.length === 0}
            errorTitle="Couldn't load talents"
            empty={<EmptyState title="No talents yet" description="Talents appear here as soon as they submit the talent network form." />}
          >
            {() => <TalentsPanel talents={talents ?? []} onViewProfile={setProfile} onViewCv={setCv} />}
          </QueryState>
        ) : (
          <QueryState
            query={requestsQuery}
            isEmpty={(d) => d.length === 0}
            errorTitle="Couldn't load hiring requests"
            empty={<EmptyState icon={Building2} title="No hiring requests yet" description="Requests appear here as soon as an organization submits the hiring form." />}
          >
            {() => <RequestsPanel requests={requests ?? []} matchedNames={matchedNames} onViewDetails={setMatching} />}
          </QueryState>
        )}
      </TabPanel>

      <RequestDetailsModal
        request={matching ? (requests?.find((r) => r.id === matching.id) ?? matching) : null}
        talents={talents ?? []}
        confirmedIds={confirmedForMatching}
        confirming={confirmMatch.isPending}
        onConfirm={(talentId, score) => matching && confirm(matching, talentId, score)}
        onViewProfile={setProfile}
        onClose={() => setMatching(null)}
      />
      <TalentProfileModal
        talent={profile}
        requests={requests ?? []}
        match={profileMatch}
        saving={confirmMatch.isPending}
        onHire={recordHire}
        onViewCv={setCv}
        onClose={() => setProfile(null)}
      />
      <CvViewerModal talent={cv} onClose={() => setCv(null)} />
      <Toaster />
    </div>
  );
}
