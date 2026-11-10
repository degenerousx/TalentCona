"use client";

import { useState } from "react";
import { ArrowDown, ArrowUp, Edit, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Toaster } from "@/components/shadcn/sonner";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { GradeScaleTable } from "@/components/ui/Grade";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/States";
import { TabPanel, Tabs, type TabItem } from "@/components/ui/Tabs";
import { PASS_MARK, RUBRIC_TOTAL_WEIGHT } from "@/config/grading";
import { IconButton } from "./FormFields";
import {
  useDeleteCriterion,
  useGradingPrograms,
  useMoveCriterion,
  useRubric,
  useSaveCriterion,
  type ApiCriterion,
  type RubricScope,
} from "./gradingApi";
import { ConfirmDeleteModal, CriterionModal, RubricSummary } from "./ProgramModals";

const errorMessage = (error: unknown) =>
  error instanceof Error && error.message ? error.message : "Something went wrong. Please try again.";

const scopes: TabItem<RubricScope>[] = [
  { id: "MiniProject", label: "Mini Project Rubric" },
  { id: "FinalProject", label: "Final Project Rubric" },
];

/** One program's rubric for one scope, saved to the backend. */
function RubricEditor({ programId, scope }: { programId: string; scope: RubricScope }) {
  const query = useRubric(programId, scope);
  const save = useSaveCriterion(programId, scope);
  const remove = useDeleteCriterion(programId, scope);
  const move = useMoveCriterion(programId, scope);
  const [editing, setEditing] = useState<ApiCriterion | "new" | null>(null);
  const [deleting, setDeleting] = useState<ApiCriterion | null>(null);

  if (query.isPending) return <LoadingState variant="block" label="Loading rubric…" />;
  if (query.isError) return <ErrorState error={query.error} title="Couldn't load this rubric" onRetry={() => void query.refetch()} retrying={query.isFetching} />;

  const criteria = query.data;
  const total = criteria.reduce((sum, c) => sum + c.weightPercent, 0);
  const current = editing === "new" ? undefined : (editing ?? undefined);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h3 className="text-lg leading-7 font-semibold text-gray-900">{scope === "MiniProject" ? "Mini project" : "Final project"} criteria</h3>
          <p className="text-sm leading-5 text-gray-600">
            Mentors score each criterion; the backend weights the scores into the submission&apos;s percent and grade.
          </p>
        </div>
        <Button variant="accent" size="md" icon={<Plus aria-hidden className="size-5" />} onClick={() => setEditing("new")}>
          Add Criterion
        </Button>
      </div>

      <RubricSummary total={total} />
      {criteria.length === 0 && (
        <p role="status" className="rounded-lg bg-warning-soft p-3 text-sm leading-5 text-warning">
          This rubric has no criteria yet. The program can&apos;t be published until it has at least one.
        </p>
      )}

      {criteria.length > 0 && (
        <ul className="flex flex-col gap-3">
          {criteria.map((c, i) => (
            <li key={c.id} className="flex items-start justify-between gap-4 rounded-lg border border-gray-200 bg-white p-4">
              <div className="flex min-w-0 flex-col gap-1">
                <p className="flex flex-wrap items-center gap-2">
                  <span className="text-sm leading-5 font-semibold text-gray-900">
                    {i + 1}. {c.title}
                  </span>
                  <span className="rounded-full bg-purple-100 px-2 py-0.5 text-xs leading-4 text-purple-700">{c.weightPercent}% weight</span>
                  <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs leading-4 text-gray-700">Max Score: {c.maxScore}</span>
                </p>
                {c.description && <p className="text-xs leading-4 text-gray-600">{c.description}</p>}
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <IconButton label={`Move ${c.title} up`} size="md" disabled={i === 0 || move.isPending} onClick={() => move.mutate({ id: c.id, order: i }, { onError: (e) => toast.error(errorMessage(e)) })}>
                  <ArrowUp aria-hidden className="size-4" />
                </IconButton>
                <IconButton
                  label={`Move ${c.title} down`}
                  size="md"
                  disabled={i === criteria.length - 1 || move.isPending}
                  onClick={() => move.mutate({ id: c.id, order: i + 2 }, { onError: (e) => toast.error(errorMessage(e)) })}
                >
                  <ArrowDown aria-hidden className="size-4" />
                </IconButton>
                <IconButton label={`Edit ${c.title}`} size="md" onClick={() => setEditing(c)}>
                  <Edit aria-hidden className="size-4" />
                </IconButton>
                <IconButton label={`Delete ${c.title}`} size="md" tone="red" onClick={() => setDeleting(c)}>
                  <Trash2 aria-hidden className="size-4" />
                </IconButton>
              </div>
            </li>
          ))}
        </ul>
      )}

      {editing && (
        <CriterionModal
          initial={current ? { id: current.id, name: current.title, description: current.description ?? "", weight: current.weightPercent, maxScore: current.maxScore } : undefined}
          otherWeight={total - (current?.weightPercent ?? 0)}
          onClose={() => setEditing(null)}
          onSave={(c) => {
            if (c.weight < 1 || c.weight > 100) return toast.error("Weight must be between 1 and 100%.");
            if (c.maxScore < 1) return toast.error("Maximum score must be at least 1.");
            const after = total - (current?.weightPercent ?? 0) + c.weight;
            if (after > RUBRIC_TOTAL_WEIGHT) return toast.error(`Weights would add up to ${after}%. Lower this or another criterion so the total is ${RUBRIC_TOTAL_WEIGHT}%.`);
            save.mutate(
              { id: current?.id, input: { title: c.name, description: c.description, weightPercent: c.weight, maxScore: c.maxScore } },
              {
                onSuccess: () => {
                  toast.success(current ? `"${c.name}" updated` : `"${c.name}" added`);
                  setEditing(null);
                },
                onError: (e) => toast.error(errorMessage(e)),
              },
            );
          }}
        />
      )}
      {deleting && (
        <ConfirmDeleteModal
          name={deleting.title}
          onClose={() => setDeleting(null)}
          onConfirm={() =>
            remove.mutate(deleting.id, {
              onSuccess: () => {
                toast.success(`"${deleting.title}" deleted`);
                setDeleting(null);
              },
              onError: (e) => toast.error(errorMessage(e)),
            })
          }
        />
      )}
    </div>
  );
}

/**
 * Grading setup: each program's two rubrics (stored by the backend) and the
 * portal-wide grade scale (src/config/grading.ts).
 */
export function GradingView() {
  const programs = useGradingPrograms();
  const [programId, setProgramId] = useState<string | null>(null);
  const [scope, setScope] = useState<RubricScope>("MiniProject");
  const selected = programs.data?.find((p) => p.id === programId);

  return (
    <div className="flex flex-col gap-6">
      <Card className="flex flex-col gap-4 p-6">
        <label className="flex max-w-xl flex-col gap-2 text-sm leading-5 font-medium text-gray-700">
          Program
          {programs.isPending ? (
            <LoadingState variant="inline" label="Loading programs…" />
          ) : programs.isError ? (
            <ErrorState error={programs.error} title="Couldn't load programs" onRetry={() => void programs.refetch()} retrying={programs.isFetching} />
          ) : (
            <select
              value={programId ?? ""}
              onChange={(e) => setProgramId(e.target.value || null)}
              className="h-11 rounded-lg border border-gray-300 bg-white px-3 text-base font-normal text-slate-900 focus:border-accent focus:outline-none"
            >
              <option value="">Select a program…</option>
              {programs.data.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                  {p.school ? ` — ${p.school}` : ""}
                  {p.status && p.status !== "Published" ? ` (${p.status})` : ""}
                </option>
              ))}
            </select>
          )}
        </label>

        {!programId && programs.isSuccess && (
          <EmptyState title="Choose a program" description="Its mini project and final project rubrics appear here." />
        )}

        {programId && (
          <>
            <Tabs idBase="grading" label={`Rubrics for ${selected?.title ?? "program"}`} tabs={scopes} value={scope} onChange={setScope} />
            <TabPanel idBase="grading" id={scope}>
              <RubricEditor key={`${programId}-${scope}`} programId={programId} scope={scope} />
            </TabPanel>
          </>
        )}
      </Card>

      <Card as="section" className="flex flex-col gap-3 p-6">
        <h2 className="text-lg leading-7 font-semibold text-gray-900">Grade scale</h2>
        <p className="text-sm leading-5 text-gray-600">
          How every score in the portal is shown. Pass mark: {PASS_MARK}%. The scale is set in <code>src/config/grading.ts</code>.
        </p>
        <GradeScaleTable />
      </Card>
      <Toaster />
    </div>
  );
}
