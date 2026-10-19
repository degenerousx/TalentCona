"use client";

import { useId, useState } from "react";
import { BarChart3 } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Tabs, TabPanel, type TabItem } from "@/components/ui/Tabs";
import { cn } from "@/lib/cn";
import {
  newId,
  type Lesson,
  type MiniProject,
  type ModuleStatus,
  type OptionKey,
  type ProgramModule,
  type Question,
  type Resource,
  type ResourceKind,
  type RubricCriterion,
  type School,
  type SchoolStatus,
  type SchoolType,
} from "./data";
import {
  Field,
  FileDrop,
  ModalActions,
  Select,
  TextArea,
  TextInput,
} from "./FormFields";

/**
 * Add/Edit modals from the Manage Programs Figma section (Container frames
 * 293:21787 – 293:23135, 293:25970). Each one is mounted only while open and
 * hands the saved value back to its parent; nothing is persisted yet.
 */

type ModalBase<T> = {
  initial?: T;
  onClose: () => void;
  onSave: (value: T) => void;
};

/** Reads a named field from a submitted form. */
const read = (form: FormData, name: string) => String(form.get(name) ?? "").trim();

function useSubmit(handler: (form: FormData) => void) {
  return (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    handler(new FormData(e.currentTarget));
  };
}

/* -------------------------------------------------------------------------- */

export function ModuleModal({
  initial,
  nextOrder,
  onClose,
  onSave,
}: ModalBase<ProgramModule> & { nextOrder: number }) {
  const formId = useId();
  const submit = useSubmit((f) => {
    const title = read(f, "title");
    onSave({
      ...(initial ?? {
        id: newId(),
        completion: 0,
        lessons: [],
        scripts: [],
        resources: [],
        questions: [],
        miniProjects: [],
      }),
      title,
      order: Number(read(f, "order")) || nextOrder,
      status: read(f, "status") as ModuleStatus,
    });
  });

  return (
    <Modal
      open
      size="md"
      title={initial ? "Edit Module" : "Add Module"}
      titleClassName="text-gray-900"
      onClose={onClose}
      footer={
        <ModalActions
          formId={formId}
          onCancel={onClose}
          submitLabel={initial ? "Update Module" : "Add Module"}
        />
      }
    >
      <form id={formId} onSubmit={submit} className="flex flex-col gap-4">
        <Field label="Module Name" required>
          {(id) => (
            <TextInput
              id={id}
              name="title"
              required
              defaultValue={initial?.title}
              placeholder="e.g., HTML & CSS Fundamentals"
            />
          )}
        </Field>
        <Field label="Order" required>
          {(id) => (
            <TextInput
              id={id}
              name="order"
              type="number"
              min={1}
              required
              defaultValue={initial?.order ?? nextOrder}
            />
          )}
        </Field>
        <Field label="Status" required>
          {(id) => (
            <Select
              id={id}
              name="status"
              required
              options={["Published", "Draft"]}
              defaultValue={initial?.status ?? ""}
            />
          )}
        </Field>
      </form>
    </Modal>
  );
}

/* -------------------------------------------------------------------------- */

export function LessonModal({ initial, onClose, onSave }: ModalBase<Lesson>) {
  const formId = useId();
  const [scriptMode, setScriptMode] = useState<"file" | "text">("file");
  const submit = useSubmit((f) =>
    onSave({
      id: initial?.id ?? newId(),
      title: read(f, "title"),
      description: read(f, "description"),
      duration: initial?.duration ?? "00:00",
    }),
  );

  return (
    <Modal
      open
      size="md"
      title={initial ? "Edit Lesson" : "Add Lesson"}
      titleClassName="text-gray-900"
      onClose={onClose}
      footer={
        <ModalActions
          formId={formId}
          onCancel={onClose}
          submitLabel={initial ? "Update Lesson" : "Add Lesson"}
        />
      }
    >
      <form id={formId} onSubmit={submit} className="flex flex-col gap-4">
        <Field label="Lesson Title" required>
          {(id) => (
            <TextInput
              id={id}
              name="title"
              required
              defaultValue={initial?.title}
              placeholder="Introduction to HTML"
            />
          )}
        </Field>
        <Field label="Upload Video" required>
          {(id) => (
            <FileDrop
              id={id}
              accept="video/mp4,video/x-matroska,video/x-msvideo,.mkv,.avi"
              hint="Only AVI, MKV and MP4 formats, up to 5MB"
            />
          )}
        </Field>
        <Field label="Description" required>
          {(id) => (
            <TextArea
              id={id}
              name="description"
              required
              defaultValue={initial?.description}
              placeholder="Brief description of the lesson content"
            />
          )}
        </Field>

        <fieldset className="flex flex-col gap-3">
          <legend className="mb-3 text-sm leading-[18px] text-gray-800">
            How would you like to provide the video script?
          </legend>
          <div className="flex flex-wrap gap-8">
            {(
              [
                ["file", "Upload script File"],
                ["text", "Paste Text"],
              ] as const
            ).map(([value, label]) => (
              <label key={value} className="flex items-center gap-2 text-sm leading-[18px] text-slate-700">
                <input
                  type="radio"
                  name="scriptMode"
                  value={value}
                  checked={scriptMode === value}
                  onChange={() => setScriptMode(value)}
                  className="size-5 accent-success"
                />
                {label}
              </label>
            ))}
          </div>
        </fieldset>

        {scriptMode === "file" ? (
          <Field label="Upload Video Script">
            {(id) => (
              <input
                id={id}
                type="file"
                accept=".pdf,.doc,.docx,.txt"
                className="rounded-md border border-gray-300 p-5 text-sm text-slate-700 file:mr-4 file:rounded file:border-0 file:bg-primary-soft file:px-3 file:py-1.5 file:text-primary"
              />
            )}
          </Field>
        ) : (
          <Field label="Paste Video Script">
            {(id) => <TextArea id={id} name="script" rows={5} placeholder="Type your message" />}
          </Field>
        )}
      </form>
    </Modal>
  );
}

/* -------------------------------------------------------------------------- */

/** Options from the Figma "Content Type" dropdown (293:23018). */
const resourceTypes: Record<string, ResourceKind> = {
  "PDF Document": "PDF",
  "URL/Link": "LINK",
  "File/Attachment": "ATTACHMENT",
};

const formatSize = (bytes: number) => `${(bytes / 1024 / 1024).toFixed(1)} MB`;

export function ResourceModal({
  initial,
  title: heading = "Resource",
  onClose,
  onSave,
}: ModalBase<Resource> & { title?: string }) {
  const formId = useId();
  const initialType =
    Object.entries(resourceTypes).find(([, kind]) => kind === initial?.kind)?.[0] ?? "";
  const [type, setType] = useState(initialType);
  const [file, setFile] = useState<File>();

  const submit = useSubmit((f) => {
    const kind = resourceTypes[type];
    const url = read(f, "url");
    onSave({
      id: initial?.id ?? newId(),
      kind,
      title: kind === "LINK" ? url.replace(/^https?:\/\//, "") : (file?.name ?? initial?.title ?? "Untitled"),
      url: kind === "LINK" ? url : undefined,
      size: file ? formatSize(file.size) : initial?.size,
      note: initial?.note,
    });
  });

  return (
    <Modal
      open
      size="md"
      title={`${initial ? "Edit" : "Add"} ${heading}`}
      titleClassName="text-gray-900"
      onClose={onClose}
      footer={
        <ModalActions
          formId={formId}
          onCancel={onClose}
          submitLabel={`${initial ? "Update" : "Add"} ${heading}`}
        />
      }
    >
      <form id={formId} onSubmit={submit} className="flex flex-col gap-4">
        <Field label="Content Type" required>
          {(id) => (
            <Select
              id={id}
              required
              value={type}
              onChange={(e) => setType(e.target.value)}
              options={Object.keys(resourceTypes)}
            />
          )}
        </Field>
        {type === "URL/Link" ? (
          <Field label="URL/Link" required>
            {(id) => (
              <TextInput
                id={id}
                name="url"
                type="url"
                required
                defaultValue={initial?.url}
                placeholder="https://example.com"
              />
            )}
          </Field>
        ) : (
          type && (
            <Field label="Upload File" required>
              {(id) => (
                <FileDrop
                  id={id}
                  accept={type === "PDF Document" ? "application/pdf" : undefined}
                  hint={type === "PDF Document" ? "Only PDF files, up to 5MB" : "Any file type, up to 5MB"}
                  onFile={setFile}
                />
              )}
            </Field>
          )
        )}
      </form>
    </Modal>
  );
}

/* -------------------------------------------------------------------------- */

const optionKeys: OptionKey[] = ["A", "B", "C", "D"];

export function QuestionModal({ initial, onClose, onSave }: ModalBase<Question>) {
  const formId = useId();
  const submit = useSubmit((f) =>
    onSave({
      id: initial?.id ?? newId(),
      question: read(f, "question"),
      options: Object.fromEntries(optionKeys.map((k) => [k, read(f, `option${k}`)])) as Record<
        OptionKey,
        string
      >,
      answer: read(f, "answer") as OptionKey,
      points: Number(read(f, "points")),
      duration: Number(read(f, "duration")),
    }),
  );

  return (
    <Modal
      open
      size="md"
      title={initial ? "Edit Assessment Question" : "Add Assessment Question"}
      titleClassName="text-gray-900"
      onClose={onClose}
      footer={
        <ModalActions
          formId={formId}
          onCancel={onClose}
          submitLabel={initial ? "Update Question" : "Add Question"}
        />
      }
    >
      <form id={formId} onSubmit={submit} className="flex flex-col gap-4">
        <Field label="Question" required>
          {(id) => (
            <TextArea
              id={id}
              name="question"
              required
              defaultValue={initial?.question}
              placeholder="Enter your question"
            />
          )}
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          {optionKeys.map((k) => (
            <Field key={k} label={`Option ${k}`} required>
              {(id) => (
                <TextInput
                  id={id}
                  name={`option${k}`}
                  required
                  defaultValue={initial?.options[k]}
                  placeholder={`Option ${k}`}
                />
              )}
            </Field>
          ))}
        </div>
        <Field label="Correct Answer" required>
          {(id) => (
            <Select
              id={id}
              name="answer"
              required
              options={optionKeys}
              defaultValue={initial?.answer ?? ""}
            />
          )}
        </Field>
        <Field label="Points" required>
          {(id) => (
            <TextInput id={id} name="points" type="number" min={1} required defaultValue={initial?.points ?? 5} />
          )}
        </Field>
        <Field label="Duration (Min)" required>
          {(id) => (
            <TextInput
              id={id}
              name="duration"
              type="number"
              min={1}
              required
              defaultValue={initial?.duration ?? 5}
            />
          )}
        </Field>
      </form>
    </Modal>
  );
}

/* -------------------------------------------------------------------------- */

/** Blue "Rubric Summary" box shown above rubric lists. */
export function RubricSummary({ total }: { total: number }) {
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-blue-200 bg-blue-50 p-4">
      <p className="flex items-center gap-2 text-base leading-6 font-semibold text-blue-900">
        <BarChart3 aria-hidden className="size-4" />
        Rubric Summary
      </p>
      <p className={cn("text-sm leading-5", total === 100 ? "text-blue-800" : "text-danger")}>
        Total Weight: <strong>{total}%</strong>
        {total !== 100 && " — weights should add up to 100%"}
      </p>
    </div>
  );
}

type CriterionDraft = { name: string; description: string; weight: string; maxScore: string };

const toDraft = (c?: RubricCriterion): CriterionDraft => ({
  name: c?.name ?? "",
  description: c?.description ?? "",
  weight: c ? String(c.weight) : "",
  maxScore: c ? String(c.maxScore) : "100",
});

const fromDraft = (d: CriterionDraft, id = newId()): RubricCriterion => ({
  id,
  name: d.name.trim(),
  description: d.description.trim(),
  weight: Number(d.weight) || 0,
  maxScore: Number(d.maxScore) || 0,
});

/** Name / description / weight / max score inputs for one criterion. */
function CriterionFields({
  value,
  onChange,
}: {
  value: CriterionDraft;
  onChange: (value: CriterionDraft) => void;
}) {
  const set = (key: keyof CriterionDraft) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    onChange({ ...value, [key]: e.target.value });

  return (
    <div className="flex flex-col gap-4">
      <Field label="Criterion Name" required>
        {(id) => (
          <TextInput id={id} required value={value.name} onChange={set("name")} placeholder="e.g., Code Quality" />
        )}
      </Field>
      <Field label="Description">
        {(id) => (
          <TextArea
            id={id}
            value={value.description}
            onChange={set("description")}
            placeholder="Describe what this criterion evaluates..."
          />
        )}
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Weight (%)" required hint="Share of the total grade">
          {(id) => (
            <TextInput
              id={id}
              type="number"
              min={0}
              max={100}
              required
              value={value.weight}
              onChange={set("weight")}
              placeholder="25"
            />
          )}
        </Field>
        <Field label="Maximum Score" required hint="Maximum points possible">
          {(id) => (
            <TextInput id={id} type="number" min={1} required value={value.maxScore} onChange={set("maxScore")} />
          )}
        </Field>
      </div>
    </div>
  );
}

export function CriterionModal({
  initial,
  otherWeight,
  onClose,
  onSave,
}: ModalBase<RubricCriterion> & { otherWeight: number }) {
  const formId = useId();
  const [draft, setDraft] = useState(() => toDraft(initial));

  return (
    <Modal
      open
      size="md"
      title={initial ? "Edit Grading Criterion" : "Add Grading Criterion"}
      titleClassName="text-gray-900"
      onClose={onClose}
      footer={
        <ModalActions
          formId={formId}
          onCancel={onClose}
          submitLabel={initial ? "Update Criterion" : "Add Criterion"}
        />
      }
    >
      <form
        id={formId}
        onSubmit={(e) => {
          e.preventDefault();
          onSave(fromDraft(draft, initial?.id));
        }}
        className="flex flex-col gap-4"
      >
        <RubricSummary total={otherWeight + (Number(draft.weight) || 0)} />
        <CriterionFields value={draft} onChange={setDraft} />
      </form>
    </Modal>
  );
}

/* -------------------------------------------------------------------------- */

type MiniStep = "details" | "rubric";

const miniSteps: TabItem<MiniStep>[] = [
  { id: "details", label: "Project Details" },
  { id: "rubric", label: "Grading Rubrics" },
];

export function MiniProjectModal({ initial, onClose, onSave }: ModalBase<MiniProject>) {
  const formId = useId();
  const [step, setStep] = useState<MiniStep>("details");
  const [details, setDetails] = useState({
    title: initial?.title ?? "",
    description: initial?.description ?? "",
    totalScore: String(initial?.totalScore ?? 100),
    passPercentage: String(initial?.passPercentage ?? 70),
  });
  const [criteria, setCriteria] = useState<CriterionDraft[]>(() =>
    initial?.rubric.length ? initial.rubric.map(toDraft) : [toDraft()],
  );

  const total = criteria.reduce((sum, c) => sum + (Number(c.weight) || 0), 0);
  const set = (key: keyof typeof details) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setDetails({ ...details, [key]: e.target.value });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (step === "details") return setStep("rubric");
    onSave({
      id: initial?.id ?? newId(),
      title: details.title.trim(),
      description: details.description.trim(),
      totalScore: Number(details.totalScore),
      passPercentage: Number(details.passPercentage),
      rubric: criteria.map((c, i) => fromDraft(c, initial?.rubric[i]?.id)),
    });
  };

  return (
    <Modal
      open
      size="md"
      title={initial ? "Edit Mini Project" : "Add Mini Project"}
      titleClassName="text-gray-900"
      onClose={onClose}
      footer={
        step === "details" ? (
          <ModalActions formId={formId} onCancel={onClose} submitLabel="Save & Proceed" />
        ) : (
          <ModalActions
            formId={formId}
            cancelLabel="Previous"
            onCancel={() => setStep("details")}
            submitLabel="Save Mini Project"
          />
        )
      }
    >
      <Tabs
        idBase="mini-project"
        label="Mini project steps"
        tabs={miniSteps}
        value={step}
        onChange={setStep}
        className="-mx-6 -mt-6"
      />
      <form id={formId} onSubmit={submit}>
        {step === "details" ? (
          <TabPanel idBase="mini-project" id="details" className="flex flex-col gap-4">
            <Field label="Project Title" required>
              {(id) => (
                <TextInput
                  id={id}
                  required
                  value={details.title}
                  onChange={set("title")}
                  placeholder="e.g., Build a Landing Page"
                />
              )}
            </Field>
            <Field label="Description" required>
              {(id) => (
                <TextArea
                  id={id}
                  required
                  value={details.description}
                  onChange={set("description")}
                  placeholder="Describe the project requirements and objectives"
                />
              )}
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Total Score" required>
                {(id) => (
                  <TextInput
                    id={id}
                    type="number"
                    min={1}
                    required
                    value={details.totalScore}
                    onChange={set("totalScore")}
                  />
                )}
              </Field>
              <Field label="Pass Percentage" required>
                {(id) => (
                  <TextInput
                    id={id}
                    type="number"
                    min={0}
                    max={100}
                    required
                    value={details.passPercentage}
                    onChange={set("passPercentage")}
                  />
                )}
              </Field>
            </div>
          </TabPanel>
        ) : (
          <TabPanel idBase="mini-project" id="rubric" className="flex flex-col gap-5">
            <RubricSummary total={total} />
            {criteria.map((c, i) => (
              <div key={i} className={cn("flex flex-col gap-3", i > 0 && "border-t border-gray-200 pt-5")}>
                {criteria.length > 1 && (
                  <div className="flex items-center justify-between">
                    <p className="text-sm leading-5 font-semibold text-gray-900">Criterion {i + 1}</p>
                    <button
                      type="button"
                      onClick={() => setCriteria(criteria.filter((_, j) => j !== i))}
                      className="text-sm leading-5 text-danger hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                )}
                <CriterionFields
                  value={c}
                  onChange={(v) => setCriteria(criteria.map((x, j) => (j === i ? v : x)))}
                />
              </div>
            ))}
            <button
              type="button"
              onClick={() => setCriteria([...criteria, toDraft()])}
              className="flex h-[30px] items-center justify-center rounded-lg border border-primary text-sm leading-5 text-slate-900 hover:bg-primary-soft"
            >
              + Add More
            </button>
          </TabPanel>
        )}
      </form>
    </Modal>
  );
}

/* -------------------------------------------------------------------------- */

export function SchoolModal({ initial, onClose, onSave }: ModalBase<School>) {
  const formId = useId();
  const [status, setStatus] = useState<SchoolStatus>(initial?.status ?? "Active");
  const submit = useSubmit((f) =>
    onSave({
      ...(initial ?? {
        id: newId(),
        programs: 0,
        students: 0,
        created: new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }),
      }),
      type: read(f, "type") as SchoolType,
      name: read(f, "name"),
      description: read(f, "description"),
      status,
    }),
  );

  return (
    <Modal
      open
      size="sm"
      title={initial ? "Edit School" : "Create New School"}
      titleClassName="text-lg leading-7 text-gray-900"
      subtitle={
        <p className="text-xs leading-4 text-gray-500">
          {initial ? "Update school details" : "Set up a new academic school"}
        </p>
      }
      onClose={onClose}
      footer={
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="h-11 rounded-lg border border-gray-300 px-6 text-sm leading-5 font-semibold text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            form={formId}
            className="h-11 rounded-lg bg-primary px-6 text-sm leading-5 font-medium text-white hover:bg-primary/90"
          >
            {initial ? "Save Changes" : "Create School"}
          </button>
        </div>
      }
    >
      <form id={formId} onSubmit={submit} className="flex flex-col gap-4">
        <Field label="Type">
          {(id) => (
            <Select
              id={id}
              name="type"
              required
              options={["For Individuals", "For Business(es)"]}
              defaultValue={initial?.type ?? "For Individuals"}
            />
          )}
        </Field>
        <Field label="School Name" required>
          {(id) => (
            <TextInput
              id={id}
              name="name"
              required
              defaultValue={initial?.name}
              placeholder="e.g. School of Engineering"
            />
          )}
        </Field>
        <Field label="Description">
          {(id) => (
            <TextArea
              id={id}
              name="description"
              defaultValue={initial?.description}
              placeholder="Briefly describe this school's focus and programs..."
            />
          )}
        </Field>
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-2 text-sm leading-5 font-medium text-gray-700">Status</legend>
          <div className="flex gap-3">
            {(["Active", "Inactive"] as const).map((s) => (
              <button
                key={s}
                type="button"
                aria-pressed={status === s}
                onClick={() => setStatus(s)}
                className={cn(
                  "h-[42px] w-[106px] rounded-lg border text-sm leading-5 font-medium",
                  status === s
                    ? s === "Active"
                      ? "border-green-500 bg-green-50 text-green-700"
                      : "border-gray-400 bg-gray-100 text-gray-700"
                    : "border-gray-200 text-gray-500 hover:bg-gray-50",
                )}
              >
                {s}
              </button>
            ))}
          </div>
        </fieldset>
      </form>
    </Modal>
  );
}

/* -------------------------------------------------------------------------- */

/** Small confirmation before removing anything (not in the design, but deletes need a guard). */
export function ConfirmDeleteModal({
  name,
  onClose,
  onConfirm,
}: {
  name: string;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <Modal
      open
      size="sm"
      title="Delete item?"
      titleClassName="text-lg leading-7 text-gray-900"
      onClose={onClose}
      footer={
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="h-11 rounded-lg border border-gray-300 px-6 text-sm leading-5 font-semibold text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="h-11 rounded-lg bg-danger px-6 text-sm leading-5 font-semibold text-white hover:bg-danger/90"
          >
            Delete
          </button>
        </div>
      }
    >
      <p className="text-sm leading-5 text-slate-700">
        <strong className="text-gray-900">{name}</strong> will be removed. This can&apos;t be undone.
      </p>
    </Modal>
  );
}
