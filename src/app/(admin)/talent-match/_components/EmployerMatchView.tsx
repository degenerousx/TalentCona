"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Briefcase, FileText, Search, UserCheck } from "lucide-react";
import { StatCard } from "@/components/ui/StatCard";
import { EmptyState, ErrorState, QueryState } from "@/components/ui/States";
import { FilterChips, ListToolbar, SearchInput } from "@/components/ui/Toolbar";
import { downloadCsv } from "@/lib/csv";
import { useCandidates, useMatchCandidates } from "./api";
import { CandidateCard } from "./CandidateCard";
import { availabilityLabel, cvStatusLabel, shortDate, type Availability, type Candidate, type Requirements } from "./data";
import { RequirementsPanel } from "./RequirementsPanel";

const matchesQuery = (query: string, fields: string[]) =>
  fields.some((f) => f.toLowerCase().includes(query.trim().toLowerCase()));

/** Employer Matching: rank CVs against an employer's requirements. */
export function EmployerMatchView() {
  const candidates = useCandidates();
  const match = useMatchCandidates();
  const [requirements, setRequirements] = useState<Requirements | null>(null);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | Availability>("all");

  const all = candidates.data ?? [];
  const count = (a: Availability) => all.filter((c) => c.availability === a).length;
  const avgYears = all.length ? (all.reduce((sum, c) => sum + c.yearsExperience, 0) / all.length).toFixed(1) : "–";

  const results = requirements ? match.data : undefined;
  const resultFor = useMemo(() => new Map(results?.map((r) => [r.candidateId, r])), [results]);

  function visible(list: Candidate[]) {
    const filtered = list.filter(
      (c) =>
        (filter === "all" || c.availability === filter) &&
        matchesQuery(query, [c.name, c.headline, c.program, c.location, c.education, ...c.certifications, ...c.skills]),
    );
    // With results, best match first.
    return results ? filtered.sort((a, b) => (resultFor.get(b.id)?.score ?? 0) - (resultFor.get(a.id)?.score ?? 0)) : filtered;
  }

  function runMatch(req: Requirements) {
    setRequirements(req);
    match.mutate(req, { onError: (error) => toast.error(error instanceof Error ? error.message : "Matching failed. Please try again.") });
  }

  function clearMatch() {
    setRequirements(null);
    match.reset();
  }

  const exportList = (list: Candidate[]) =>
    downloadCsv(
      "talent-match.csv",
      list.map((c) => ({
        Name: c.name,
        Email: c.email,
        Role: c.headline,
        Program: c.program,
        Cohort: c.cohort,
        "Experience (years)": c.yearsExperience,
        Education: c.education,
        Certifications: c.certifications.join("; "),
        Location: c.location,
        Availability: availabilityLabel[c.availability],
        Skills: c.skills.join("; "),
        "CV Status": cvStatusLabel[c.cvStatus],
        "CV Submitted": shortDate(c.cvSubmittedOn),
        ...(results ? { "Match %": resultFor.get(c.id)?.score ?? "" } : {}),
      })),
    );

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-6 md:grid-cols-3">
        <StatCard label="CVs Submitted" value={candidates.data ? all.length : "–"} icon={<FileText className="text-accent" strokeWidth={2.67} />} />
        <StatCard label="Available" value={candidates.data ? count("available") : "–"} valueClassName="text-warning" icon={<UserCheck className="text-warning" strokeWidth={2.67} />} />
        <StatCard label="Avg Experience" value={candidates.data ? `${avgYears} yrs` : "–"} valueClassName="text-accent" icon={<Briefcase className="text-accent" strokeWidth={2.67} />} />
      </div>

      <RequirementsPanel matching={match.isPending} hasResults={requirements !== null} onMatch={runMatch} onClear={clearMatch} />

      {match.isError && <ErrorState error={match.error} title="Couldn't match candidates" onRetry={() => requirements && runMatch(requirements)} retrying={match.isPending} />}

      <QueryState
        query={candidates}
        isEmpty={(data) => data.length === 0}
        errorTitle="Couldn't load candidates"
        empty={<EmptyState title="No CVs yet" description="Candidates appear here once they submit a CV." />}
      >
        {(data) => {
          const list = visible(data);
          return (
            <div className="flex flex-col gap-6">
              <ListToolbar
                search={<SearchInput label="Search candidates" placeholder="Search by name, role, skills, qualifications or location..." value={query} onChange={setQuery} />}
                filters={
                  <FilterChips
                    label="Filter by availability"
                    value={filter}
                    onChange={setFilter}
                    options={[
                      { id: "all", label: `All (${data.length})` },
                      { id: "available", label: `Available (${count("available")})` },
                      { id: "employed", label: `Employed (${count("employed")})` },
                    ]}
                  />
                }
                exportLabel="Export List"
                onExport={() => exportList(list)}
              />

              {results && requirements && (
                <p role="status" className="text-sm leading-5 text-slate-700">
                  Best matches for <span className="font-semibold text-ink">{requirements.role}</span> first.
                </p>
              )}

              {list.length > 0 ? (
                <ul aria-label="Candidates" className="grid gap-6 lg:grid-cols-2">
                  {list.map((c) => (
                    <CandidateCard key={c.id} candidate={c} match={resultFor.get(c.id)} />
                  ))}
                </ul>
              ) : (
                <EmptyState icon={Search} title="No results" description="Try changing your search or filters." />
              )}
            </div>
          );
        }}
      </QueryState>
    </div>
  );
}
