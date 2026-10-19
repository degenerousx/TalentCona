import { getApplication, type MentorApplication } from "./mentorApplications";
import { UNASSIGNED_MENTORS, getUnassignedMentor } from "./mentors";

/** An approved mentor who is not yet on a program, with the details from their application. */
export type AssignableMentor = Pick<
  MentorApplication,
  "id" | "name" | "email" | "bio" | "education" | "portfolio" | "linkedin" | "experience" | "expertise"
> & {
  approved: string;
  systemRating: number;
  adminRating: number;
};

export function getAssignableMentor(id: string): AssignableMentor | undefined {
  const mentor = getUnassignedMentor(id);
  if (!mentor) return undefined;
  const application = getApplication(id);
  const slug = mentor.name.toLowerCase().replace(/[^a-z]+/g, ".");
  return {
    id: mentor.id,
    name: mentor.name,
    email: application?.email ?? `${slug}@email.com`,
    bio: application?.bio ?? "",
    education: application?.education ?? "",
    portfolio: application?.portfolio ?? "",
    linkedin: application?.linkedin ?? "",
    experience: mentor.experience,
    expertise: application?.expertise ?? mentor.expertise.map((skill) => ({ skill, years: mentor.experience })),
    approved: mentor.approved ?? "recently",
    systemRating: mentor.systemRating,
    adminRating: mentor.adminRating ?? 0,
  };
}

export const ASSIGNABLE_MENTOR_IDS = [...new Set(UNASSIGNED_MENTORS.map((m) => m.id))];
