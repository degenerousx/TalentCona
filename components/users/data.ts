// Placeholder records from the designs until the users API exists.

export type PaymentMethod = "Direct" | "Loan" | "Fundraising";

export type Person = { name: string; photo: string };

export type ActivityKind = "submission" | "session" | "payment" | "login" | "message";

export type Activity = {
  title: string;
  date: string;
  time: string;
  kind: ActivityKind;
  status: "completed";
};

type ProgramBase = {
  id: string;
  title: string;
  /** Full program name shown under the student's name on the program page. */
  programName: string;
  mentor: Person | null;
  advisor: Person | null;
  activity?: Activity[];
};

export type CurrentProgram = ProgramBase & { progress: number };
export type CompletedProgram = ProgramBase & { score: number; completedOn: string };
export type Program = CurrentProgram | CompletedProgram;

const BRANDY: Person = { name: "Brandy Kiehn", photo: "/images/mentor-brandy-kiehn.png" };
const ROBERTO: Person = { name: "Roberto Marquardt", photo: "/images/advisor-roberto-marquardt.png" };

/** Recent activity from the design, used until per-program activity comes from the API. */
export const DEFAULT_ACTIVITY: Activity[] = [
  { title: "Submitted Final Project", date: "2024-03-18", time: "14:30", kind: "submission", status: "completed" },
  { title: "Attended Mentorship Session", date: "2024-03-17", time: "10:00", kind: "session", status: "completed" },
  { title: "Payment Received - $500", date: "2024-03-15", time: "09:15", kind: "payment", status: "completed" },
  { title: "Logged into platform", date: "2024-03-15", time: "08:00", kind: "login", status: "completed" },
  { title: "Sent message to mentor", date: "2024-03-14", time: "16:45", kind: "message", status: "completed" },
];

const program = (id: string, title: string, programName = `${title} Program`, mentor: Person | null = BRANDY, advisor: Person | null = ROBERTO) => ({
  id,
  title,
  programName,
  mentor,
  advisor,
});

export type Student = {
  id: string;
  name: string;
  email: string;
  phone: string;
  location: string;
  joined: string;
  program: string;
  payment: PaymentMethod;
  amountPaid: number;
  hasLaptop: boolean;
  instructor: string | null;
  advisor: string | null;
  status: "Active";
  lastActive: string;
  currentPrograms: CurrentProgram[];
  completedPrograms: CompletedProgram[];
};

export const STUDENTS: Student[] = [
  {
    id: "sarah-johnson",
    name: "Sarah Johnson",
    email: "sarah.j@email.com",
    phone: "+1 (555) 123-4567",
    location: "New York, USA",
    joined: "Sep 1, 2025",
    program: "Frontend Dev & Backend Dev",
    payment: "Direct",
    amountPaid: 1400,
    hasLaptop: true,
    instructor: "Sarah Johnson",
    advisor: "Sarah Johnson",
    status: "Active",
    lastActive: "2 hours ago",
    currentPrograms: [
      { ...program("web-development", "Web Development", "Full Stack Development Program"), progress: 67 },
      { ...program("advanced-react-node", "Advanced React & Node.js"), progress: 23 },
    ],
    completedPrograms: [{ ...program("intro-to-programming", "Introduction to Programming"), score: 88, completedOn: "12/15/2023" }],
  },
  {
    id: "michael-chen",
    name: "Michael Chen",
    email: "m.chen@email.com",
    phone: "+1 (555) 234-5678",
    location: "San Francisco, USA",
    joined: "Aug 18, 2025",
    program: "Data Science",
    payment: "Loan",
    amountPaid: 1400,
    hasLaptop: false,
    instructor: "Michael Chen",
    advisor: "Michael Chen",
    status: "Active",
    lastActive: "1 day ago",
    currentPrograms: [{ ...program("data-science", "Data Science"), progress: 45 }],
    completedPrograms: [{ ...program("python-fundamentals", "Python Fundamentals"), score: 92, completedOn: "03/02/2024" }],
  },
  {
    id: "adebayo-ojo",
    name: "Adebayo Ojo",
    email: "adebayo@email.com",
    phone: "+234 803 555 0142",
    location: "Lagos, Nigeria",
    joined: "Jul 7, 2025",
    program: "Mobile Dev & UI/UX",
    payment: "Fundraising",
    amountPaid: 1400,
    hasLaptop: false,
    instructor: "Adebayo Ojo",
    advisor: "Adebayo Ojo",
    status: "Active",
    lastActive: "30 minutes ago",
    currentPrograms: [
      { ...program("mobile-development", "Mobile Development"), progress: 58 },
      { ...program("ui-ux-design", "UI/UX Design"), progress: 34 },
    ],
    completedPrograms: [],
  },
  {
    id: "emily-rodriguez",
    name: "Emily Rodriguez",
    email: "emily.r@email.com",
    phone: "+1 (555) 345-6789",
    location: "Austin, USA",
    joined: "Jun 23, 2025",
    program: "Web Development",
    payment: "Direct",
    amountPaid: 1400,
    hasLaptop: true,
    instructor: "Emily Rodriguez",
    advisor: "Michael Chen",
    status: "Active",
    lastActive: "5 hours ago",
    currentPrograms: [{ ...program("web-development", "Web Development", "Full Stack Development Program"), progress: 81 }],
    completedPrograms: [{ ...program("intro-to-programming", "Introduction to Programming"), score: 95, completedOn: "01/20/2024" }],
  },
  {
    id: "david-kim",
    name: "David Kim",
    email: "d.kim@email.com",
    phone: "+1 (555) 456-7890",
    location: "Seattle, USA",
    joined: "Sep 15, 2025",
    program: "AI/ML",
    payment: "Loan",
    amountPaid: 1400,
    hasLaptop: true,
    instructor: null,
    advisor: null,
    status: "Active",
    lastActive: "3 days ago",
    currentPrograms: [{ ...program("ai-ml", "AI/ML", "AI & Machine Learning Program", null, null), progress: 12 }],
    completedPrograms: [],
  },
];

export const getStudent = (id: string) => STUDENTS.find((s) => s.id === id);

export const programsOf = (student: Student): Program[] => [...student.currentPrograms, ...student.completedPrograms];

export const getProgram = (student: Student, programId: string) => programsOf(student).find((p) => p.id === programId);

export const isCompleted = (p: Program): p is CompletedProgram => "completedOn" in p;

export const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");
