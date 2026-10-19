"use client";

import { useState } from "react";
import Link from "next/link";
import {
  CheckCircle,
  ChevronDown,
  Edit,
  ExternalLink,
  Eye,
  FileText,
  HelpCircle,
  List,
  Paperclip,
  PlayCircle,
  Plus,
  Trash2,
} from "lucide-react";
import { Pill } from "@/components/ui/Pill";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { cn } from "@/lib/cn";
import type { Lesson, MiniProject, OptionKey, ProgramModule, Question, Resource } from "./data";
import { IconButton } from "./FormFields";
import {
  ConfirmDeleteModal,
  LessonModal,
  MiniProjectModal,
  QuestionModal,
  ResourceModal,
} from "./ProgramModals";

/**
 * One module in "Modules & Content" (Figma 293:20412 / 293:21085): a summary row
 * that expands into Lesson, Script, Resources, Assessment and Mini Projects.
 */

type ListKey = "lessons" | "scripts" | "resources" | "questions" | "miniProjects";

type Dialog =
  | { kind: "lesson"; item?: Lesson }
  | { kind: "script" | "resource"; item?: Resource }
  | { kind: "question"; item?: Question }
  | { kind: "mini"; item?: MiniProject }
  | { kind: "delete"; list: ListKey; id: string; name: string };

function Section({
  icon,
  title,
  action,
  onAction,
  aside,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  action: string;
  onAction: () => void;
  aside?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3 border-b border-gray-200 p-4 last:border-b-0">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h5 className="flex items-center gap-2 text-base leading-6 font-semibold text-gray-900">
          <span aria-hidden className="text-primary">
            {icon}
          </span>
          {title}
        </h5>
        <div className="flex items-center gap-2">
          {aside}
          <button
            type="button"
            onClick={onAction}
            className="flex h-8 items-center gap-1.5 rounded-lg border border-primary bg-white px-3 text-sm leading-5 font-medium text-primary hover:bg-primary-soft"
          >
            <Plus aria-hidden className="size-4" />
            {action}
          </button>
        </div>
      </div>
      {children}
    </section>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="py-2 text-center text-sm leading-5 text-gray-500">{children}</p>;
}

const resourceTiles: Record<Resource["kind"], { tile: string; Icon: typeof FileText }> = {
  PDF: { tile: "bg-red-100 text-red-600", Icon: FileText },
  LINK: { tile: "bg-blue-100 text-blue-600", Icon: ExternalLink },
  ATTACHMENT: { tile: "bg-gray-100 text-gray-600", Icon: Paperclip },
};

/** White row with an icon tile, title + type tag, meta line and actions. */
function ItemRow({
  tile,
  icon,
  title,
  tag,
  meta,
  onView,
  onEdit,
  onDelete,
}: {
  tile: string;
  icon: React.ReactNode;
  title: string;
  tag: string;
  meta: string[];
  onView?: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <li className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white px-3 py-3">
      <span aria-hidden className={cn("grid size-[34px] shrink-0 place-items-center rounded-lg", tile)}>
        {icon}
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <p className="flex flex-wrap items-center gap-2">
          <span className="text-sm leading-5 font-medium text-gray-900">{title}</span>
          <span className="rounded bg-gray-100 px-2 py-0.5 text-xs leading-4 text-gray-600">{tag}</span>
        </p>
        {meta.length > 0 && <p className="text-xs leading-4 text-gray-600">{meta.join("  •  ")}</p>}
      </div>
      <div className="flex shrink-0 items-center gap-1">
        {onView && (
          <IconButton label={`Preview ${title}`} tone="green" onClick={onView}>
            <Eye aria-hidden className="size-3.5" />
          </IconButton>
        )}
        <IconButton label={`Edit ${title}`} onClick={onEdit}>
          <Edit aria-hidden className="size-3.5" />
        </IconButton>
        <IconButton label={`Delete ${title}`} tone="red" onClick={onDelete}>
          <Trash2 aria-hidden className="size-3.5" />
        </IconButton>
      </div>
    </li>
  );
}

function QuestionCard({
  q,
  onEdit,
  onDelete,
}: {
  q: Question;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <li className="flex gap-3 rounded-lg border border-gray-200 bg-white p-3">
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <p className="text-xs leading-4 text-gray-600">{q.points} points</p>
        <p className="text-sm leading-5 font-medium text-gray-900">{q.question}</p>
        <ul className="grid gap-1.5 sm:grid-cols-2">
          {(Object.entries(q.options) as [OptionKey, string][]).map(([key, text]) => {
            const correct = key === q.answer;
            return (
              <li
                key={key}
                className={cn(
                  "flex items-center gap-1.5 rounded border px-3 py-[7px] text-xs leading-4",
                  correct
                    ? "border-green-300 bg-green-50 font-medium text-green-900"
                    : "border-gray-200 bg-gray-50 text-gray-700",
                )}
              >
                {key}. {text}
                {correct && (
                  <>
                    <CheckCircle aria-hidden className="size-3 text-green-600" />
                    <span className="sr-only">(correct answer)</span>
                  </>
                )}
              </li>
            );
          })}
        </ul>
      </div>
      <div className="flex shrink-0 items-start gap-1">
        <IconButton label="Edit question" onClick={onEdit}>
          <Edit aria-hidden className="size-3.5" />
        </IconButton>
        <IconButton label="Delete question" tone="red" onClick={onDelete}>
          <Trash2 aria-hidden className="size-3.5" />
        </IconButton>
      </div>
    </li>
  );
}

export function ModuleCard({
  module,
  programId,
  defaultOpen = false,
  onChange,
  onEdit,
  onDelete,
}: {
  module: ProgramModule;
  programId: string;
  defaultOpen?: boolean;
  onChange: (module: ProgramModule) => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const [dialog, setDialog] = useState<Dialog | null>(null);
  const panelId = `module-panel-${module.id}`;
  const close = () => setDialog(null);

  /** Insert or replace an item (matched by id) in one of the module's lists. */
  function upsert<K extends ListKey>(list: K, item: ProgramModule[K][number]) {
    const items = module[list] as Array<{ id: string }>;
    const next = items.some((x) => x.id === item.id)
      ? items.map((x) => (x.id === item.id ? item : x))
      : [...items, item];
    onChange({ ...module, [list]: next });
    close();
  }

  const remove = (list: ListKey, id: string) => {
    onChange({ ...module, [list]: (module[list] as Array<{ id: string }>).filter((x) => x.id !== id) });
    close();
  };

  const askDelete = (list: ListKey, id: string, name: string) =>
    setDialog({ kind: "delete", list, id, name });

  const resourceRow = (list: "scripts" | "resources", r: Resource) => {
    const { tile, Icon } = resourceTiles[r.kind];
    return (
      <ItemRow
        key={r.id}
        tile={tile}
        icon={<Icon className="size-[18px]" />}
        title={r.title}
        tag={r.kind}
        meta={[r.size && `Size: ${r.size}`, r.note].filter(Boolean) as string[]}
        onView={r.url ? () => window.open(r.url, "_blank", "noopener") : undefined}
        onEdit={() => setDialog({ kind: list === "scripts" ? "script" : "resource", item: r })}
        onDelete={() => askDelete(list, r.id, r.title)}
      />
    );
  };

  return (
    <li className="overflow-hidden rounded-lg border border-gray-200 bg-white">
      {/* Summary row */}
      <div className="flex flex-wrap items-start gap-3 p-4 sm:flex-nowrap">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-controls={panelId}
          aria-label={`${open ? "Collapse" : "Expand"} ${module.title}`}
          className="grid size-9 shrink-0 place-items-center rounded-lg text-gray-700 hover:bg-gray-100"
        >
          <ChevronDown aria-hidden className={cn("size-5 transition-transform", open && "rotate-180")} />
        </button>
        <span aria-hidden className="grid size-9 shrink-0 place-items-center rounded-lg bg-purple-100 text-accent">
          <FileText className="size-5" />
        </span>

        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <p className="flex flex-wrap items-baseline gap-2">
            <span className="text-base leading-6 font-semibold text-heading">{module.title}</span>
            <span className="text-xs leading-4 text-slate-900">Module {module.order}</span>
          </p>
          <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm leading-5 text-slate-900">
            <span>
              {module.lessons.length} {module.lessons.length === 1 ? "lesson" : "lessons"}
            </span>
            {module.resources.length > 0 && (
              <>
                <span aria-hidden>•</span>
                <span>{module.resources.length} Resources</span>
              </>
            )}
            {module.mcqPass !== undefined && (
              <>
                <span aria-hidden>•</span>
                <span>MCQ Pass: {module.mcqPass}%</span>
              </>
            )}
            {module.miniProjectRequired && (
              <>
                <span aria-hidden>•</span>
                <span className="text-primary">Mini Project Required</span>
              </>
            )}
          </p>
          <div className="flex items-center gap-2">
            <ProgressBar
              value={module.completion}
              label={`${module.title} completion`}
              barClassName="bg-green-600"
              className="max-w-[320px]"
            />
            <span className="shrink-0 text-xs leading-4 text-slate-900">{module.completion}% completed</span>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <Pill tone={module.status === "Published" ? "green" : "yellow"}>{module.status}</Pill>
          <IconButton label={`Edit ${module.title}`} size="md" onClick={onEdit}>
            <Edit aria-hidden className="size-4" />
          </IconButton>
          <IconButton label={`Delete ${module.title}`} size="md" tone="red" onClick={onDelete}>
            <Trash2 aria-hidden className="size-4" />
          </IconButton>
        </div>
      </div>

      {/* Expanded content */}
      {open && (
        <div id={panelId} className="border-t border-gray-200 bg-gray-50">
          <Section
            icon={<PlayCircle className="size-[18px]" />}
            title="Lesson"
            action="Add Lesson"
            onAction={() => setDialog({ kind: "lesson" })}
          >
            {module.lessons.length ? (
              <ul className="flex flex-col gap-2">
                {module.lessons.map((l) => (
                  <ItemRow
                    key={l.id}
                    tile="bg-purple-100 text-accent"
                    icon={<PlayCircle className="size-[18px]" />}
                    title={l.title}
                    tag="VIDEO"
                    meta={[`Duration: ${l.duration}`]}
                    onEdit={() => setDialog({ kind: "lesson", item: l })}
                    onDelete={() => askDelete("lessons", l.id, l.title)}
                  />
                ))}
              </ul>
            ) : (
              <Empty>No lessons added yet</Empty>
            )}
          </Section>

          <Section
            icon={<Paperclip className="size-[18px]" />}
            title="Script"
            action="Add Script"
            onAction={() => setDialog({ kind: "script" })}
          >
            {module.scripts.length ? (
              <ul className="flex flex-col gap-2">{module.scripts.map((r) => resourceRow("scripts", r))}</ul>
            ) : (
              <Empty>No scripts added yet</Empty>
            )}
          </Section>

          <Section
            icon={<Paperclip className="size-[18px]" />}
            title={`Resources (${module.resources.length})`}
            action="Add Resource"
            onAction={() => setDialog({ kind: "resource" })}
          >
            {module.resources.length ? (
              <ul className="flex flex-col gap-2">
                {module.resources.map((r) => resourceRow("resources", r))}
              </ul>
            ) : (
              <Empty>No resources added yet</Empty>
            )}
          </Section>

          <Section
            icon={<HelpCircle className="size-[18px]" />}
            title={`Assessment (${module.questions.length})`}
            action="Add MCQ"
            onAction={() => setDialog({ kind: "question" })}
            aside={
              module.questions.length > 0 && (
                <Link
                  href={`/manage-programs/${programId}/assessment/${module.id}`}
                  className="flex h-8 items-center gap-1.5 rounded-lg px-3 text-sm leading-5 font-medium text-primary hover:bg-primary-soft"
                >
                  <Eye aria-hidden className="size-4" />
                  Preview Test
                </Link>
              )
            }
          >
            {module.questions.length ? (
              <ul className="flex flex-col gap-2">
                {module.questions.map((q) => (
                  <QuestionCard
                    key={q.id}
                    q={q}
                    onEdit={() => setDialog({ kind: "question", item: q })}
                    onDelete={() => askDelete("questions", q.id, q.question)}
                  />
                ))}
              </ul>
            ) : (
              <Empty>No questions added yet</Empty>
            )}
          </Section>

          <Section
            icon={<List className="size-[18px]" />}
            title={`Mini Projects (${module.miniProjects.length})`}
            action="Add Mini Project"
            onAction={() => setDialog({ kind: "mini" })}
          >
            {module.miniProjects.length ? (
              <ul className="flex flex-col gap-2">
                {module.miniProjects.map((p) => (
                  <li key={p.id} className="flex gap-3 rounded-lg border border-gray-200 bg-white p-4">
                    <div className="flex min-w-0 flex-1 flex-col gap-3">
                      <div className="flex flex-col gap-1">
                        <p className="text-base leading-6 font-semibold text-gray-900">{p.title}</p>
                        <p className="text-sm leading-5 text-gray-600">{p.description}</p>
                      </div>
                      <dl className="flex flex-wrap gap-3">
                        <div className="w-[190px] rounded-lg bg-gray-50 p-3">
                          <dt className="text-xs leading-4 text-gray-600">Total Score</dt>
                          <dd className="text-xl leading-7 font-semibold text-gray-900">{p.totalScore}</dd>
                        </div>
                        <div className="w-[190px] rounded-lg bg-gray-50 p-3">
                          <dt className="text-xs leading-4 text-gray-600">Pass %</dt>
                          <dd className="text-xl leading-7 font-semibold text-primary">{p.passPercentage}%</dd>
                        </div>
                      </dl>
                    </div>
                    <div className="flex shrink-0 items-start gap-1">
                      <IconButton label={`Edit ${p.title}`} onClick={() => setDialog({ kind: "mini", item: p })}>
                        <Edit aria-hidden className="size-3.5" />
                      </IconButton>
                      <IconButton
                        label={`Delete ${p.title}`}
                        tone="red"
                        onClick={() => askDelete("miniProjects", p.id, p.title)}
                      >
                        <Trash2 aria-hidden className="size-3.5" />
                      </IconButton>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <Empty>No mini projects added yet</Empty>
            )}
          </Section>
        </div>
      )}

      {dialog?.kind === "lesson" && (
        <LessonModal initial={dialog.item} onClose={close} onSave={(l) => upsert("lessons", l)} />
      )}
      {dialog?.kind === "script" && (
        <ResourceModal
          title="Script"
          initial={dialog.item}
          onClose={close}
          onSave={(r) => upsert("scripts", r)}
        />
      )}
      {dialog?.kind === "resource" && (
        <ResourceModal initial={dialog.item} onClose={close} onSave={(r) => upsert("resources", r)} />
      )}
      {dialog?.kind === "question" && (
        <QuestionModal initial={dialog.item} onClose={close} onSave={(q) => upsert("questions", q)} />
      )}
      {dialog?.kind === "mini" && (
        <MiniProjectModal initial={dialog.item} onClose={close} onSave={(p) => upsert("miniProjects", p)} />
      )}
      {dialog?.kind === "delete" && (
        <ConfirmDeleteModal
          name={dialog.name}
          onClose={close}
          onConfirm={() => remove(dialog.list, dialog.id)}
        />
      )}
    </li>
  );
}
