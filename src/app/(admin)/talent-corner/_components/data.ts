/**
 * Talent Corner content, as shown in the Figma frames.
 * Replace with API calls once the backend is available.
 */

export type TalentStatus = "available" | "hired";

export type Talent = {
  id: string;
  name: string;
  initials: string;
  program: string;
  cohort: string;
  location: string;
  status: TalentStatus;
  /** Final grade in percent. */
  grade: number;
  skills: string[];
  certifications: string[];
  // Profile modal. The design shows these fields for a sample graduate only,
  // so the values below are placeholders in the same format.
  email: string;
  phone: string;
  links: Array<{ label: string; url: string }>;
  projectsCompleted: number;
  job?: { company: string; role: string; date: string };
};

export type RequestStatus = "pending" | "fulfilled";

export type RoleRequirement = {
  title: string;
  level: string;
  employment: string;
  positions: number;
  requiredSkills: string[];
  niceToHaveSkills: string[];
};

export type TalentRequest = {
  id: string;
  code: string;
  company: string;
  contact: string;
  email: string;
  phone: string;
  location: string;
  website?: string;
  /** ISO dates. */
  requestedOn: string;
  deadline: string;
  employmentType: string;
  description: string;
  status: RequestStatus;
  roles: RoleRequirement[];
};

export const talents: Talent[] = [
  {
    id: "sarah-johnson",
    name: "Sarah Johnson",
    initials: "SJ",
    program: "Frontend Engineering",
    cohort: "Jan 2026",
    location: "Lagos, Nigeria",
    status: "hired",
    grade: 92,
    skills: ["React", "TypeScript", "Tailwind CSS", "Node.js"],
    certifications: ["React Developer Certificate", "AWS Cloud Practitioner"],
    email: "sarah.j@student.angt.hub",
    phone: "+234 801 234 5678",
    links: [
      { label: "Portfolio", url: "https://sarahjohnson.dev" },
      { label: "GitHub", url: "https://github.com/sarahjohnson" },
      { label: "LinkedIn", url: "https://linkedin.com/in/sarahjohnson" },
    ],
    projectsCompleted: 6,
    job: { company: "TechCorp Solutions", role: "Frontend Engineering", date: "Jan 2026" },
  },
  {
    id: "michael-chen",
    name: "Michael Chen",
    initials: "MC",
    program: "Data Science",
    cohort: "Oct 2025",
    location: "Abuja, Nigeria",
    status: "available",
    grade: 88,
    skills: ["Python", "Machine Learning", "SQL", "TensorFlow"],
    certifications: ["Google Data Analytics Professional"],
    email: "michael.c@student.angt.hub",
    phone: "+234 802 345 6789",
    links: [
      { label: "Portfolio", url: "https://michaelchen.data" },
      { label: "GitHub", url: "https://github.com/michaelchen" },
      { label: "LinkedIn", url: "https://linkedin.com/in/michaelchen" },
    ],
    projectsCompleted: 5,
  },
  {
    id: "emily-rodriguez",
    name: "Emily Rodriguez",
    initials: "ER",
    program: "Data Science",
    cohort: "Oct 2025",
    location: "Port Harcourt, Nigeria",
    status: "available",
    grade: 95,
    skills: ["Vue.js", "JavaScript", "CSS", "Firebase"],
    certifications: ["Vue.js Developer", "UX Design Certificate"],
    email: "emily.r@student.angt.hub",
    phone: "+234 803 456 7890",
    links: [
      { label: "Portfolio", url: "https://emilyrodriguez.dev" },
      { label: "GitHub", url: "https://github.com/emilyrodriguez" },
      { label: "LinkedIn", url: "https://linkedin.com/in/emilyrodriguez" },
    ],
    projectsCompleted: 7,
  },
];

export const talentRequests: TalentRequest[] = [
  {
    id: "techcorp-solutions",
    code: "#TR-0001",
    company: "TechCorp Solutions",
    contact: "Adewale Ogunleye",
    email: "adewale@techcorp.com",
    phone: "+234 901 234 5678",
    location: "Lagos, Nigeria",
    website: "https://techcorp.ng",
    requestedOn: "2026-04-15",
    deadline: "2026-05-30",
    employmentType: "Full-time",
    description:
      "We are expanding our engineering team and need talented developers to work on our new fintech platform.",
    status: "pending",
    roles: [
      {
        title: "Frontend Developer",
        level: "Mid Level",
        employment: "Full Time",
        positions: 3,
        requiredSkills: ["React", "TypeScript", "Tailwind CSS", "Next.js"],
        niceToHaveSkills: ["React", "TypeScript", "Tailwind CSS", "Next.js"],
      },
      {
        title: "Backend Developer",
        level: "Senior Level",
        employment: "Full Time",
        positions: 2,
        requiredSkills: ["Node.js", "Python", "PostgreSQL", "Docker"],
        niceToHaveSkills: ["Node.js", "Python", "PostgreSQL", "Docker"],
      },
    ],
  },
  {
    id: "designhub-studio",
    code: "#TR-0002",
    company: "DesignHub Studio",
    contact: "Michael Eze",
    email: "michael@designhub.africa",
    phone: "+234 903 456 7890",
    location: "Port Harcourt, Nigeria",
    requestedOn: "2026-04-01",
    deadline: "2026-04-25",
    employmentType: "Contract",
    description: "6-month contract to redesign our flagship mobile banking application.",
    status: "fulfilled",
    roles: [
      {
        title: "UI/UX Designer",
        level: "Mid Level",
        employment: "Contract",
        positions: 2,
        requiredSkills: ["Figma", "Adobe XD", "Prototyping", "User Research"],
        niceToHaveSkills: [],
      },
    ],
  },
];

const fmt = (iso: string, month: "short" | "long") =>
  new Date(`${iso}T00:00:00`).toLocaleDateString("en-US", { month, day: "numeric", year: "numeric" });

/** "Apr 15, 2026" (cards) */
export const shortDate = (iso: string) => fmt(iso, "short");
/** "April 15, 2026" (details modal) */
export const longDate = (iso: string) => fmt(iso, "long");

export const totalPositions = (r: TalentRequest) => r.roles.reduce((sum, role) => sum + role.positions, 0);
