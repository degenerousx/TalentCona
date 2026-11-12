// The backend has no dashboard endpoint. Cards with `live` are filled from the
// User Management API (see LiveDashboard.tsx); the rest are still the design's
// placeholder figures.

export type StatTone = "positive" | "warning";

/** Cards filled from the backend. */
export type LiveStat = "students" | "activeStudents" | "mentors" | "assignedMentors" | "ratio";

export type Stat = {
  label: string;
  value: string;
  badge: string;
  live?: LiveStat;
  badgeTone: StatTone;
  iconBg: string;
  icon: "users" | "cap" | "dollar" | "clock" | "trend";
  href?: string;
};

export const STATS: Stat[] = [
  { label: "Total Students", value: "", badge: "Live", badgeTone: "positive", iconBg: "#2B7FFF", icon: "users", href: "/user-management", live: "students" },
  { label: "Active Students", value: "", badge: "Live", badgeTone: "positive", iconBg: "#FFCC00", icon: "users", href: "/user-management", live: "activeStudents" },
  { label: "Total Mentors", value: "", badge: "Live", badgeTone: "positive", iconBg: "#AD46FF", icon: "cap", href: "/user-management?view=all#mentors", live: "mentors" },
  { label: "Assigned Mentors", value: "", badge: "Live", badgeTone: "positive", iconBg: "#00C950", icon: "cap", href: "/user-management#mentors", live: "assignedMentors" },
  { label: "Mentor-Student Ratio", value: "", badge: "Live", badgeTone: "positive", iconBg: "#CB30E0", icon: "cap", live: "ratio" },
  { label: "Total Revenue", value: "$284,500", badge: "+8%", badgeTone: "positive", iconBg: "#00C0E8", icon: "dollar", href: "/financial-ops" },
  { label: "Active Loan Requests", value: "23", badge: "Monitoring", badgeTone: "warning", iconBg: "#FF6900", icon: "clock", href: "/financial-ops#loans" },
  { label: "Referral Growth", value: "342", badge: "1.8x viral", badgeTone: "positive", iconBg: "#FF2D55", icon: "trend", href: "/referrals" },
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

// "Review" opens where each queue is handled: the Pending Reviews table on the
// Mentors tab, and the Communities page (join requests are on its Members tab).
export const PENDING_REVIEWS = [
  // Mentor Applications' count comes from GET /mentors/admin/summary (LiveDashboard.tsx).
  { title: "Mentor Applications", count: 0, kind: "mentor" as const, href: "/user-management?view=pending#mentors", live: true },
  { title: "Join Communities Requests", count: 5, kind: "community" as const, href: "/communities", live: false },
];

export const PERFORMANCE = [
  { label: "Student Engagement", value: "Excellent", valueColor: "#00A63E", valueWeight: 400, fill: 96.44, gradient: "linear-gradient(90deg, #00C950 0%, #00BC7D 100%)" },
  { label: "Mentor Response Rate", value: "94%", valueColor: "#155DFC", valueWeight: 700, fill: 98.58, gradient: "linear-gradient(90deg, #2B7FFF 0%, #00B8DB 100%)" },
  { label: "Program Completion Rate", value: "72%", valueColor: "#9810FA", valueWeight: 700, fill: 90.74, gradient: "linear-gradient(90deg, #AD46FF 0%, #F6339A 100%)" },
];
