/**
 * Sessions — static content from the Figma "Mentees" section (293:34928):
 * sessions page 293:35929, call 293:36423, "you left" summary 293:36544,
 * request / reschedule / cancel popups 293:36704 – 293:37169 and the success
 * popups 293:36632 – 293:37256.
 *
 * No API yet: swap these constants for fetches when the backend lands.
 */

export type Session = {
  id: string;
  mentee: string;
  initials: string;
  topic: string;
  when: string;
  status: "Confirmed" | "Completed";
};

export const upcomingSessions: Session[] = [
  {
    id: "react-best-practices",
    mentee: "Alex Smith",
    initials: "AS",
    topic: "React Best Practices",
    when: "Tomorrow, 3:00 PM",
    status: "Confirmed",
  },
  {
    id: "state-management-deep-dive",
    mentee: "Maria Johnson",
    initials: "MJ",
    topic: "State Management Deep Dive",
    when: "Jan 10, 2:00 PM",
    status: "Confirmed",
  },
];

export const recentSessions: Session[] = [
  {
    id: "component-lifecycle",
    mentee: "Sarah Connor",
    initials: "SC",
    topic: "Component Lifecycle",
    when: "Jan 5, 2026",
    status: "Completed",
  },
];

export const getSession = (id: string) => [...upcomingSessions, ...recentSessions].find((s) => s.id === id);

/* -------------------------------------------------------------------------- */
/* Pending requests                                                           */
/* -------------------------------------------------------------------------- */

type RequestBase = {
  id: string;
  student: string;
  program: string;
  topic: string;
};

export type SessionRequest =
  | (RequestBase & {
      kind: "reschedule";
      reason: string;
      currentTime: string;
      proposedDate: string;
      proposedTime: string;
    })
  | (RequestBase & {
      kind: "session";
      date: string;
      time: string;
      eventType: string;
      discuss: string;
    })
  | (RequestBase & {
      kind: "cancellation";
      when: string;
      reason: string;
    });

export const pendingRequests: SessionRequest[] = [
  {
    id: "req-reschedule",
    kind: "reschedule",
    student: "Sarah Chen",
    program: "Frontend Development & Front-End Development Program",
    topic: "React Best Practices",
    reason: "I have an unexpected client meeting at the original time. Would this new time work for you?",
    currentTime: "Tomorrow, 2:00 PM",
    proposedDate: "Jan 22, 2026",
    proposedTime: "4:00 PM",
  },
  {
    id: "req-session",
    kind: "session",
    student: "Sarah Chen",
    program: "Frontend Development & Front-End Development Program",
    topic: "React Best Practices",
    date: "Monday, December 29, 2025",
    time: "09:00 AM (60 minutes)",
    eventType: "Learning Session",
    discuss: "None",
  },
  {
    id: "req-cancellation",
    kind: "cancellation",
    student: "Michael Obi",
    program: "Frontend Development & Front-End Development Program",
    topic: "Final Project Review",
    when: "Jan 20, 6:00 PM",
    reason:
      "I'm unfortunately dealing with a personal emergency and need to cancel. We can reschedule for next week.",
  },
];

/** Reasons offered by the "Cancel Session" popup. */
export const cancelReasons = [
  "Unexpected scheduling conflict",
  "Personal emergency",
  "Student requested cancellation",
  "Technical difficulties",
  "Other",
];

/** Slots offered by the reschedule "Time" dropdown. */
export const timeSlots = ["9:00 AM", "10:00 AM", "11:00 AM", "12:00 PM", "2:00 PM", "3:00 PM", "4:00 PM", "5:00 PM"];

/** Session summary shown after leaving a call (293:36544). */
export const sampleSummary = { duration: "45 min", start: "2:00 PM", end: "2:45 PM" };
