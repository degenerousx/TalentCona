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

export type ScoredItem = { title: string; submitted: string; score: number };

export type Performance = {
  cohort: string;
  assessments: { done: number; total: number; average: number };
  assignments: ScoredItem[];
  miniProjects: { total: number; items: ScoredItem[] };
  finalProject: { score: number; label: string };
  overall: number;
};

/** Performance figures from the design, used until they come from the API. */
const DESIGN_PERFORMANCE: Omit<Performance, "cohort"> = {
  assessments: { done: 12, total: 15, average: 88 },
  assignments: [
    { title: "HTML/CSS Basics", submitted: "2024-02-10", score: 92 },
    { title: "JavaScript Functions", submitted: "2024-02-17", score: 88 },
    { title: "DOM Manipulation", submitted: "2024-02-24", score: 85 },
    { title: "Async JavaScript", submitted: "2024-03-02", score: 90 },
    { title: "React Components", submitted: "2024-03-09", score: 87 },
    { title: "State Management", submitted: "2024-03-16", score: 91 },
  ],
  miniProjects: {
    total: 3,
    items: [
      { title: "Todo App", submitted: "2024-02-28", score: 88 },
      { title: "Weather Dashboard", submitted: "2024-03-14", score: 91 },
      { title: "E-commerce Cart", submitted: "2024-03-18", score: 88 },
    ],
  },
  finalProject: { score: 94, label: "Capstone Project Evaluation" },
  overall: 89,
};

export const performanceOf = (program: Program): Performance =>
  program.performance ?? { cohort: `${program.title} - Cohort 12`, ...DESIGN_PERFORMANCE };

/** Rounded mean of a list of scores. */
export const average = (items: ScoredItem[]) =>
  items.length ? Math.round(items.reduce((sum, i) => sum + i.score, 0) / items.length) : 0;

type ProgramBase = {
  id: string;
  title: string;
  /** Full program name shown under the student's name on the program page. */
  programName: string;
  mentor: Person | null;
  advisor: Person | null;
  activity?: Activity[];
  performance?: Performance;
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

export type LoanPayment = { date: string; amount: number; method: string; status: "Completed" };
export type Loan = { programFee: number; nextPayment: string; payments: LoanPayment[] };

const bank = (date: string, amount: number): LoanPayment => ({ date, amount, method: "Bank Transfer", status: "Completed" });

export const totalPaid = (loan: Loan) => loan.payments.reduce((sum, p) => sum + p.amount, 0);

export type Contribution = { name: string; amount: number; message: string; ago: string };
export type Campaign = {
  slug: string;
  raised: number;
  goal: number;
  supporters: number;
  programLabel: string;
  laptop: string | null;
  contributions: Contribution[];
};

export const campaignLink = (c: Campaign) => `https://TalentCona.com/fund/${c.slug}`;

export const campaignStory = (student: Student) =>
  `Hi! I'm ${student.name.split(" ")[0]} and I'm raising funds for my education at TalentCona. I've enrolled in ${student.campaign.programLabel} to build my career. Your support will help me achieve my dreams. Thank you!`;

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
  engagement: { sessions: number; communities: number };
  loan: Loan;
  campaign: Campaign;
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
    engagement: { sessions: 24, communities: 18 },
    loan: { programFee: 7500, nextPayment: "4/15/2024", payments: [bank("2024-03-15", 500), bank("2024-02-15", 500), bank("2024-01-15", 1500)] },
    campaign: {
      slug: "student-mhatbyo5",
      raised: 1500,
      goal: 1200,
      supporters: 2,
      programLabel: "Front-End Development Program",
      laptop: "Essential Learner",
      contributions: [
        { name: "Sarah M.", amount: 150, message: "So proud of you! 💪", ago: "2 hours ago" },
        { name: "Uncle James", amount: 200, message: "Good luck with your studies!", ago: "1 hour ago" },
        { name: "Uncle James", amount: 200, message: "Good luck with your studies!", ago: "1 hour ago" },
      ],
    },
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
    engagement: { sessions: 15, communities: 9 },
    loan: { programFee: 7500, nextPayment: "4/20/2024", payments: [bank("2024-03-20", 1000), bank("2024-02-20", 1000), bank("2024-01-20", 1000)] },
    campaign: {
      slug: "student-q7kd2m9x",
      raised: 800,
      goal: 2000,
      supporters: 3,
      programLabel: "Data Science Program",
      laptop: null,
      contributions: [
        { name: "Linda C.", amount: 300, message: "Keep going, Michael!", ago: "3 hours ago" },
        { name: "David W.", amount: 250, message: "Proud of you!", ago: "1 day ago" },
        { name: "Grace T.", amount: 250, message: "Wishing you success!", ago: "2 days ago" },
      ],
    },
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
    engagement: { sessions: 31, communities: 22 },
    loan: { programFee: 6000, nextPayment: "4/10/2024", payments: [bank("2024-03-10", 1000), bank("2024-02-10", 2000)] },
    campaign: {
      slug: "student-a4bz81ow",
      raised: 1100,
      goal: 1500,
      supporters: 4,
      programLabel: "Mobile Development Program",
      laptop: "Essential Learner",
      contributions: [
        { name: "Tunde O.", amount: 400, message: "You've got this! 🚀", ago: "45 minutes ago" },
        { name: "Aunty Bisi", amount: 300, message: "God bless your studies.", ago: "5 hours ago" },
        { name: "Kemi A.", amount: 250, message: "So proud of you!", ago: "1 day ago" },
      ],
    },
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
    engagement: { sessions: 19, communities: 12 },
    loan: { programFee: 7500, nextPayment: "4/30/2024", payments: [bank("2024-03-30", 2500), bank("2024-01-30", 3000)] },
    campaign: {
      slug: "student-e9rx3lpt",
      raised: 950,
      goal: 1200,
      supporters: 2,
      programLabel: "Front-End Development Program",
      laptop: "Pro Builder",
      contributions: [
        { name: "Maria R.", amount: 500, message: "Go get them, Emily!", ago: "4 hours ago" },
        { name: "Jake P.", amount: 450, message: "Good luck with your studies!", ago: "2 days ago" },
      ],
    },
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
    engagement: { sessions: 6, communities: 3 },
    loan: { programFee: 8000, nextPayment: "4/1/2024", payments: [bank("2024-03-01", 1000)] },
    campaign: {
      slug: "student-dk5w0vn2",
      raised: 200,
      goal: 2500,
      supporters: 1,
      programLabel: "AI & Machine Learning Program",
      laptop: "Pro Builder",
      contributions: [{ name: "Grace K.", amount: 200, message: "Rooting for you!", ago: "6 hours ago" }],
    },
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
