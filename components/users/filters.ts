import { PAYMENT_METHODS, STUDENT_STATUSES, type Student } from "./data";

export type StudentFilters = {
  joinFrom: string;
  joinTo: string;
  programs: string[];
  statuses: string[];
  methods: string[];
  amountFrom: string;
  amountTo: string;
  laptop: string[];
  instructors: string[];
  advisors: string[];
};

export const EMPTY_FILTERS: StudentFilters = {
  joinFrom: "",
  joinTo: "",
  programs: [],
  statuses: [],
  methods: [],
  amountFrom: "",
  amountTo: "",
  laptop: [],
  instructors: [],
  advisors: [],
};

export const LAPTOP_OPTIONS = ["Yes", "No"];

const unique = (values: (string | null)[]) => [...new Set(values.filter((v): v is string => Boolean(v)))].sort((a, b) => a.localeCompare(b));

/** Dropdown options, taken from the students so every choice can match someone. */
export const filterOptions = (students: Student[]) => ({
  programs: unique(students.flatMap((s) => s.currentPrograms.map((p) => p.title))),
  statuses: [...STUDENT_STATUSES] as string[],
  methods: [...PAYMENT_METHODS] as string[],
  laptop: LAPTOP_OPTIONS,
  instructors: unique(students.map((s) => s.instructor)),
  advisors: unique(students.map((s) => s.advisor)),
});

export const activeFilterCount = (f: StudentFilters) =>
  [
    f.joinFrom || f.joinTo,
    f.programs.length,
    f.statuses.length,
    f.methods.length,
    f.amountFrom || f.amountTo,
    f.laptop.length,
    f.instructors.length,
    f.advisors.length,
  ].filter(Boolean).length;

const day = (iso: string) => new Date(`${iso}T00:00:00`).getTime();
const matchesAny = (selected: string[], value: string | null) => selected.length === 0 || (value !== null && selected.includes(value));

export function applyFilters(students: Student[], f: StudentFilters) {
  const amountFrom = f.amountFrom === "" ? -Infinity : Number(f.amountFrom);
  const amountTo = f.amountTo === "" ? Infinity : Number(f.amountTo);

  return students.filter((s) => {
    const joined = new Date(s.joined).getTime();
    if (f.joinFrom && joined < day(f.joinFrom)) return false;
    if (f.joinTo && joined > day(f.joinTo)) return false;
    if (f.programs.length && !s.currentPrograms.some((p) => f.programs.includes(p.title))) return false;
    if (!matchesAny(f.statuses, s.status)) return false;
    if (!matchesAny(f.methods, s.payment)) return false;
    if (s.amountPaid < amountFrom || s.amountPaid > amountTo) return false;
    if (!matchesAny(f.laptop, s.hasLaptop ? "Yes" : "No")) return false;
    if (!matchesAny(f.instructors, s.instructor)) return false;
    if (!matchesAny(f.advisors, s.advisor)) return false;
    return true;
  });
}
