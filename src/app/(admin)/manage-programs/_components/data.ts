/**
 * Manage Programs — static content taken from the Figma frames
 * (section "Manage Programs", 293:19524, plus the loose frames
 * 293:17832–293:18221 for the module assessment).
 *
 * The portal has no API yet, so every module in this app ships its screen data
 * as typed constants. Swap these for fetches when the backend lands.
 */

/* -------------------------------------------------------------------------- */
/* Schools                                                                    */
/* -------------------------------------------------------------------------- */

export type SchoolStatus = "Active" | "Inactive";
export type SchoolType = "For Individuals" | "For Business(es)";

export type School = {
  id: string;
  name: string;
  description: string;
  type: SchoolType;
  status: SchoolStatus;
  programs: number;
  students: number;
  created: string;
};

export const schools: School[] = [
  {
    id: "engineering",
    name: "School of Engineering",
    description:
      "Technical programs covering software development, systems design, and engineering fundamentals.",
    type: "For Individuals",
    status: "Active",
    programs: 5,
    students: 342,
    created: "1 Sept 2024",
  },
  {
    id: "design",
    name: "School of Design",
    description:
      "Creative programs spanning UI/UX, product design, brand identity, and visual communication.",
    type: "For Individuals",
    status: "Active",
    programs: 3,
    students: 156,
    created: "1 Sept 2024",
  },
  {
    id: "business",
    name: "School of Business",
    description:
      "Business strategy, entrepreneurship, operations management, and leadership development.",
    type: "For Individuals",
    status: "Active",
    programs: 4,
    students: 198,
    created: "15 Nov 2024",
  },
  {
    id: "data-science",
    name: "School of Data Science",
    description: "Analytics, machine learning, data engineering, and AI-driven decision making.",
    type: "For Individuals",
    status: "Active",
    programs: 3,
    students: 289,
    created: "10 Jan 2025",
  },
  {
    id: "product",
    name: "School of Product",
    description: "Product management, roadmap strategy, user research, and go-to-market execution.",
    type: "For Individuals",
    status: "Inactive",
    programs: 2,
    students: 112,
    created: "20 Mar 2025",
  },
];

/* -------------------------------------------------------------------------- */
/* Programs                                                                   */
/* -------------------------------------------------------------------------- */

export type ProgramStatus = "Active" | "Draft";

export type Program = {
  id: string;
  name: string;
  description: string;
  school: string;
  duration: string;
  modules: number;
  students: number;
  status: ProgramStatus;
};

export const programs: Program[] = [
  {
    id: "full-stack-development",
    name: "Full-Stack Development",
    description: "Complete web development from frontend to backend",
    school: "School of Engineering",
    duration: "6 months",
    modules: 12,
    students: 342,
    status: "Active",
  },
  {
    id: "data-science",
    name: "Data Science",
    description: "Advanced data analysis and machine learning",
    school: "School of Data Science",
    duration: "8 months",
    modules: 15,
    students: 289,
    status: "Active",
  },
  {
    id: "ui-ux-design",
    name: "UI/UX Design",
    description: "User interface and experience design fundamentals",
    school: "School of Design",
    duration: "4 months",
    modules: 9,
    students: 156,
    status: "Draft",
  },
];

/* -------------------------------------------------------------------------- */
/* Program detail: modules and their content                                  */
/* -------------------------------------------------------------------------- */

export type ModuleStatus = "Published" | "Draft";

export type Lesson = { id: string; title: string; duration: string; description?: string };

/** Content types offered by the "Add Resource" dropdown. */
export type ResourceKind = "PDF" | "LINK" | "ATTACHMENT";

export type Resource = {
  id: string;
  title: string;
  kind: ResourceKind;
  /** File size for uploads; links have none. */
  size?: string;
  note?: string;
  url?: string;
};

export type OptionKey = "A" | "B" | "C" | "D";

export type Question = {
  id: string;
  question: string;
  options: Record<OptionKey, string>;
  answer: OptionKey;
  points: number;
  duration: number;
};

export type MiniProject = {
  id: string;
  title: string;
  description: string;
  totalScore: number;
  passPercentage: number;
  rubric: RubricCriterion[];
};

export type ProgramModule = {
  id: string;
  order: number;
  title: string;
  status: ModuleStatus;
  completion: number;
  /** Pass mark of the MCQ assessment, shown as "MCQ Pass: 70%". */
  mcqPass?: number;
  miniProjectRequired?: boolean;
  lessons: Lesson[];
  scripts: Resource[];
  resources: Resource[];
  questions: Question[];
  miniProjects: MiniProject[];
};

export type RubricCriterion = {
  id: string;
  name: string;
  weight: number;
  maxScore: number;
  description: string;
};

export type ProgramDetail = Program & {
  avgCompletion: number;
  modulesList: ProgramModule[];
  miniProjectRubric: RubricCriterion[];
  finalProjectRubric: RubricCriterion[];
};

const rubric: RubricCriterion[] = [
  {
    id: "concept",
    name: "Concept Understanding",
    weight: 30,
    maxScore: 10,
    description: "Demonstrates clear understanding of core concepts",
  },
  {
    id: "execution",
    name: "Technical Execution",
    weight: 40,
    maxScore: 10,
    description: "Code quality, best practices, functionality",
  },
  {
    id: "structure",
    name: "Structure & Organization",
    weight: 20,
    maxScore: 10,
    description: "Project structure, file organization, naming",
  },
  {
    id: "presentation",
    name: "Presentation",
    weight: 10,
    maxScore: 10,
    description: "Code comments, documentation, clarity",
  },
];

const htmlLesson: Lesson = { id: "intro-html", title: "Introduction to HTML", duration: "12:45" };

const htmlGuide: Resource = {
  id: "html-guide",
  title: "HTML Reference Guide",
  kind: "PDF",
  size: "2.3 MB",
  note: "Complete HTML elements reference",
};

const sampleResources: Resource[] = [
  htmlGuide,
  {
    id: "mdn",
    title: "MDN Web Docs",
    kind: "LINK",
    note: "Official web development documentation",
    url: "https://developer.mozilla.org",
  },
  { id: "exercises", title: "Practice Exercises", kind: "ATTACHMENT", size: "1.8 MB" },
];

const sampleQuestions: Question[] = [
  {
    id: "q-html",
    question: "What does HTML stand for?",
    options: {
      A: "Hyper Text Markup Language",
      B: "High Tech Modern Language",
      C: "Home Tool Markup Language",
      D: "Hyperlinks Text Markup Language",
    },
    answer: "A",
    points: 5,
    duration: 5,
  },
  {
    id: "q-css",
    question: "Which CSS property controls text size?",
    options: { A: "text-size", B: "font-size", C: "text-style", D: "font-style" },
    answer: "B",
    points: 5,
    duration: 5,
  },
];

const landingPage: MiniProject = {
  id: "landing-page",
  title: "Build a Landing Page",
  description: "Create a responsive landing page using HTML and CSS",
  totalScore: 100,
  passPercentage: 70,
  rubric,
};

/** Module shells: every module shows the same sample content, as in the design. */
function makeModule(
  order: number,
  title: string,
  completion: number,
  extra: Partial<ProgramModule>,
): ProgramModule {
  return {
    id: title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
    order,
    title,
    status: "Published",
    completion,
    lessons: [htmlLesson],
    scripts: [],
    resources: sampleResources,
    questions: sampleQuestions,
    miniProjects: [],
    ...extra,
  };
}

const fullStackModules: ProgramModule[] = [
  makeModule(1, "HTML & CSS Fundamentals", 92, { mcqPass: 70 }),
  makeModule(2, "JavaScript Basics", 85, { mcqPass: 70, resources: [] }),
  makeModule(3, "DOM Manipulation", 78, {
    miniProjectRequired: true,
    scripts: [htmlGuide],
    miniProjects: [landingPage],
  }),
  makeModule(4, "React Fundamentals", 45, { mcqPass: 75 }),
  makeModule(5, "Node.js & Express", 38, { miniProjectRequired: true, miniProjects: [landingPage] }),
];

const details: Record<string, ProgramDetail> = {
  "full-stack-development": {
    ...programs[0],
    avgCompletion: 68,
    modulesList: fullStackModules,
    miniProjectRubric: rubric,
    finalProjectRubric: rubric,
  },
  "data-science": {
    ...programs[1],
    avgCompletion: 61,
    modulesList: [],
    miniProjectRubric: rubric,
    finalProjectRubric: rubric,
  },
  "ui-ux-design": {
    ...programs[2],
    avgCompletion: 0,
    modulesList: [],
    miniProjectRubric: rubric,
    finalProjectRubric: rubric,
  },
};

export const getProgram = (id: string): ProgramDetail | undefined => details[id];

/* -------------------------------------------------------------------------- */
/* Create / edit program wizard                                               */
/* -------------------------------------------------------------------------- */

export type ProgramDraft = {
  school: string;
  title: string;
  description: string;
  duration: string;
  about: string;
  whatYoullGet: string[];
  whatYoullLearn: string[];
  outcomes: string[];
  fee: string;
  discountEnabled: "" | "Yes" | "No";
  discount: string;
};

const sampleBullets = [
  "16-24 weeks of comprehensive front-end training from beginner to advanced",
  "Hands-on labs, projects, and real-world assessments",
];

export const emptyDraft: ProgramDraft = {
  school: "",
  title: "",
  description: "",
  duration: "",
  about: "",
  whatYoullGet: [...sampleBullets],
  whatYoullLearn: [...sampleBullets],
  outcomes: [...sampleBullets],
  fee: "",
  discountEnabled: "",
  discount: "",
};

export function draftFromProgram(p: Program): ProgramDraft {
  return {
    ...emptyDraft,
    school: p.school,
    title: p.name,
    description: p.description,
    duration: p.duration,
  };
}

/* -------------------------------------------------------------------------- */
/* Module assessment (preview of the learner test, frames 293:17832–18221)    */
/* -------------------------------------------------------------------------- */

export type AssessmentQuestion = { id: string; prompt: string; points: number };

export type Assessment = {
  course: string;
  title: string;
  description: string;
  /** Seconds. */
  timeLimit: number;
  passingScore: number;
  questions: AssessmentQuestion[];
};

export const sampleAssessment: Assessment = {
  course: "Cinema 4D Fundamentals",
  title: "Module 3 Assessment",
  description: "Test your understanding of the concepts covered in this module",
  timeLimit: 30 * 60,
  passingScore: 70,
  questions: [
    { id: "1", prompt: "What is the primary purpose of the key light in three-point lighting?", points: 10 },
    { id: "2", prompt: "Name two ways to reduce render times without losing visible quality.", points: 10 },
    { id: "3", prompt: "What is the difference between a spot light and an area light?", points: 10 },
    { id: "4", prompt: "What are benefits of using soft shadows in rendering?", points: 15 },
    { id: "5", prompt: "When would you use global illumination in a scene?", points: 10 },
    { id: "6", prompt: "Describe what a HDRI map is used for.", points: 15 },
    { id: "7", prompt: "What does the fill light do in a three-point setup?", points: 10 },
    {
      id: "8",
      prompt: "Explain in 2-3 sentences how color temperature can affect the mood of a scene.",
      points: 20,
    },
  ],
};

/** Stable id for new items created in the browser (no backend yet). */
export const newId = () => Math.random().toString(36).slice(2, 10);
