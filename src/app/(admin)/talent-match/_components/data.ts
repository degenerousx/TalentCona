/**
 * Talent Match content. There's no backend for CVs or matching yet, so the
 * candidates below are sample data. `api.ts` serves them through TanStack
 * Query hooks — replace those hooks' bodies with API calls when the endpoints
 * exist; components won't need to change.
 */

export type Availability = "available" | "employed";

/** A student/user who has submitted a CV. */
export type Candidate = {
  id: string;
  name: string;
  initials: string;
  email: string;
  /** Current or target job title, e.g. "Frontend Developer". */
  headline: string;
  program: string;
  cohort: string;
  yearsExperience: number;
  education: string;
  location: string;
  availability: Availability;
  skills: string[];
  /** ISO date the CV was submitted. */
  cvSubmittedOn: string;
  cvFileName: string;
};

/** What an employer is looking for. */
export type Requirements = {
  role: string;
  skills: string[];
  minYearsExperience: number;
  location: string;
};

/** One candidate's fit for a set of requirements. */
export type MatchResult = {
  candidateId: string;
  /** 0–100. */
  score: number;
  matchedSkills: string[];
  missingSkills: string[];
  /** One-line explanation, as an AI matcher would give. */
  summary: string;
};

export const availabilityLabel: Record<Availability, string> = {
  available: "Available",
  employed: "Employed",
};

export function shortDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export const candidates: Candidate[] = [
  {
    id: "cand-1",
    name: "Sarah Johnson",
    initials: "SJ",
    email: "sarah.johnson@example.com",
    headline: "Frontend Developer",
    program: "Frontend Engineering with React",
    cohort: "Jan 2026",
    yearsExperience: 2,
    education: "B.Sc. Computer Science",
    location: "Lagos, Nigeria",
    availability: "available",
    skills: ["React", "TypeScript", "Next.js", "Tailwind CSS", "Git"],
    cvSubmittedOn: "2026-10-12",
    cvFileName: "Sarah-Johnson-CV.pdf",
  },
  {
    id: "cand-2",
    name: "Michael Chen",
    initials: "MC",
    email: "michael.chen@example.com",
    headline: "Backend Engineer",
    program: "Backend Engineering with Node.js",
    cohort: "Nov 2025",
    yearsExperience: 3,
    education: "B.Eng. Electrical Engineering",
    location: "Abuja, Nigeria",
    availability: "available",
    skills: ["Node.js", "PostgreSQL", "TypeScript", "Docker", "REST APIs"],
    cvSubmittedOn: "2026-10-08",
    cvFileName: "Michael-Chen-CV.pdf",
  },
  {
    id: "cand-3",
    name: "Adebayo Ojo",
    initials: "AO",
    email: "adebayo.ojo@example.com",
    headline: "Data Analyst",
    program: "Data Science Fundamentals",
    cohort: "Jan 2026",
    yearsExperience: 1,
    education: "B.Sc. Statistics",
    location: "Ibadan, Nigeria",
    availability: "available",
    skills: ["Python", "SQL", "Pandas", "Power BI", "Excel"],
    cvSubmittedOn: "2026-10-15",
    cvFileName: "Adebayo-Ojo-CV.pdf",
  },
  {
    id: "cand-4",
    name: "Chiamaka Eze",
    initials: "CE",
    email: "chiamaka.eze@example.com",
    headline: "UX/UI Designer",
    program: "UX/UI Design",
    cohort: "Sep 2025",
    yearsExperience: 4,
    education: "B.A. Fine and Applied Arts",
    location: "Remote",
    availability: "employed",
    skills: ["Figma", "User Research", "Prototyping", "Design Systems"],
    cvSubmittedOn: "2026-09-28",
    cvFileName: "Chiamaka-Eze-CV.pdf",
  },
  {
    id: "cand-5",
    name: "Tunde Bakare",
    initials: "TB",
    email: "tunde.bakare@example.com",
    headline: "Full-Stack Developer",
    program: "Full-Stack Web Development",
    cohort: "Nov 2025",
    yearsExperience: 5,
    education: "HND Computer Science",
    location: "Lagos, Nigeria",
    availability: "available",
    skills: ["React", "Node.js", "MongoDB", "TypeScript", "AWS"],
    cvSubmittedOn: "2026-10-20",
    cvFileName: "Tunde-Bakare-CV.pdf",
  },
  {
    id: "cand-6",
    name: "Grace Okafor",
    initials: "GO",
    email: "grace.okafor@example.com",
    headline: "Mobile Developer",
    program: "Mobile Development with Flutter",
    cohort: "Jan 2026",
    yearsExperience: 2,
    education: "B.Sc. Information Technology",
    location: "Port Harcourt, Nigeria",
    availability: "available",
    skills: ["Flutter", "Dart", "Firebase", "REST APIs"],
    cvSubmittedOn: "2026-10-18",
    cvFileName: "Grace-Okafor-CV.pdf",
  },
  {
    id: "cand-7",
    name: "Ibrahim Musa",
    initials: "IM",
    email: "ibrahim.musa@example.com",
    headline: "DevOps Engineer",
    program: "DevOps Engineering",
    cohort: "Sep 2025",
    yearsExperience: 6,
    education: "M.Sc. Computer Science",
    location: "Kano, Nigeria",
    availability: "employed",
    skills: ["AWS", "Docker", "Kubernetes", "Terraform", "CI/CD"],
    cvSubmittedOn: "2026-09-30",
    cvFileName: "Ibrahim-Musa-CV.pdf",
  },
  {
    id: "cand-8",
    name: "Lisa Chang",
    initials: "LC",
    email: "lisa.chang@example.com",
    headline: "Junior Data Scientist",
    program: "Data Science Fundamentals",
    cohort: "Nov 2025",
    yearsExperience: 1,
    education: "B.Sc. Mathematics",
    location: "Remote",
    availability: "available",
    skills: ["Python", "Machine Learning", "SQL", "TensorFlow"],
    cvSubmittedOn: "2026-10-22",
    cvFileName: "Lisa-Chang-CV.pdf",
  },
];
