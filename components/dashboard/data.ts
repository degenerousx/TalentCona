// Placeholder figures from the design until the dashboard API exists.

export type StatTone = "positive" | "warning";

export type Stat = {
  label: string;
  value: string;
  badge: string;
  badgeTone: StatTone;
  iconBg: string;
  icon: "users" | "cap" | "dollar" | "clock" | "trend";
  href?: string;
};

export const STATS: Stat[] = [
  { label: "Total Students", value: "1,247", badge: "+12%", badgeTone: "positive", iconBg: "#2B7FFF", icon: "users", href: "/user-management" },
  { label: "Active Students", value: "2,847", badge: "+12%", badgeTone: "positive", iconBg: "#FFCC00", icon: "users", href: "/user-management" },
  { label: "Total Mentors", value: "89", badge: "+5 new", badgeTone: "positive", iconBg: "#AD46FF", icon: "cap", href: "#" },
  { label: "Assigned Mentors", value: "89", badge: "Active", badgeTone: "positive", iconBg: "#00C950", icon: "cap", href: "#" },
  { label: "Mentor-Student Ratio", value: "1:25", badge: "Optimal", badgeTone: "positive", iconBg: "#CB30E0", icon: "cap" },
  { label: "Total Revenue", value: "$284,500", badge: "+8%", badgeTone: "positive", iconBg: "#00C0E8", icon: "dollar", href: "#" },
  { label: "Active Loan Requests", value: "23", badge: "Monitoring", badgeTone: "warning", iconBg: "#FF6900", icon: "clock", href: "#" },
  { label: "Referral Growth", value: "342", badge: "1.8x viral", badgeTone: "positive", iconBg: "#FF2D55", icon: "trend", href: "#" },
];

export const GROWTH = {
  students: [1200, 1450, 1800, 2100, 2500, 2850],
  revenue: [45000, 52000, 58000, 67000, 78000, 92000],
};

export type Activity = {
  text: string;
  time: string;
  kind: "student" | "payment" | "flag" | "mentor" | "success";
};

export const ACTIVITY: Activity[] = [
  { text: "New student: Sarah Johnson enrolled in Web Dev Track", time: "2 min ago", kind: "student" },
  { text: "Payment received: $500 from Michael Chen", time: "15 min ago", kind: "payment" },
  { text: "Communities post flagged by AI moderation", time: "23 min ago", kind: "flag" },
  { text: "New mentor: Dr. Emily Rodriguez joined", time: "1 hr ago", kind: "mentor" },
  { text: "Fundraising campaign completed: Adebayo Ojo", time: "2 hrs ago", kind: "success" },
];

export const PENDING_REVIEWS = [
  { title: "Mentor Applications", count: 8, kind: "mentor" as const },
  { title: "Join Communities Requests", count: 5, kind: "community" as const },
];

export const PERFORMANCE = [
  { label: "Student Engagement", value: "Excellent", valueColor: "#00A63E", valueWeight: 400, fill: 96.44, gradient: "linear-gradient(90deg, #00C950 0%, #00BC7D 100%)" },
  { label: "Mentor Response Rate", value: "94%", valueColor: "#155DFC", valueWeight: 700, fill: 98.58, gradient: "linear-gradient(90deg, #2B7FFF 0%, #00B8DB 100%)" },
  { label: "Program Completion Rate", value: "72%", valueColor: "#9810FA", valueWeight: 700, fill: 90.74, gradient: "linear-gradient(90deg, #AD46FF 0%, #F6339A 100%)" },
];
