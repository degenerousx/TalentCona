/**
 * My Mentees — static content from the Figma "Mentees" section (293:34928):
 * list 293:34929 / 293:35245, profile 293:35562, chat 293:36203.
 *
 * No API yet: swap these constants for fetches when the backend lands.
 */

export type FinalProjectStatus = "Not Started" | "Pending Review" | "Submitted" | "Graded";

export type SessionItem = { id: string; title: string; when: string };

export type Mentee = {
  id: string;
  name: string;
  initials: string;
  program: string;
  /** Card header wash and avatar gradient from the design. */
  theme: "blue" | "purple" | "teal";
  progress: number;
  sessionsCompleted: number;
  nextSession: string | null;
  finalProject: FinalProjectStatus;
  status: "Active" | "Inactive";
  joined: string;
  upcoming: (SessionItem & { status: "Confirmed" | "Pending" })[];
  history: SessionItem[];
};

const history: SessionItem[] = [
  { id: "h1", title: "React Best Practices", when: "Jan 5, 2026 - 1 hour" },
  { id: "h2", title: "Component Architecture", when: "Dec 28, 2025 - 1 hour" },
  { id: "h3", title: "State Management Basics", when: "Dec 21, 2025 - 1 hour" },
];

export const mentees: Mentee[] = [
  {
    id: "maria-johnson",
    name: "Maria Johnson",
    initials: "MJ",
    program: "Full Stack Development",
    theme: "blue",
    progress: 67,
    sessionsCompleted: 3,
    nextSession: "Jan 10, 2:00 PM",
    finalProject: "Not Started",
    status: "Active",
    joined: "Sep 1, 2025",
    upcoming: [{ id: "u1", title: "State Management Deep Dive", when: "Jan 10, 2:00 PM", status: "Confirmed" }],
    history,
  },
  {
    id: "alex-smith",
    name: "Alex Smith",
    initials: "AS",
    program: "Full Stack Development",
    theme: "purple",
    progress: 67,
    sessionsCompleted: 3,
    nextSession: "Tomorrow, 3:00 PM",
    finalProject: "Pending Review",
    status: "Active",
    joined: "Sep 1, 2025",
    upcoming: [{ id: "u2", title: "React Best Practices", when: "Tomorrow, 3:00 PM", status: "Confirmed" }],
    history,
  },
  {
    id: "sarah-connor",
    name: "Sarah Connor",
    initials: "SC",
    program: "Full Stack Development",
    theme: "teal",
    progress: 67,
    sessionsCompleted: 3,
    nextSession: null,
    finalProject: "Not Started",
    status: "Active",
    joined: "Sep 1, 2025",
    upcoming: [],
    history,
  },
];

export const getMentee = (id: string) => mentees.find((m) => m.id === id);

/* -------------------------------------------------------------------------- */
/* Chat (293:36203)                                                           */
/* -------------------------------------------------------------------------- */

export type ChatMessage = {
  id: string;
  from: "mentee" | "me";
  time: string;
  text?: string;
  /** Image attachments (paths under /public). */
  images?: string[];
};

/** The design's sample conversation, greeting the mentee by first name. */
export const sampleChat = (firstName: string): ChatMessage[] => [
  { id: "1", from: "mentee", time: "9:00 AM", text: "Hi, How are you today?" },
  { id: "2", from: "me", time: "9:10 AM", text: `Hello ${firstName}, I’m fine. How about you?` },
  { id: "3", from: "mentee", time: "9:11 AM", text: "Can you send a sample from a reference?" },
  {
    id: "4",
    from: "me",
    time: "10:10 AM",
    text: "This is the reference we will use",
    images: ["/my-mentees/reference-1.jpg", "", ""],
  },
];
