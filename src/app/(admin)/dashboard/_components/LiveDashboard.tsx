"use client";

import { useCan } from "@/lib/permissions";
import { countLabel, useMentorCount, useMentorSummary, useStudentCount } from "../../user-management/_components/api";
import type { LiveStat } from "./data";

/**
 * Dashboard figures that come from the backend. There is no dashboard
 * endpoint, so they use the User Management API (MANAGE_USERS): the mentor
 * summary, and counts read from the student / mentor lists. They refresh when
 * the tab regains focus and every minute.
 */
export function useLiveDashboard() {
  const allowed = useCan("MANAGE_USERS");
  const summary = useMentorSummary(allowed);
  const students = useStudentCount(undefined, allowed);
  const active = useStudentCount("Active", allowed);
  const assigned = useMentorCount("assigned", allowed);

  const show = (q: { data?: unknown; isError: boolean }, text: string | undefined) =>
    !allowed ? "—" : text ?? (q.isError ? "—" : "…");

  const ratio = () => {
    const mentors = summary.data?.totalMentors;
    const total = students.data?.value;
    if (mentors === undefined || total === undefined) return show({ isError: summary.isError || students.isError }, undefined);
    if (!mentors) return "No mentors";
    return `1:${Math.round(total / mentors)}${students.data?.capped ? "+" : ""}`;
  };

  const stat: Record<LiveStat, string> = {
    students: show(students, countLabel(students.data)),
    activeStudents: show(active, countLabel(active.data)),
    mentors: show(summary, summary.data?.totalMentors.toLocaleString()),
    assignedMentors: show(assigned, countLabel(assigned.data)),
    ratio: ratio(),
  };

  return {
    allowed,
    stat,
    pendingApplications: allowed ? summary.data?.pendingReviewCount : undefined,
    pendingLoading: allowed && summary.isPending,
  };
}
