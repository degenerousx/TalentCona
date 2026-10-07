// Placeholder records from the designs until the users API exists.

export type PaymentMethod = "Direct" | "Loan" | "Fundraising";

export type CurrentProgram = { title: string; progress: number };
export type CompletedProgram = { title: string; score: number; completedOn: string };

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
    currentPrograms: [
      { title: "Web Development", progress: 67 },
      { title: "Advanced React & Node.js", progress: 23 },
    ],
    completedPrograms: [{ title: "Introduction to Programming", score: 88, completedOn: "12/15/2023" }],
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
    currentPrograms: [{ title: "Data Science", progress: 45 }],
    completedPrograms: [{ title: "Python Fundamentals", score: 92, completedOn: "03/02/2024" }],
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
    currentPrograms: [
      { title: "Mobile Development", progress: 58 },
      { title: "UI/UX Design", progress: 34 },
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
    currentPrograms: [{ title: "Web Development", progress: 81 }],
    completedPrograms: [{ title: "Introduction to Programming", score: 95, completedOn: "01/20/2024" }],
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
    currentPrograms: [{ title: "AI/ML", progress: 12 }],
    completedPrograms: [],
  },
];

export const getStudent = (id: string) => STUDENTS.find((s) => s.id === id);

export const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");
