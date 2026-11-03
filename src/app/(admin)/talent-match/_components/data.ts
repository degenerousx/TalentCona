/**
 * Talent Match content. There's no backend for CVs or matching yet, so the
 * candidates below are sample data. `api.ts` serves them through TanStack
 * Query hooks — replace those hooks' bodies with API calls when the endpoints
 * exist; components won't need to change.
 */

export type Availability = "available" | "employed";

/** Where the candidate's CV is in review. */
export type CvStatus = "verified" | "in-review" | "needs-update";

/** A student/user who has submitted a CV. */
export type Candidate = {
  id: string;
  name: string;
  initials: string;
  /** Profile picture; the card falls back to initials without one. */
  photoUrl?: string;
  email: string;
  /** Current or target job title, e.g. "Frontend Developer". */
  headline: string;
  program: string;
  cohort: string;
  yearsExperience: number;
  education: string;
  certifications: string[];
  location: string;
  availability: Availability;
  skills: string[];
  /** ISO date the CV was submitted. */
  cvSubmittedOn: string;
  cvFileName: string;
  cvStatus: CvStatus;
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

export const cvStatusLabel: Record<CvStatus, string> = {
  verified: "Verified",
  "in-review": "In review",
  "needs-update": "Needs update",
};

export function shortDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export const candidates: Candidate[] = [
  {
    id: "cand-1",
    name: "Sarah Johnson",
    initials: "SJ",
    photoUrl: "/talent-match/avatars/cand-1.svg",
    email: "sarah.johnson@example.com",
    headline: "Frontend Developer",
    program: "Frontend Engineering with React",
    cohort: "Jan 2026",
    yearsExperience: 2,
    education: "B.Sc. Computer Science",
    certifications: ["Meta Front-End Developer"],
    location: "Lagos, Nigeria",
    availability: "available",
    skills: ["React", "TypeScript", "Next.js", "Tailwind CSS", "Git"],
    cvSubmittedOn: "2026-10-12",
    cvFileName: "Sarah-Johnson-CV.pdf",
    cvStatus: "verified",
  },
  {
    id: "cand-2",
    name: "Michael Chen",
    initials: "MC",
    photoUrl: "/talent-match/avatars/cand-2.svg",
    email: "michael.chen@example.com",
    headline: "Backend Engineer",
    program: "Backend Engineering with Node.js",
    cohort: "Nov 2025",
    yearsExperience: 3,
    education: "B.Eng. Electrical Engineering",
    certifications: ["AWS Cloud Practitioner"],
    location: "Abuja, Nigeria",
    availability: "available",
    skills: ["Node.js", "PostgreSQL", "TypeScript", "Docker", "REST APIs"],
    cvSubmittedOn: "2026-10-08",
    cvFileName: "Michael-Chen-CV.pdf",
    cvStatus: "verified",
  },
  {
    id: "cand-3",
    name: "Adebayo Ojo",
    initials: "AO",
    photoUrl: "/talent-match/avatars/cand-3.svg",
    email: "adebayo.ojo@example.com",
    headline: "Data Analyst",
    program: "Data Science Fundamentals",
    cohort: "Jan 2026",
    yearsExperience: 1,
    education: "B.Sc. Statistics",
    certifications: ["Google Data Analytics"],
    location: "Ibadan, Nigeria",
    availability: "available",
    skills: ["Python", "SQL", "Pandas", "Power BI", "Excel"],
    cvSubmittedOn: "2026-10-15",
    cvFileName: "Adebayo-Ojo-CV.pdf",
    cvStatus: "in-review",
  },
  {
    id: "cand-4",
    name: "Chiamaka Eze",
    initials: "CE",
    photoUrl: "/talent-match/avatars/cand-4.svg",
    email: "chiamaka.eze@example.com",
    headline: "UX/UI Designer",
    program: "UX/UI Design",
    cohort: "Sep 2025",
    yearsExperience: 4,
    education: "B.A. Fine and Applied Arts",
    certifications: ["Google UX Design"],
    location: "Remote",
    availability: "employed",
    skills: ["Figma", "User Research", "Prototyping", "Design Systems"],
    cvSubmittedOn: "2026-09-28",
    cvFileName: "Chiamaka-Eze-CV.pdf",
    cvStatus: "verified",
  },
  {
    id: "cand-5",
    name: "Tunde Bakare",
    initials: "TB",
    photoUrl: "/talent-match/avatars/cand-5.svg",
    email: "tunde.bakare@example.com",
    headline: "Full-Stack Developer",
    program: "Full-Stack Web Development",
    cohort: "Nov 2025",
    yearsExperience: 5,
    education: "HND Computer Science",
    certifications: ["AWS Developer Associate", "MongoDB Associate"],
    location: "Lagos, Nigeria",
    availability: "available",
    skills: ["React", "Node.js", "MongoDB", "TypeScript", "AWS"],
    cvSubmittedOn: "2026-10-20",
    cvFileName: "Tunde-Bakare-CV.pdf",
    cvStatus: "verified",
  },
  {
    id: "cand-6",
    name: "Grace Okafor",
    initials: "GO",
    photoUrl: "/talent-match/avatars/cand-6.svg",
    email: "grace.okafor@example.com",
    headline: "Mobile Developer",
    program: "Mobile Development with Flutter",
    cohort: "Jan 2026",
    yearsExperience: 2,
    education: "B.Sc. Information Technology",
    certifications: [],
    location: "Port Harcourt, Nigeria",
    availability: "available",
    skills: ["Flutter", "Dart", "Firebase", "REST APIs"],
    cvSubmittedOn: "2026-10-18",
    cvFileName: "Grace-Okafor-CV.pdf",
    cvStatus: "needs-update",
  },
  {
    id: "cand-7",
    name: "Ibrahim Musa",
    initials: "IM",
    photoUrl: "/talent-match/avatars/cand-7.svg",
    email: "ibrahim.musa@example.com",
    headline: "DevOps Engineer",
    program: "DevOps Engineering",
    cohort: "Sep 2025",
    yearsExperience: 6,
    education: "M.Sc. Computer Science",
    certifications: ["CKA (Kubernetes)", "Terraform Associate"],
    location: "Kano, Nigeria",
    availability: "employed",
    skills: ["AWS", "Docker", "Kubernetes", "Terraform", "CI/CD"],
    cvSubmittedOn: "2026-09-30",
    cvFileName: "Ibrahim-Musa-CV.pdf",
    cvStatus: "in-review",
  },
  {
    id: "cand-8",
    name: "Lisa Chang",
    initials: "LC",
    photoUrl: "/talent-match/avatars/cand-8.svg",
    email: "lisa.chang@example.com",
    headline: "Junior Data Scientist",
    program: "Data Science Fundamentals",
    cohort: "Nov 2025",
    yearsExperience: 1,
    education: "B.Sc. Mathematics",
    certifications: ["TensorFlow Developer"],
    location: "Remote",
    availability: "available",
    skills: ["Python", "Machine Learning", "SQL", "TensorFlow"],
    cvSubmittedOn: "2026-10-22",
    cvFileName: "Lisa-Chang-CV.pdf",
    cvStatus: "in-review",
  },
];

// ---- Mentor matching --------------------------------------------------------

/** Days a mentor takes sessions. */
export type Weekday = "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat" | "Sun";

/**
 * An approved mentor who can take mentees. Mirrors the backend's mentor
 * application (`totalYearsExperience`, `country`, expertise areas) and
 * `mentorAvailability` (`maxStudents`, `currentStudentCount`, weekly slots).
 */
export type Mentor = {
  id: string;
  name: string;
  initials: string;
  photoUrl?: string;
  /** e.g. "Senior Frontend Engineer at Paystack". */
  title: string;
  expertise: string[];
  yearsExperience: number;
  location: string;
  maxMentees: number;
  currentMentees: number;
  availableDays: Weekday[];
  /** Average rating from mentees, 0–5. */
  rating: number;
};

/** A mentor suggested for one candidate. */
export type MentorOption = {
  mentorId: string;
  /** 0–100. */
  score: number;
  sharedSkills: string[];
  /** Short reasons, as an AI matcher would give. */
  reasons: string[];
};

/** Start Match's result for one candidate: mentors best first. */
export type MentorSuggestion = {
  candidateId: string;
  options: MentorOption[];
};

/** An approved candidate–mentor pairing. */
export type ConfirmedMatch = {
  candidateId: string;
  mentorId: string;
  score: number;
  /** ISO date-time. */
  confirmedAt: string;
};

export const mentors: Mentor[] = [
  {
    id: "mentor-1",
    name: "Amara Nwosu",
    initials: "AN",
    photoUrl: "/talent-match/avatars/mentor-1.svg",
    title: "Senior Frontend Engineer",
    expertise: ["React", "TypeScript", "Next.js", "Design Systems"],
    yearsExperience: 9,
    location: "Lagos, Nigeria",
    maxMentees: 6,
    currentMentees: 3,
    availableDays: ["Mon", "Wed", "Sat"],
    rating: 4.9,
  },
  {
    id: "mentor-2",
    name: "David Okonkwo",
    initials: "DO",
    photoUrl: "/talent-match/avatars/mentor-2.svg",
    title: "Backend Engineering Lead",
    expertise: ["Node.js", "PostgreSQL", "Docker", "REST APIs", "TypeScript"],
    yearsExperience: 11,
    location: "Abuja, Nigeria",
    maxMentees: 8,
    currentMentees: 5,
    availableDays: ["Tue", "Thu"],
    rating: 4.7,
  },
  {
    id: "mentor-3",
    name: "Fatima Bello",
    initials: "FB",
    photoUrl: "/talent-match/avatars/mentor-3.svg",
    title: "Data Science Manager",
    expertise: ["Python", "SQL", "Machine Learning", "Pandas", "TensorFlow"],
    yearsExperience: 8,
    location: "Remote",
    maxMentees: 5,
    currentMentees: 2,
    availableDays: ["Mon", "Thu", "Fri"],
    rating: 4.8,
  },
  {
    id: "mentor-4",
    name: "James Wilson",
    initials: "JW",
    photoUrl: "/talent-match/avatars/mentor-4.svg",
    title: "Cloud & DevOps Architect",
    expertise: ["AWS", "Kubernetes", "Terraform", "Docker", "CI/CD"],
    yearsExperience: 12,
    location: "Remote",
    maxMentees: 4,
    currentMentees: 4,
    availableDays: ["Sat", "Sun"],
    rating: 4.6,
  },
  {
    id: "mentor-5",
    name: "Ngozi Adeyemi",
    initials: "NA",
    photoUrl: "/talent-match/avatars/mentor-5.svg",
    title: "Principal Product Designer",
    expertise: ["Figma", "User Research", "Prototyping", "Design Systems"],
    yearsExperience: 10,
    location: "Lagos, Nigeria",
    maxMentees: 5,
    currentMentees: 1,
    availableDays: ["Tue", "Wed", "Fri"],
    rating: 5.0,
  },
  {
    id: "mentor-6",
    name: "Ahmed Hassan",
    initials: "AH",
    photoUrl: "/talent-match/avatars/mentor-6.svg",
    title: "Mobile Engineering Lead",
    expertise: ["Flutter", "Dart", "Firebase", "React", "REST APIs"],
    yearsExperience: 7,
    location: "Port Harcourt, Nigeria",
    maxMentees: 6,
    currentMentees: 2,
    availableDays: ["Mon", "Tue", "Sat"],
    rating: 4.5,
  },
];

/** Free mentee places a mentor has left. */
export const openSlots = (m: Mentor) => Math.max(0, m.maxMentees - m.currentMentees);
