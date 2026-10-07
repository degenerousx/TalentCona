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

export type MentorRole = "Instructor" | "Program Advisor";

export type MentorAssignment = {
  program: string;
  dateAssigned: string;
  role: MentorRole;
  mentees: number;
  dateUnassigned?: string;
};

export type MentorActivityKind = "session" | "feedback" | "meeting" | "login" | "submission" | "message";

export type MentorActivity = { title: string; date: string; time: string; kind: MentorActivityKind; status: "completed" };

export type Expertise = { skill: string; years: number };

/** Recent activity from the design, used until it comes from the API. */
export const DEFAULT_MENTOR_ACTIVITY: MentorActivity[] = [
  { title: "Completed Session with Sarah Johnson", date: "2024-03-17", time: "10:00", kind: "session", status: "completed" },
  { title: "Provided Feedback on Project", date: "2024-03-16", time: "15:30", kind: "feedback", status: "completed" },
  { title: "Attended Instructor Meeting", date: "2024-03-15", time: "14:00", kind: "meeting", status: "completed" },
  { title: "Logged into platform", date: "2024-03-15", time: "08:30", kind: "login", status: "completed" },
];

export type MentorProfile = {
  id: string;
  name: string;
  email: string;
  phone: string;
  location: string;
  joined: string;
  status: "Active";
  current: MentorAssignment[];
  history: MentorAssignment[];
  expertise: Expertise[];
  avgSession: string;
  responseTime: string;
  lastActive: string;
  activity?: MentorActivity[];
};

export const MENTOR_PROFILES: MentorProfile[] = [
  {
    id: "james-wilson",
    name: "James Wilson",
    email: "james.w@email.com",
    phone: "+1 (555) 123-4567",
    location: "New York, USA",
    joined: "Sep 1, 2025",
    status: "Active",
    expertise: [{ skill: "React", years: 5 }, { skill: "Node.js", years: 5 }, { skill: "JavaScript", years: 5 }],
    avgSession: "45 mins",
    responseTime: "2 hours",
    lastActive: "3 hours ago",
    current: [
      { program: "Web Development", dateAssigned: "12/15/2023", role: "Instructor", mentees: 14 },
      { program: "Advanced React & Node.js", dateAssigned: "12/15/2023", role: "Program Advisor", mentees: 14 },
    ],
    history: [
      { program: "Introduction to Programming", dateAssigned: "12/15/2023", role: "Instructor", mentees: 14, dateUnassigned: "12/15/2023" },
    ],
  },
  {
    id: "maria-garcia",
    name: "Maria Garcia",
    email: "maria.g@email.com",
    phone: "+1 (555) 234-9876",
    location: "Miami, USA",
    joined: "Aug 12, 2025",
    status: "Active",
    expertise: [{ skill: "Python", years: 6 }, { skill: "Data Science", years: 4 }],
    avgSession: "50 mins",
    responseTime: "1 hour",
    lastActive: "1 day ago",
    current: [{ program: "Data Science", dateAssigned: "01/10/2024", role: "Instructor", mentees: 14 }],
    history: [{ program: "Python Fundamentals", dateAssigned: "09/04/2023", role: "Program Advisor", mentees: 11, dateUnassigned: "12/20/2023" }],
  },
  {
    id: "ahmed-hassan",
    name: "Ahmed Hassan",
    email: "ahmed.h@email.com",
    phone: "+20 100 555 0198",
    location: "Cairo, Egypt",
    joined: "Jul 3, 2025",
    status: "Active",
    expertise: [{ skill: "Flutter", years: 4 }, { skill: "Figma", years: 3 }, { skill: "Kotlin", years: 2 }],
    avgSession: "40 mins",
    responseTime: "3 hours",
    lastActive: "30 minutes ago",
    current: [
      { program: "Mobile Development", dateAssigned: "02/01/2024", role: "Instructor", mentees: 5 },
      { program: "UI/UX Design", dateAssigned: "02/01/2024", role: "Program Advisor", mentees: 3 },
    ],
    history: [],
  },
  {
    id: "lisa-chang",
    name: "Lisa Chang",
    email: "lisa.c@email.com",
    phone: "+1 (555) 456-1122",
    location: "Seattle, USA",
    joined: "Jun 18, 2025",
    status: "Active",
    expertise: [{ skill: "Python", years: 7 }, { skill: "TensorFlow", years: 4 }],
    avgSession: "60 mins",
    responseTime: "4 hours",
    lastActive: "5 hours ago",
    current: [{ program: "AI/ML", dateAssigned: "11/20/2023", role: "Instructor", mentees: 15 }],
    history: [{ program: "Data Science", dateAssigned: "03/01/2023", role: "Instructor", mentees: 12, dateUnassigned: "10/30/2023" }],
  },
];

export const getMentor = (id: string) => MENTOR_PROFILES.find((m) => m.id === id);

/** URL segment for a program title, e.g. "Advanced React & Node.js" → "advanced-react-node-js". */
export const programSlug = (title: string) =>
  title
    .toLowerCase()
    .replace(/&/g, " ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

export const getMentorAssignment = (mentor: MentorProfile, slug: string) => mentor.current.find((a) => programSlug(a.program) === slug);
