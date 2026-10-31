import { useMutation, useQuery } from "@tanstack/react-query";
import { candidates, type Candidate, type MatchResult, type Requirements } from "./data";

/**
 * Talent Match ↔ backend. There are no CV or matching endpoints yet, so these
 * hooks serve the sample data in `data.ts`. To integrate, replace each
 * queryFn/mutationFn with an `api()` call from `@/lib/api` and map the
 * response to the types in `data.ts` here — components only use these hooks.
 */

const keys = {
  candidates: ["talent-match", "candidates"] as const,
};

/** Every student/user who has submitted a CV. */
export function useCandidates() {
  return useQuery({
    queryKey: keys.candidates,
    // TODO(backend): e.g. api<ApiPage<ApiCandidate>>("/talent-match/admin/candidates")
    queryFn: async (): Promise<Candidate[]> => candidates,
  });
}

const normalise = (value: string) => value.trim().toLowerCase();

/**
 * Stand-in for the AI matcher: scores skills (70%), experience (20%) and
 * location (10%). The real service would read the CVs themselves.
 */
function sampleMatch(candidate: Candidate, req: Requirements): MatchResult {
  const have = new Set(candidate.skills.map(normalise));
  const matchedSkills = req.skills.filter((s) => have.has(normalise(s)));
  const missingSkills = req.skills.filter((s) => !have.has(normalise(s)));
  const skillScore = req.skills.length ? matchedSkills.length / req.skills.length : 1;
  const experienceScore = req.minYearsExperience
    ? Math.min(candidate.yearsExperience / req.minYearsExperience, 1)
    : 1;
  const wantedLocation = normalise(req.location);
  const locationScore =
    !wantedLocation ||
    normalise(candidate.location).includes(wantedLocation) ||
    normalise(candidate.location) === "remote"
      ? 1
      : 0;
  const score = Math.round((skillScore * 0.7 + experienceScore * 0.2 + locationScore * 0.1) * 100);

  const parts = [
    req.skills.length ? `${matchedSkills.length} of ${req.skills.length} required skills` : "no specific skills required",
    `${candidate.yearsExperience} yr${candidate.yearsExperience === 1 ? "" : "s"} experience`,
  ];
  if (wantedLocation && !locationScore) parts.push(`based in ${candidate.location}`);
  return { candidateId: candidate.id, score, matchedSkills, missingSkills, summary: parts.join(" · ") };
}

/** Ranks candidates against an employer's requirements, best first. */
export function useMatchCandidates() {
  return useMutation({
    // TODO(backend): e.g. api<ApiMatch[]>("/talent-match/admin/match", { method: "POST", body: req })
    mutationFn: async (req: Requirements): Promise<MatchResult[]> => {
      await new Promise((resolve) => setTimeout(resolve, 600));
      return candidates.map((c) => sampleMatch(c, req)).sort((a, b) => b.score - a.score);
    },
  });
}
