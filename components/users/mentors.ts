// Placeholder mentor records from the design until the mentors API exists.

export type Capacity = "Available" | "Near Full" | "Full";

export type MentorCandidate = {
  id: string;
  name: string;
  expertise: string[];
  experience: number;
  systemRating: number;
  adminRating?: number;
};

export type AssignedMentor = {
  id: string;
  name: string;
  programs: string;
  mentees: number;
  maxMentees: number;
  averageRating: number;
};

/** Headline counts from the design (the whole mentor pool, not just the rows below). */
export const MENTOR_STATS = { pendingReview: 5, totalMentors: 89, instructors: 56, programAdvisors: 33 };

export const PENDING_MENTORS: MentorCandidate[] = [
  { id: "james-wilson", name: "James Wilson", expertise: ["React", "Node.js"], experience: 8, systemRating: 4 },
  { id: "maria-garcia", name: "Maria Garcia", expertise: ["Python", "Data Science"], experience: 6, systemRating: 4 },
];

export const ASSIGNED_MENTORS: AssignedMentor[] = [
  { id: "james-wilson", name: "James Wilson", programs: "Frontend Dev & Backend Dev", mentees: 12, maxMentees: 15, averageRating: 4 },
  { id: "maria-garcia", name: "Maria Garcia", programs: "Data Science", mentees: 14, maxMentees: 15, averageRating: 4 },
  { id: "ahmed-hassan", name: "Ahmed Hassan", programs: "Mobile Dev & UI/UX", mentees: 8, maxMentees: 15, averageRating: 4 },
  { id: "lisa-chang", name: "Lisa Chang", programs: "AI/ML", mentees: 15, maxMentees: 15, averageRating: 4 },
];

export const UNASSIGNED_MENTORS: MentorCandidate[] = [
  { id: "james-wilson", name: "James Wilson", expertise: ["React", "Node.js"], experience: 8, systemRating: 4, adminRating: 4 },
  { id: "maria-garcia", name: "Maria Garcia", expertise: ["Python", "Data Science"], experience: 6, systemRating: 4, adminRating: 4 },
];

/** Full at the limit, Near Full within 10% of it (at least one seat), otherwise Available. */
export function capacityOf(m: AssignedMentor): Capacity {
  if (m.mentees >= m.maxMentees) return "Full";
  if (m.maxMentees - m.mentees <= Math.max(1, Math.round(m.maxMentees * 0.1))) return "Near Full";
  return "Available";
}

export const CAPACITIES: Capacity[] = ["Available", "Near Full", "Full"];
