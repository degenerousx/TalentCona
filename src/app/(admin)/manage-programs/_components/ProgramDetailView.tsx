"use client";

import { useState } from "react";
import { Edit, Plus, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Pill } from "@/components/ui/Pill";
import { Tabs, TabPanel, type TabItem } from "@/components/ui/Tabs";
import type { ProgramDetail, ProgramModule, RubricCriterion } from "./data";
import { IconButton } from "./FormFields";
import { ModuleCard } from "./ModuleCard";
import { ConfirmDeleteModal, CriterionModal, ModuleModal, RubricSummary } from "./ProgramModals";

type TabId = "modules" | "mini-rubric" | "final-rubric";

const tabs: TabItem<TabId>[] = [
  { id: "modules", label: "Modules & Content" },
  { id: "mini-rubric", label: "Mini Project Grading Rubrics" },
  { id: "final-rubric", label: "Final Project Grading Rubrics" },
];

function PanelHeading({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="flex flex-col gap-1">
        <h3 className="text-lg leading-7 font-semibold text-heading">{title}</h3>
        <p className="text-sm leading-5 text-slate-900">{description}</p>
      </div>
      {action}
    </div>
  );
}

/** Weighted criteria list used by both rubric tabs (Figma 293:21829 / 293:26066). */
function Rubric({
  criteria,
  onChange,
}: {
  criteria: RubricCriterion[];
  onChange: (criteria: RubricCriterion[]) => void;
}) {
  const [editing, setEditing] = useState<RubricCriterion | "new" | null>(null);
  const [deleting, setDeleting] = useState<RubricCriterion | null>(null);
  const total = criteria.reduce((sum, c) => sum + c.weight, 0);
  const current = editing === "new" ? undefined : (editing ?? undefined);

  return (
    <div className="flex flex-col gap-5">
      <PanelHeading
        title="Grading Rubrics"
        description="Define evaluation criteria for project assessments"
        action={
          <Button
            variant="accent"
            size="md"
            icon={<Plus aria-hidden className="size-5" />}
            onClick={() => setEditing("new")}
          >
            Add Criterion
          </Button>
        }
      />

      <RubricSummary total={total} />

      <ul className="flex flex-col gap-3">
        {criteria.map((c) => (
          <li
            key={c.id}
            className="flex items-start justify-between gap-4 rounded-lg border border-gray-200 bg-white p-4"
          >
            <div className="flex min-w-0 flex-col gap-1">
              <p className="flex flex-wrap items-center gap-2">
                <span className="text-sm leading-5 font-semibold text-gray-900">{c.name}</span>
                <span className="rounded-full bg-purple-100 px-2 py-0.5 text-xs leading-4 text-purple-700">
                  {c.weight}% weight
                </span>
                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs leading-4 text-gray-700">
                  Max Score: {c.maxScore}
                </span>
              </p>
              <p className="text-xs leading-4 text-gray-600">{c.description}</p>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <IconButton label={`Edit ${c.name}`} size="md" onClick={() => setEditing(c)}>
                <Edit aria-hidden className="size-4" />
              </IconButton>
              <IconButton label={`Delete ${c.name}`} size="md" tone="red" onClick={() => setDeleting(c)}>
                <Trash2 aria-hidden className="size-4" />
              </IconButton>
            </div>
          </li>
        ))}
      </ul>

      {editing && (
        <CriterionModal
          initial={current}
          otherWeight={total - (current?.weight ?? 0)}
          onClose={() => setEditing(null)}
          onSave={(c) => {
            onChange(current ? criteria.map((x) => (x.id === c.id ? c : x)) : [...criteria, c]);
            setEditing(null);
          }}
        />
      )}
      {deleting && (
        <ConfirmDeleteModal
          name={deleting.name}
          onClose={() => setDeleting(null)}
          onConfirm={() => {
            onChange(criteria.filter((x) => x.id !== deleting.id));
            setDeleting(null);
          }}
        />
      )}
    </div>
  );
}

export function ProgramDetailView({ program }: { program: ProgramDetail }) {
  const [tab, setTab] = useState<TabId>("modules");
  // Local copies so the add/edit/delete modals work before there is an API.
  const [modules, setModules] = useState(program.modulesList);
  const [miniRubric, setMiniRubric] = useState(program.miniProjectRubric);
  const [finalRubric, setFinalRubric] = useState(program.finalProjectRubric);
  const [editingModule, setEditingModule] = useState<ProgramModule | "new" | null>(null);
  const [deletingModule, setDeletingModule] = useState<ProgramModule | null>(null);

  const sorted = [...modules].sort((a, b) => a.order - b.order);
  const stats = [
    { label: "Duration", value: program.duration },
    { label: "Total Modules", value: String(program.modules) },
    { label: "Enrolled Students", value: String(program.students) },
    { label: "Avg Completion", value: `${program.avgCompletion}%` },
  ];

  const saveModule = (m: ProgramModule) => {
    setModules((list) => (list.some((x) => x.id === m.id) ? list.map((x) => (x.id === m.id ? m : x)) : [...list, m]));
    setEditingModule(null);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header card (Figma: purple-200 border over a violet-to-blue wash) */}
      <section className="flex flex-col gap-4 rounded-lg border border-purple-200 bg-linear-to-r from-[#faf5ff] to-[#eff6ff] p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl leading-8 font-bold text-heading">{program.name}</h1>
            <p className="text-base leading-6 text-slate-500">{program.description}</p>
          </div>
          <Pill tone={program.status === "Active" ? "green" : "yellow"} size="sm">
            {program.status}
          </Pill>
        </div>
        <dl className="grid grid-cols-2 gap-6 lg:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label}>
              <dt className="text-sm leading-5 text-slate-900">{s.label}</dt>
              <dd className="text-lg leading-7 font-semibold text-heading">{s.value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <Card className="overflow-hidden" flat>
        <Tabs idBase="program" label="Program sections" tabs={tabs} value={tab} onChange={setTab} />

        <div className="p-6">
          {tab === "modules" && (
            <TabPanel idBase="program" id="modules" className="flex flex-col gap-6">
              <PanelHeading
                title="Modules & Content"
                description="Organize course content into modules with lessons, videos, and resources"
                action={
                  <Button
                    size="md"
                    icon={<Plus aria-hidden className="size-[18px]" />}
                    className="font-semibold"
                    onClick={() => setEditingModule("new")}
                  >
                    Add Module
                  </Button>
                }
              />

              {sorted.length > 0 ? (
                <ul className="flex flex-col gap-3">
                  {sorted.map((m, i) => (
                    <ModuleCard
                      key={m.id}
                      module={m}
                      programId={program.id}
                      defaultOpen={i === 0}
                      onChange={saveModule}
                      onEdit={() => setEditingModule(m)}
                      onDelete={() => setDeletingModule(m)}
                    />
                  ))}
                </ul>
              ) : (
                <p className="rounded-lg bg-gray-50 p-6 text-center text-sm leading-5 text-slate-500">
                  No modules have been added to this program yet.
                </p>
              )}
            </TabPanel>
          )}

          {tab === "mini-rubric" && (
            <TabPanel idBase="program" id="mini-rubric">
              <Rubric criteria={miniRubric} onChange={setMiniRubric} />
            </TabPanel>
          )}

          {tab === "final-rubric" && (
            <TabPanel idBase="program" id="final-rubric">
              <Rubric criteria={finalRubric} onChange={setFinalRubric} />
            </TabPanel>
          )}
        </div>
      </Card>

      {editingModule && (
        <ModuleModal
          initial={editingModule === "new" ? undefined : editingModule}
          nextOrder={modules.length + 1}
          onClose={() => setEditingModule(null)}
          onSave={saveModule}
        />
      )}
      {deletingModule && (
        <ConfirmDeleteModal
          name={deletingModule.title}
          onClose={() => setDeletingModule(null)}
          onConfirm={() => {
            setModules((list) => list.filter((x) => x.id !== deletingModule.id));
            setDeletingModule(null);
          }}
        />
      )}
    </div>
  );
}
