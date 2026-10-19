"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { BookOpen, CheckCircle, ChevronDown, Circle, Edit, MoreVertical, Plus, Settings, Trash2, Users } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button, ButtonLink } from "@/components/ui/Button";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { Pill } from "@/components/ui/Pill";
import { Tabs, TabPanel, type TabItem } from "@/components/ui/Tabs";
import { cn } from "@/lib/cn";
import { programs as initialPrograms, schools as initialSchools, type Program, type School } from "./data";
import { ConfirmDeleteModal, SchoolModal } from "./ProgramModals";

type TabId = "schools" | "programs";

/** Figma "Dropdown": gray-300 border, 10px radius, chevron on the right. */
function FilterSelect({
  label,
  value,
  onChange,
  options,
  className,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  className?: string;
}) {
  return (
    <div className={cn("relative", className)}>
      <select
        aria-label={label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-[41px] w-full appearance-none rounded-[10px] border border-gray-300 bg-white pr-10 pl-3 text-base leading-5 text-slate-500"
      >
        {options.map((o) => (
          <option key={o}>{o}</option>
        ))}
      </select>
      <ChevronDown
        aria-hidden
        className="pointer-events-none absolute top-1/2 right-3 size-5 -translate-y-1/2 text-slate-900"
      />
    </div>
  );
}

function SectionHeading({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex flex-col gap-1">
      <h2 className="text-lg leading-7 font-semibold text-heading">{title}</h2>
      <p className="text-sm leading-5 text-slate-900">{description}</p>
    </div>
  );
}

/** "⋮" menu on each school card. */
function SchoolMenu({
  school,
  onEdit,
  onToggleStatus,
  onDelete,
}: {
  school: School;
  onEdit: () => void;
  onToggleStatus: () => void;
  onDelete: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === "Escape" : !ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", close);
    };
  }, [open]);

  const item = "flex w-full items-center gap-2 px-3 py-2 text-left text-sm leading-5 hover:bg-gray-50";
  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-label={`Actions for ${school.name}`}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="grid size-8 place-items-center rounded-lg text-slate-900 hover:bg-gray-100"
      >
        <MoreVertical aria-hidden className="size-5" />
      </button>
      {open && (
        <div role="menu" className="absolute top-9 right-0 z-10 w-44 overflow-hidden rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
          <button role="menuitem" type="button" className={cn(item, "text-gray-700")} onClick={() => (setOpen(false), onEdit())}>
            <Edit aria-hidden className="size-4" /> Edit School
          </button>
          <button
            role="menuitem"
            type="button"
            className={cn(item, "text-gray-700")}
            onClick={() => (setOpen(false), onToggleStatus())}
          >
            {school.status === "Active" ? (
              <>
                <Circle aria-hidden className="size-4" /> Deactivate School
              </>
            ) : (
              <>
                <CheckCircle aria-hidden className="size-4" /> Activate School
              </>
            )}
          </button>
          <button role="menuitem" type="button" className={cn(item, "text-danger")} onClick={() => (setOpen(false), onDelete())}>
            <Trash2 aria-hidden className="size-4" /> Delete School
          </button>
        </div>
      )}
    </div>
  );
}

// The card has no overflow-hidden: it would clip the ⋮ menu. The accent bar
// rounds its own left corners instead.
function SchoolCard({
  school,
  onEdit,
  onToggleStatus,
  onDelete,
}: {
  school: School;
  onEdit: () => void;
  onToggleStatus: () => void;
  onDelete: () => void;
}) {
  const active = school.status === "Active";
  return (
    <li className="relative flex items-start gap-4 rounded-xl border border-gray-200 bg-white p-5 pl-6">
      <span aria-hidden className="absolute inset-y-0 left-0 w-1 rounded-l-xl bg-primary" />
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <p className="flex flex-wrap items-center gap-2">
          <span className="text-base leading-6 font-bold text-gray-900">{school.name}</span>
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs leading-4 font-medium",
              active ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500",
            )}
          >
            {active ? <CheckCircle aria-hidden className="size-3" /> : <Circle aria-hidden className="size-3" />}
            {school.status}
          </span>
        </p>
        <p className="text-sm leading-5 text-slate-700">{school.description}</p>
        <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs leading-4 text-slate-700">
          <span className="flex items-center gap-1">
            <BookOpen aria-hidden className="size-3.5" />
            <strong className="font-semibold text-gray-700">{school.programs}</strong> programs
          </span>
          <span className="flex items-center gap-1">
            <Users aria-hidden className="size-3.5" />
            <strong className="font-semibold text-gray-700">{school.students}</strong> students
          </span>
          <span className="text-slate-500">Created {school.created}</span>
        </p>
      </div>
      <SchoolMenu school={school} onEdit={onEdit} onToggleStatus={onToggleStatus} onDelete={onDelete} />
    </li>
  );
}

export function ProgramsView() {
  const [tab, setTab] = useState<TabId>("schools");
  // Local copies so create/edit/delete work before there is an API.
  const [schools, setSchools] = useState(initialSchools);
  const [programs, setPrograms] = useState(initialPrograms);
  const [schoolType, setSchoolType] = useState("For Individuals");
  const [schoolStatus, setSchoolStatus] = useState("All");
  const [schoolFilter, setSchoolFilter] = useState("All Schools");
  const [editingSchool, setEditingSchool] = useState<School | "new" | null>(null);
  const [deleting, setDeleting] = useState<{ kind: "school"; item: School } | { kind: "program"; item: Program } | null>(
    null,
  );

  const toggleSchoolStatus = (school: School) =>
    setSchools((list) =>
      list.map((s) => (s.id === school.id ? { ...s, status: s.status === "Active" ? "Inactive" : "Active" } : s)),
    );

  const visibleSchools = schools.filter(
    (s) => s.type === schoolType && (schoolStatus === "All" || s.status === schoolStatus),
  );
  const visiblePrograms = useMemo(
    () => (schoolFilter === "All Schools" ? programs : programs.filter((p) => p.school === schoolFilter)),
    [programs, schoolFilter],
  );

  const tabs: TabItem<TabId>[] = [
    { id: "schools", label: "Schools", count: schools.length },
    { id: "programs", label: "Programs", count: programs.length },
  ];

  const columns: Column<Program>[] = [
    {
      key: "program",
      header: "Program",
      rowHeader: true,
      className: "min-w-[260px]",
      render: (p) => (
        <div className="flex flex-col gap-1">
          <Link href={`/manage-programs/${p.id}`} className="font-normal text-primary hover:underline">
            {p.name}
          </Link>
          <span className="max-w-[240px] text-sm leading-5 font-normal text-slate-900">{p.description}</span>
        </div>
      ),
    },
    { key: "duration", header: "Duration", className: "text-slate-500", render: (p) => p.duration },
    { key: "modules", header: "Modules", render: (p) => String(p.modules) },
    { key: "students", header: "Students", render: (p) => String(p.students) },
    {
      key: "status",
      header: "Status",
      render: (p) => <Pill tone={p.status === "Active" ? "green" : "yellow"}>{p.status}</Pill>,
    },
    {
      key: "actions",
      header: "Actions",
      render: (p) => (
        <div className="flex items-center gap-2">
          <Link
            href={`/manage-programs/${p.id}`}
            aria-label={`Configure ${p.name}`}
            title="Configure"
            className="grid size-8 place-items-center rounded-lg text-primary hover:bg-primary-soft"
          >
            <Settings aria-hidden className="size-[18px]" />
          </Link>
          <Link
            href={`/manage-programs/${p.id}/edit`}
            aria-label={`Edit ${p.name}`}
            title="Edit"
            className="grid size-8 place-items-center rounded-lg text-blue-600 hover:bg-blue-50"
          >
            <Edit aria-hidden className="size-[18px]" />
          </Link>
          <button
            type="button"
            aria-label={`Delete ${p.name}`}
            title="Delete"
            onClick={() => setDeleting({ kind: "program", item: p })}
            className="grid size-8 place-items-center rounded-lg text-red-600 hover:bg-red-50"
          >
            <Trash2 aria-hidden className="size-[18px]" />
          </button>
        </div>
      ),
    },
  ];

  return (
    // overflow-x-clip, not overflow-hidden: the programs table still cannot
    // widen the card, but the ⋮ menu on the last school card can hang below it.
    <Card className="overflow-x-clip" flat>
      <Tabs idBase="manage-programs" label="Manage programs" tabs={tabs} value={tab} onChange={setTab} weight="regular" />

      {tab === "schools" ? (
        <TabPanel idBase="manage-programs" id="schools">
          <div className="flex flex-wrap items-center justify-between gap-5 border-b border-gray-200 px-6 py-5">
            <SectionHeading title="All Schools" description="Schools group programs by academic discipline." />
            <div className="flex flex-wrap items-center gap-3">
              <FilterSelect
                label="Filter schools by type"
                value={schoolType}
                onChange={setSchoolType}
                options={["For Individuals", "For Business(es)"]}
                className="w-[190px]"
              />
              <FilterSelect
                label="Filter schools by status"
                value={schoolStatus}
                onChange={setSchoolStatus}
                options={["All", "Active", "Inactive"]}
                className="w-[106px]"
              />
              <Button
                size="md"
                icon={<Plus aria-hidden className="size-5" />}
                className="font-semibold"
                onClick={() => setEditingSchool("new")}
              >
                Create School
              </Button>
            </div>
          </div>
          {visibleSchools.length ? (
            <ul className="flex flex-col gap-3 p-5">
              {visibleSchools.map((s) => (
                <SchoolCard
                  key={s.id}
                  school={s}
                  onEdit={() => setEditingSchool(s)}
                  onToggleStatus={() => toggleSchoolStatus(s)}
                  onDelete={() => setDeleting({ kind: "school", item: s })}
                />
              ))}
            </ul>
          ) : (
            <p className="p-10 text-center text-sm leading-5 text-slate-500">No schools match these filters.</p>
          )}
        </TabPanel>
      ) : (
        <TabPanel idBase="manage-programs" id="programs">
          <div className="flex flex-wrap items-center justify-between gap-5 px-6 py-5">
            <SectionHeading
              title="All Programs"
              description="Create and manage educational programs with modules, assessments, and grading"
            />
            <div className="flex flex-wrap items-center gap-3">
              <FilterSelect
                label="Filter programs by school"
                value={schoolFilter}
                onChange={setSchoolFilter}
                options={["All Schools", ...schools.map((s) => s.name)]}
                className="min-w-[180px]"
              />
              <ButtonLink
                href="/manage-programs/new"
                size="md"
                icon={<Plus aria-hidden className="size-5" />}
                className="font-semibold"
              >
                Create Program
              </ButtonLink>
            </div>
          </div>
          {visiblePrograms.length ? (
            <div className="[&>div]:rounded-none [&>div]:border-x-0 [&>div]:border-b-0">
              <DataTable caption="All programs" columns={columns} rows={visiblePrograms} rowKey={(p) => p.id} />
            </div>
          ) : (
            <p className="p-10 text-center text-sm leading-5 text-slate-500">No programs in this school yet.</p>
          )}
        </TabPanel>
      )}

      {editingSchool && (
        <SchoolModal
          initial={editingSchool === "new" ? undefined : editingSchool}
          onClose={() => setEditingSchool(null)}
          onSave={(s) => {
            setSchools((list) => (list.some((x) => x.id === s.id) ? list.map((x) => (x.id === s.id ? s : x)) : [...list, s]));
            setSchoolType(s.type);
            setEditingSchool(null);
          }}
        />
      )}
      {deleting && (
        <ConfirmDeleteModal
          name={deleting.item.name}
          onClose={() => setDeleting(null)}
          onConfirm={() => {
            if (deleting.kind === "school") setSchools((l) => l.filter((x) => x.id !== deleting.item.id));
            else setPrograms((l) => l.filter((x) => x.id !== deleting.item.id));
            setDeleting(null);
          }}
        />
      )}
    </Card>
  );
}
