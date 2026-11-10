import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { ConfirmedMatch, HiringRequest, Talent, TalentMatch } from "./data";

/**
 * Talent Match ↔ backend. Components only use these hooks.
 *
 * - Talents and hiring requests are live: the two public forms' Formcarry
 *   submissions, read by the portal's own routes under /api/talent-match
 *   (they hold the Formcarry key and map submissions to the types in data.ts).
 * - Matching is a sample score computed here, and confirmed matches live in
 *   the query cache. Replace those with `api()` calls when the backend has an
 *   AI matching endpoint and somewhere to store matches.
 */

const keys = {
  talents: ["talent-match", "talents"] as const,
  requests: ["talent-match", "hiring-requests"] as const,
  confirmed: ["talent-match", "confirmed-matches"] as const,
};

/** How often the lists check for new submissions. */
const REFRESH_MS = 60_000;

/** Everyone who submitted the talent network form, newest first. */
export function useTalents() {
  return useQuery({
    queryKey: keys.talents,
    queryFn: async (): Promise<Talent[]> => (await api<{ items: Talent[] }>("/talent-match/talents")).items,
    refetchInterval: REFRESH_MS,
    refetchOnWindowFocus: true,
  });
}

/** Every recruitment request from the hiring form, newest first. */
export function useHiringRequests() {
  return useQuery({
    queryKey: keys.requests,
    queryFn: async (): Promise<HiringRequest[]> => (await api<{ items: HiringRequest[] }>("/talent-match/hiring-requests")).items,
    refetchInterval: REFRESH_MS,
    refetchOnWindowFocus: true,
  });
}

// ---- Matching ----------------------------------------------------------------

const normalise = (value: string) => value.trim().toLowerCase();
const city = (place: string) => normalise(place.split(",")[0]);

/**
 * Stand-in for the AI matcher: required skills (60%), experience (25%) and
 * location (15%; a remote role counts as a match everywhere).
 */
export function scoreTalent(talent: Talent, request: HiringRequest): TalentMatch {
  const have = new Set(talent.skills.map(normalise));
  const matchedSkills = request.requiredSkills.filter((s) => have.has(normalise(s)));
  const missingSkills = request.requiredSkills.filter((s) => !have.has(normalise(s)));
  const skillScore = request.requiredSkills.length ? matchedSkills.length / request.requiredSkills.length : 1;
  const experienceScore = request.minYearsExperience
    ? Math.min(talent.yearsExperience / request.minYearsExperience, 1)
    : 1;
  const remote = normalise(request.workMode) === "remote";
  const nearby = remote || city(talent.location) === city(request.location) || normalise(talent.location).includes(city(request.location));
  const score = Math.round((skillScore * 0.6 + experienceScore * 0.25 + (nearby ? 0.15 : 0)) * 100);

  const reasons = [
    request.requiredSkills.length ? `${matchedSkills.length} of ${request.requiredSkills.length} required skills` : "No skills specified",
    talent.experienceLabel
      ? `${talent.experienceLabel} experience${experienceScore < 1 ? ` (wants ${request.experienceLabel ?? `${request.minYearsExperience}+ years`})` : ""}`
      : `${talent.yearsExperience} years experience`,
    remote ? "Remote role" : nearby ? `Based in ${talent.location}` : `Based in ${talent.location}, role in ${request.location}`,
  ];
  return { talentId: talent.id, score, matchedSkills, missingSkills, reasons };
}

/** Match Talents: ranks every talent against one hiring request, best first. */
export function useMatchTalents() {
  const queryClient = useQueryClient();
  return useMutation({
    // TODO(backend): e.g. api<ApiMatch[]>(`/talent-match/hiring-requests/${request.id}/matches`, { method: "POST" })
    mutationFn: async (request: HiringRequest): Promise<TalentMatch[]> => {
      await new Promise((resolve) => setTimeout(resolve, 600));
      const talents = queryClient.getQueryData<Talent[]>(keys.talents) ?? [];
      return talents.map((t) => scoreTalent(t, request)).sort((a, b) => b.score - a.score);
    },
  });
}

/** Matches approved with Confirm Match. */
export function useConfirmedMatches() {
  return useQuery({
    queryKey: keys.confirmed,
    // TODO(backend): the stored list of confirmed matches.
    queryFn: async (): Promise<ConfirmedMatch[]> => [],
    staleTime: Infinity,
  });
}

/** Confirm Match: approves one talent for one hiring request. */
export function useConfirmMatch() {
  const queryClient = useQueryClient();
  return useMutation({
    // TODO(backend): e.g. api<ApiMatch>(`/talent-match/hiring-requests/${requestId}/matches`, { method: "PUT", body: { talentId } })
    mutationFn: async (match: Omit<ConfirmedMatch, "confirmedAt">): Promise<ConfirmedMatch> => {
      await new Promise((resolve) => setTimeout(resolve, 400));
      return { ...match, confirmedAt: new Date().toISOString() };
    },
    // Kept in the page for now; with the API, invalidate keys.confirmed instead.
    onSuccess: (match) => {
      queryClient.setQueryData<ConfirmedMatch[]>(keys.confirmed, (list = []) => [
        ...list.filter((m) => !(m.requestId === match.requestId && m.talentId === match.talentId)),
        match,
      ]);
    },
  });
}
