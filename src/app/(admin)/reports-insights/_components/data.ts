/**
 * Reports & Insights content, as shown in the Figma frames.
 * Chart values were read from the chart geometry in the design.
 * Replace with API calls once the backend is available.
 */
import type { Datum, Slice } from "./Charts";

export const kpis = {
  revenueYtd: { value: "$342,800", note: "+24% from last year" },
  revenueMtd: { value: "$342,800", note: "+24% from last year" },
  platformGrowth: { value: "+137%", note: "Student enrollment" },
  completionRate: { value: "72%", note: "+8% improvement" },
};

/* Financial report */

export const financialTiles = {
  totalRevenue: { value: "$417,950", caption: "From all programs" },
  highestRevenue: { value: "$122,500", caption: "Full-Stack Development" },
  avgRevenuePerStudent: { value: "$500", caption: "Platform average" },
  bestValue: { value: "Data Science", caption: "$600/student avg" },
};

export type BreakdownItem = Slice & { amount: string };

export const financialBreakdown: BreakdownItem[] = [
  { label: "Platform Fees", value: 42, amount: "$12,400", color: "#3b82f6" },
  { label: "Mentor Payouts", value: 30, amount: "$8,900", color: "#ef4444" },
  { label: "Referral Costs", value: 11, amount: "$3,200", color: "#f59e0b" },
];

export const financialSummary = [
  { label: "Total platform fees collected:", value: "$12,400" },
  { label: "Total mentor payouts:", value: "$8,900" },
  { label: "Net operating income:", value: "$-1,500", note: "(Investment phase)" },
];

export const revenueByProgram: Datum[] = [
  { label: "Data Science", value: 122500 },
  { label: "Full Stack", value: 118800 },
  { label: "UI/UX Design", value: 58450 },
  { label: "Graphics Design", value: 73700 },
  { label: "Front end", value: 44500 },
];

/* Student success report */

export const studentTiles = {
  enrolled: { value: "833", caption: "Across all programs" },
  completed: { value: "644", caption: "77.3% overall rate" },
  inProgress: { value: "134", caption: "Currently active" },
  droppedOut: { value: "55", caption: "6.6% dropout rate" },
};

export const completionByProgram: Datum[] = [
  { label: "Data Science", value: 67 },
  { label: "Full Stack", value: 70 },
  { label: "UI/UX Design", value: 75 },
  { label: "Graphics Design", value: 61 },
  { label: "Front end", value: 66 },
];

export const completionTrend: Datum[] = [
  { label: "Jan", value: 68 },
  { label: "Feb", value: 71 },
  { label: "Mar", value: 69 },
  { label: "Apr", value: 73 },
  { label: "May", value: 75 },
  { label: "Jun", value: 78 },
];

export type ProgramRow = {
  program: string;
  enrolled: number;
  completed: number;
  inProgress: number;
  dropped: number;
  completionRate: string;
  avgDuration: string;
};

export const programRows: ProgramRow[] = [
  { program: "Full-Stack Development", enrolled: 245, completed: 187, inProgress: 42, dropped: 16, completionRate: "76.3%", avgDuration: "6.2 months" },
  { program: "Data Science", enrolled: 198, completed: 156, inProgress: 28, dropped: 14, completionRate: "78.8%", avgDuration: "7.1 months" },
  { program: "UI/UX Design", enrolled: 167, completed: 142, inProgress: 18, dropped: 7, completionRate: "85%", avgDuration: "4 months" },
  { program: "Mobile Development", enrolled: 134, completed: 92, inProgress: 31, dropped: 11, completionRate: "68.7%", avgDuration: "8.3 months" },
  { program: "DevOps", enrolled: 89, completed: 67, inProgress: 15, dropped: 7, completionRate: "75.3%", avgDuration: "5.9 months" },
];

/* Mentor response rate report */

export const mentorTiles = {
  avgResponseTime: { value: "3.2 hrs", caption: "Across all mentors" },
  avgResponseRate: { value: "90.4%", caption: "568 of 628 queries" },
  pendingQueries: { value: "48", caption: "Awaiting response" },
  totalQueries: { value: "628", caption: "This month" },
};

export type MentorStatus = "Excellent" | "Good" | "Needs Attention";

export type MentorRow = {
  mentor: string;
  program: string;
  /** Percent. */
  responseRate: number;
  avgResponseTime: string;
  status: MentorStatus;
};

export const mentorRows: MentorRow[] = [
  { mentor: "James Wilson", program: "Full-Stack Development", responseRate: 98, avgResponseTime: "2.3 hrs", status: "Excellent" },
  { mentor: "Maria Garcia", program: "Data Science", responseRate: 95, avgResponseTime: "1.8 hrs", status: "Excellent" },
  { mentor: "Sarah Chen", program: "UI/UX Design", responseRate: 89, avgResponseTime: "4.2 hrs", status: "Good" },
  { mentor: "Ahmed Hassan", program: "Mobile Development", responseRate: 92, avgResponseTime: "3.1 hrs", status: "Good" },
  { mentor: "Emily Rodriguez", program: "DevOps", responseRate: 78, avgResponseTime: "5.5 hrs", status: "Needs Attention" },
];

/** The chart plots the same response rates as the table. */
export const responseRateByMentor: Datum[] = mentorRows.map((m) => ({
  label: m.mentor,
  value: m.responseRate,
}));

export const responseTimeByDay: Datum[] = [
  { label: "Mon", value: 2.8 },
  { label: "Tue", value: 3.2 },
  { label: "Wed", value: 2.5 },
  { label: "Thu", value: 3.8 },
  { label: "Fri", value: 4.2 },
  { label: "Sat", value: 5.1 },
  { label: "Sun", value: 6.3 },
];
