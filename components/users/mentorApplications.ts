// Placeholder mentor applications (Pending Reviews) until the applications API exists.

export type MentorApplication = {
  id: string;
  name: string;
  email: string;
  submitted: string;
  bio: string;
  education: string;
  experience: number;
  expertise: { skill: string; years: number }[];
  portfolio: string;
  linkedin: string;
  /** Score from the automatic screening, 1–5. */
  systemRating: number;
  /** The reviewer's score so far, 1–5 (0 = not rated yet). */
  adminRating: number;
};

export const MENTOR_APPLICATIONS: MentorApplication[] = [
  {
    id: "james-wilson",
    name: "James Wilson",
    email: "james.wilson@email.com",
    submitted: "2 hours ago",
    bio: "Experienced software engineer with expertise in React, TypeScript, and modern web development. Previously worked at Google and Facebook. Passionate about teaching and mentoring the next generation of developers.",
    education: "Ph.D. Computer Science, MIT",
    experience: 8,
    expertise: [
      { skill: "Frontend Development", years: 5 },
      { skill: "TypeScript Fundamentals", years: 5 },
      { skill: "Web Performance Optimization", years: 5 },
    ],
    portfolio: "https://example.com/james-wilson",
    linkedin: "https://www.linkedin.com/in/james-wilson",
    systemRating: 2,
    adminRating: 2,
  },
  {
    id: "maria-garcia",
    name: "Maria Garcia",
    email: "maria.garcia@email.com",
    submitted: "5 hours ago",
    bio: "Data scientist with a background in statistics and machine learning. Has built forecasting and recommendation systems in production and runs Python workshops for career changers.",
    education: "M.Sc. Data Science, Stanford",
    experience: 6,
    expertise: [
      { skill: "Python", years: 6 },
      { skill: "Data Science", years: 4 },
      { skill: "Machine Learning", years: 3 },
    ],
    portfolio: "https://example.com/maria-garcia",
    linkedin: "https://www.linkedin.com/in/maria-garcia",
    systemRating: 4,
    adminRating: 0,
  },
];

export const getApplication = (id: string) => MENTOR_APPLICATIONS.find((a) => a.id === id);

export const RATING_LABELS: Record<number, string> = {
  0: "Not rated yet",
  1: "Poor - Does not meet requirements",
  2: "Fair - Meets minimum requirements",
  3: "Good - Meets requirements",
  4: "Very good - Exceeds requirements",
  5: "Excellent - Outstanding candidate",
};

/** Up to three initials, e.g. "Dr. Sarah Martinez" → "DSM". */
export const applicantInitials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 3)
    .map((p) => p[0].toUpperCase())
    .join("");
