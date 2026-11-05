import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
  mentors,
  openSlots,
  type Candidate,
  type ConfirmedMatch,
  type MatchResult,
  type Mentor,
  type MentorOption,
  type MentorSuggestion,
  type Requirements,
} from "./data";

/**
 * Talent Match ↔ backend. Components only use these hooks.
 *
 * - Candidates are live: the talent network form's Formcarry submissions, read
 *   by the portal's own route /api/talent-match/submissions (it holds the
 *   Formcarry key and maps submissions to `Candidate`).
 * - Mentors, matching and confirmed matches are still sample data: replace
 *   those queryFn/mutationFn bodies with `api()` calls when the backend has
 *   endpoints, mapping responses to the types in `data.ts` here.
 */

const keys = {
  candidates: ["talent-match", "candidates"] as const,
  mentors: ["talent-match", "mentors"] as const,
  confirmed: ["talent-match", "confirmed-matches"] as const,
};

/** How often the CV list checks for new submissions. */
const CANDIDATES_REFRESH_MS = 60_000;

/** Everyone who has submitted the talent network form, newest first. */
export function useCandidates() {
  return useQuery({
    queryKey: keys.candidates,
    queryFn: async (): Promise<Candidate[]> => (await api<{ items: Candidate[] }>("/talent-match/submissions")).items,
    // New submissions show up without a reload.
    refetchInterval: CANDIDATES_REFRESH_MS,
    refetchOnWindowFocus: true,
  });
}

/** The candidates already loaded by useCandidates. */
function loadedCandidates(queryClient: ReturnType<typeof useQueryClient>) {
  return queryClient.getQueryData<Candidate[]>(keys.candidates) ?? [];
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
  const queryClient = useQueryClient();
  return useMutation({
    // TODO(backend): e.g. api<ApiMatch[]>("/talent-match/admin/match", { method: "POST", body: req })
    mutationFn: async (req: Requirements): Promise<MatchResult[]> => {
      await new Promise((resolve) => setTimeout(resolve, 600));
      return loadedCandidates(queryClient).map((c) => sampleMatch(c, req)).sort((a, b) => b.score - a.score);
    },
  });
}

// ---- Mentor matching --------------------------------------------------------

/** Approved mentors with their capacity. */
export function useMentors() {
  return useQuery({
    queryKey: keys.mentors,
    // TODO(backend): available mentors, e.g. from GET /mentor-application/admin?status=Approved
    // with mentorUser.mentorAvailability (maxStudents, currentStudentCount, slots).
    queryFn: async (): Promise<Mentor[]> => mentors.map((m) => ({ ...m })),
    staleTime: Infinity,
  });
}

/** Matches already approved with Confirm Match. */
export function useConfirmedMatches() {
  return useQuery({
    queryKey: keys.confirmed,
    // TODO(backend): the list of confirmed candidate–mentor matches.
    queryFn: async (): Promise<ConfirmedMatch[]> => [],
    staleTime: Infinity,
  });
}

const SUGGESTIONS_PER_CANDIDATE = 3;

/**
 * Stand-in for the AI matcher: shared skills (60%), mentor seniority (15%),
 * same city or remote (10%) and free places (15%). Full mentors are skipped.
 */
function sampleMentorOptions(candidate: Candidate, pool: Mentor[]): MentorOption[] {
  const skills = new Set(candidate.skills.map(normalise));
  return pool
    .filter((m) => openSlots(m) > 0)
    .map((m) => {
      const sharedSkills = m.expertise.filter((e) => skills.has(normalise(e)));
      const skillScore = Math.min(sharedSkills.length / 3, 1);
      const seniority = Math.min((m.yearsExperience - candidate.yearsExperience) / 5, 1);
      const city = (place: string) => normalise(place.split(",")[0]);
      const nearby = m.location === "Remote" || candidate.location === "Remote" || city(m.location) === city(candidate.location);
      const capacity = openSlots(m) / m.maxMentees;
      const score = Math.round((skillScore * 0.6 + Math.max(seniority, 0) * 0.15 + (nearby ? 0.1 : 0) + capacity * 0.15) * 100);

      const reasons = [
        sharedSkills.length ? `Shares ${sharedSkills.join(", ")}` : "No shared skills",
        `${m.yearsExperience} yrs experience`,
        `${openSlots(m)} of ${m.maxMentees} places free`,
      ];
      if (nearby) reasons.splice(2, 0, m.location === "Remote" ? "Mentors remotely" : `Also in ${m.location.split(",")[0]}`);
      return { mentorId: m.id, score, sharedSkills, reasons };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, SUGGESTIONS_PER_CANDIDATE);
}

/** Start Match: suggests the best mentors for each candidate given. */
export function useStartMentorMatch() {
  const queryClient = useQueryClient();
  return useMutation({
    // TODO(backend): e.g. api<ApiSuggestion[]>("/talent-match/admin/mentor-matches", { method: "POST", body: { candidateIds } })
    mutationFn: async (candidateIds: string[]): Promise<MentorSuggestion[]> => {
      await new Promise((resolve) => setTimeout(resolve, 700));
      const pool = queryClient.getQueryData<Mentor[]>(keys.mentors) ?? mentors;
      const loaded = loadedCandidates(queryClient);
      return candidateIds.flatMap((id) => {
        const candidate = loaded.find((c) => c.id === id);
        return candidate ? [{ candidateId: id, options: sampleMentorOptions(candidate, pool) }] : [];
      });
    },
  });
}

/** Confirm Match: approves one candidate–mentor pairing. */
export function useConfirmMatch() {
  const queryClient = useQueryClient();
  return useMutation({
    // TODO(backend): e.g. api<ApiMatch>("/talent-match/admin/mentor-matches/confirm", { method: "POST", body: { candidateId, mentorId } })
    // — or the existing POST /mentorship/admin/programs/assign-mentor if a match means assigning to a program.
    mutationFn: async ({ candidateId, mentorId, score }: Omit<ConfirmedMatch, "confirmedAt">): Promise<ConfirmedMatch> => {
      await new Promise((resolve) => setTimeout(resolve, 400));
      return { candidateId, mentorId, score, confirmedAt: new Date().toISOString() };
    },
    // Sample data only: record the match and take one of the mentor's places.
    // With the API, invalidate keys.confirmed and keys.mentors instead.
    onSuccess: (match) => {
      queryClient.setQueryData<ConfirmedMatch[]>(keys.confirmed, (list = []) => [...list.filter((m) => m.candidateId !== match.candidateId), match]);
      queryClient.setQueryData<Mentor[]>(keys.mentors, (list = []) =>
        list.map((m) => (m.id === match.mentorId ? { ...m, currentMentees: m.currentMentees + 1 } : m)),
      );
    },
  });
}
