import { DEFAULT_STATUS_QUEUE, type MentorQuery, type StudentQuery } from "./api";

// ---- Students ------------------------------------------------------------------

export type StudentFilters = {
  joinFrom: string;
  joinTo: string;
  /** Program ids. */
  programs: string[];
  /** One account status (the API takes a single value). */
  statuses: string[];
  methods: string[];
  amountFrom: string;
  amountTo: string;
  laptop: string[];
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
};

/** The values GET /students/admin accepts. */
export const STATUS_OPTIONS = ["Active", "Inactive", "Suspended"];
export const PAYMENT_OPTIONS = ["Direct", "Fundraising"];
export const LAPTOP_OPTIONS = ["Yes", "No"];

export const activeFilterCount = (f: StudentFilters) =>
  [f.joinFrom || f.joinTo, f.programs.length, f.statuses.length, f.methods.length, f.amountFrom || f.amountTo, f.laptop.length].filter(Boolean).length;

export const studentQuery = (search: string, f: StudentFilters): StudentQuery => ({
  search,
  joinedFrom: f.joinFrom || undefined,
  joinedTo: f.joinTo || undefined,
  programIds: f.programs,
  accountStatus: f.statuses[0],
  paymentMethod: f.methods[0],
  amountMin: f.amountFrom,
  amountMax: f.amountTo,
  laptop: f.laptop[0] === "Yes" ? true : f.laptop[0] === "No" ? false : undefined,
});

// ---- Mentors -------------------------------------------------------------------

/** Pending Reviews and Unassigned Mentors. */
export type CandidateFilters = {
  expertise: string;
  experienceFrom: string;
  experienceTo: string;
  systemRatings: string[];
  adminRatings: string[];
  /** Applications by Status only: the application statuses to list (none = all). */
  statuses: string[];
};

export const EMPTY_CANDIDATE_FILTERS: CandidateFilters = {
  expertise: "",
  experienceFrom: "",
  experienceTo: "",
  systemRatings: [],
  adminRatings: [],
  statuses: [],
};

/** Applications by Status starts on the applications no other section shows. */
export const DEFAULT_STATUS_FILTERS: CandidateFilters = { ...EMPTY_CANDIDATE_FILTERS, statuses: [...DEFAULT_STATUS_QUEUE] };

/** Mentor application statuses: API value → label, in the order the filter lists them. */
export const APPLICATION_STATUS_OPTIONS = [
  { value: "Draft", label: "Draft" },
  { value: "Submitted", label: "Submitted" },
  { value: "UnderReview", label: "Under Review" },
  { value: "ChangesRequested", label: "Changes Requested" },
  { value: "Approved", label: "Approved" },
  { value: "Rejected", label: "Rejected" },
];

/** Assigned Mentors. */
export type AssignedFilters = {
  approvedFrom: string;
  approvedTo: string;
  /** Program ids. */
  programs: string[];
  capacities: string[];
  menteesFrom: string;
  menteesTo: string;
  ratings: string[];
};

export const EMPTY_ASSIGNED_FILTERS: AssignedFilters = {
  approvedFrom: "",
  approvedTo: "",
  programs: [],
  capacities: [],
  menteesFrom: "",
  menteesTo: "",
  ratings: [],
};

export const RATING_OPTIONS = ["1", "2", "3", "4", "5"];

/** API value → label. */
export const CAPACITY_OPTIONS = [
  { value: "Available", label: "Available" },
  { value: "NearFull", label: "Near Full" },
  { value: "Full", label: "Full" },
];

export const applicationStatusLabel = (v: string | null) => APPLICATION_STATUS_OPTIONS.find((o) => o.value === v)?.label ?? v ?? "—";

export const candidateFilterCount = (f: CandidateFilters) =>
  [f.expertise.trim(), f.experienceFrom || f.experienceTo, f.systemRatings.length, f.adminRatings.length, f.statuses.length].filter(Boolean).length;

export const assignedFilterCount = (f: AssignedFilters) =>
  [f.approvedFrom || f.approvedTo, f.programs.length, f.capacities.length, f.menteesFrom || f.menteesTo, f.ratings.length].filter(Boolean).length;

export const candidateQuery = (search: string, f: CandidateFilters): MentorQuery => ({
  search,
  expertise: f.expertise.trim() || undefined,
  experienceMin: f.experienceFrom,
  experienceMax: f.experienceTo,
  systemRating: f.systemRatings[0],
  adminRating: f.adminRatings[0],
});

export const assignedQuery = (search: string, f: AssignedFilters): MentorQuery => ({
  search,
  approvedFrom: f.approvedFrom || undefined,
  approvedTo: f.approvedTo || undefined,
  programIds: f.programs,
  capacity: f.capacities[0],
  menteesMin: f.menteesFrom,
  menteesMax: f.menteesTo,
  averageRating: f.ratings[0],
});
