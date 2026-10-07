import type { AssignedMentor, MentorCandidate } from "./mentors";
import { capacityOf } from "./mentors";

/** Filters for the Pending Reviews and Unassigned Mentors tables. */
export type CandidateFilters = {
  expertise: string;
  experienceFrom: string;
  experienceTo: string;
  systemRatings: string[];
  adminRatings: string[];
};

export const EMPTY_CANDIDATE_FILTERS: CandidateFilters = {
  expertise: "",
  experienceFrom: "",
  experienceTo: "",
  systemRatings: [],
  adminRatings: [],
};

/** Filters for the Assigned Mentors table. */
export type AssignedFilters = {
  approvedFrom: string;
  approvedTo: string;
  programs: string[];
  capacities: string[];
  menteesFrom: string;
  menteesTo: string;
  ratings: string[];
};

export const EMPTY_ASSIGNED_FILTERS: AssignedFilters = {
  approvedFrom: "",
  approvedTo: "",
  programs: [],
  capacities: [],
  menteesFrom: "",
  menteesTo: "",
  ratings: [],
};

export const RATING_OPTIONS = ["1", "2", "3", "4", "5"];

/** "Frontend Dev & Backend Dev" → ["Frontend Dev", "Backend Dev"]. */
export const programsOf = (m: AssignedMentor) => m.programs.split(" & ").map((p) => p.trim());

export const programOptions = (list: AssignedMentor[]) =>
  [...new Set(list.flatMap(programsOf))].sort((a, b) => a.localeCompare(b));

const inRange = (value: number, from: string, to: string) =>
  (from === "" || value >= Number(from)) && (to === "" || value <= Number(to));

const ratingMatches = (selected: string[], value: number | undefined) =>
  selected.length === 0 || (value !== undefined && selected.includes(String(Math.round(value))));

export const candidateFilterCount = (f: CandidateFilters) =>
  [f.expertise.trim(), f.experienceFrom || f.experienceTo, f.systemRatings.length, f.adminRatings.length].filter(Boolean).length;

export const assignedFilterCount = (f: AssignedFilters) =>
  [f.approvedFrom || f.approvedTo, f.programs.length, f.capacities.length, f.menteesFrom || f.menteesTo, f.ratings.length].filter(Boolean).length;

export function applyCandidateFilters(list: MentorCandidate[], f: CandidateFilters) {
  const skill = f.expertise.trim().toLowerCase();
  return list.filter(
    (m) =>
      (!skill || m.expertise.some((e) => e.toLowerCase().includes(skill))) &&
      inRange(m.experience, f.experienceFrom, f.experienceTo) &&
      ratingMatches(f.systemRatings, m.systemRating) &&
      ratingMatches(f.adminRatings, m.adminRating),
  );
}

export function applyAssignedFilters(list: AssignedMentor[], f: AssignedFilters) {
  return list.filter(
    (m) =>
      (!f.approvedFrom || m.dateApproved >= f.approvedFrom) &&
      (!f.approvedTo || m.dateApproved <= f.approvedTo) &&
      (f.programs.length === 0 || programsOf(m).some((p) => f.programs.includes(p))) &&
      (f.capacities.length === 0 || f.capacities.includes(capacityOf(m))) &&
      inRange(m.mentees, f.menteesFrom, f.menteesTo) &&
      ratingMatches(f.ratings, m.averageRating),
  );
}
