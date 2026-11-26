"use client";

import { useMemo, useState } from "react";
import { ArrowRightLeft, Building2, Eye, Pencil, Plus, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/cn";
import { useCurrentAdmin } from "@/lib/currentAdmin";
import { COHORTS, PROGRAMS, type Sponsor, type SponsoredTalent, type SponsorshipType, type TalentStatus } from "./data";
import { Badge, Bar, Btn, Empty, Field, InfoTile, Input, Panel, Select, Toolbar, card } from "./ui";
import { nowIso, when } from "./AdminUpdates";

/**
 * Sponsored Talent: students assigned to a sponsor. Admins add students, pick
 * their sponsor from the Sponsors list, edit them and reassign them to another
 * sponsor. No money is shown here (that lives under Sponsors and Payments).
 * Mock only: local state, no API calls.
 */

const STATUS = ["All", "Active", "Completed", "Pending"] as const;
const TYPE = ["All", "Full", "Partial"] as const;
const th = "bg-[#f9fafb]/60 px-4 py-3 text-left text-xs leading-4 font-semibold tracking-[0.6px] text-[#6a7282] uppercase";
const td = "px-4 py-3";

type Props = {
  talents: SponsoredTalent[];
  setTalents: React.Dispatch<React.SetStateAction<SponsoredTalent[]>>;
  sponsors: Sponsor[];
};

export function SponsoredTalentTab({ talents, setTalents, sponsors }: Props) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<(typeof STATUS)[number]>("All");
  const [type, setType] = useState<(typeof TYPE)[number]>("All");
  const [openId, setOpenId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const admin = useCurrentAdmin();
  const me = admin.name ?? admin.email ?? "You";
  const sponsorName = (id: string) => sponsors.find((s) => s.id === id)?.name ?? "Unknown sponsor";
  const open = talents.find((t) => t.id === openId) ?? null;

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    const name = (id: string) => sponsors.find((s) => s.id === id)?.name ?? "";
    return talents.filter(
      (t) =>
        (status === "All" || t.status === status) &&
        (type === "All" || t.type === type) &&
        (!q || [t.id, t.name, t.email, t.program, name(t.sponsorId)].some((v) => v.toLowerCase().includes(q))),
    );
  }, [talents, sponsors, search, status, type]);

  const takenEmails = (exceptId?: string) => talents.filter((t) => t.id !== exceptId).map((t) => t.email.toLowerCase());
  const update = (id: string, patch: (t: SponsoredTalent) => SponsoredTalent) => setTalents((ts) => ts.map((t) => (t.id === id ? patch(t) : t)));
  const withSponsor = (t: SponsoredTalent, sponsorId: string) =>
    sponsorId === t.sponsorId ? t : { ...t, sponsorId, sponsorHistory: [...t.sponsorHistory, { from: t.sponsorId, to: sponsorId, at: nowIso(), by: me }] };

  return (
    <div className="flex flex-col gap-4">
      <Toolbar
        search={search}
        onSearch={setSearch}
        groups={[
          { label: "Filter by status", options: STATUS, value: status, onChange: setStatus },
          { label: "Filter by sponsorship type", options: TYPE, value: type, onChange: setType },
        ]}
      />
      <Btn className="flex items-center gap-2 self-end px-4 py-2.5" onClick={() => setAdding(true)}>
        <Plus className="size-4" /> Add Students
      </Btn>
      {rows.length === 0 ? (
        <Empty />
      ) : (
        <div className={cn(card, "overflow-x-auto")}>
          <table className="w-full min-w-[900px] text-sm">
            <thead className="border-b border-[#f3f4f6]">
              <tr>
                {["ID", "Student", "Program", "Sponsor", "Type", "Cohort", "Status"].map((h) => (
                  <th key={h} className={th}>
                    {h}
                  </th>
                ))}
                <th className={th}>
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((t) => (
                <tr key={t.id} className="border-b border-[#f9fafb] last:border-0">
                  <td className={cn(td, "font-mono text-xs text-[#6a7282]")}>{t.id}</td>
                  <td className={td}>
                    <p className="font-medium tracking-[-0.15px] text-[#101828]">{t.name}</p>
                    <p className="text-xs leading-4 text-[#99a1af]">{t.email}</p>
                  </td>
                  <td className={cn(td, "text-[#364153]")}>{t.program}</td>
                  <td className={cn(td, "text-[#4a5565]")}>{sponsorName(t.sponsorId)}</td>
                  <td className={td}>
                    <Badge>{t.type}</Badge>
                  </td>
                  <td className={cn(td, "text-[#4a5565]")}>{t.cohort}</td>
                  <td className={td}>
                    <Badge>{t.status}</Badge>
                  </td>
                  <td className={td}>
                    <button type="button" aria-label={`View ${t.name}`} onClick={() => setOpenId(t.id)} className="rounded-[8px] p-1.5 text-[#6a7282] hover:bg-slate-100">
                      <Eye className="size-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {adding && (
        <Panel
          open
          onClose={() => setAdding(false)}
          lead={
            <span className="flex size-10 items-center justify-center rounded-[12px] bg-[#722fff] text-white">
              <UserPlus className="size-[18px]" />
            </span>
          }
          eyebrow="Sponsored Talent"
          title="Add Students"
        >
          <AddStudents
            sponsors={sponsors}
            takenEmails={takenEmails()}
            nextNumber={Math.max(0, ...talents.map((t) => Number(t.id.slice(4)) || 0)) + 1}
            me={me}
            onCancel={() => setAdding(false)}
            onSave={(added) => {
              setTalents((ts) => [...added, ...ts]);
              setAdding(false);
              toast.success(`${added.length} ${added.length === 1 ? "student" : "students"} added (design preview: nothing is stored)`);
            }}
          />
        </Panel>
      )}

      {open && (
        <TalentPanel
          t={open}
          sponsors={sponsors}
          sponsorName={sponsorName}
          takenEmails={takenEmails(open.id)}
          onClose={() => setOpenId(null)}
          onSave={(d) => {
            update(open.id, (t) => withSponsor({ ...t, ...d, sponsorId: t.sponsorId }, d.sponsorId));
            toast.success("Saved (design preview: nothing is stored)");
          }}
          onReassign={(sponsorId) => {
            update(open.id, (t) => withSponsor(t, sponsorId));
            toast.success(`${open.name} reassigned to ${sponsorName(sponsorId)}`);
          }}
        />
      )}
    </div>
  );
}

// ---- Student form ---------------------------------------------------------------

type StudentDraft = Pick<SponsoredTalent, "name" | "email" | "phone" | "program" | "sponsorId" | "type" | "status" | "cohort" | "startDate">;

const blank = (sponsorId: string): StudentDraft => ({
  name: "", email: "", phone: "", program: PROGRAMS[2], sponsorId, type: "Full", status: "Pending", cohort: COHORTS[3], startDate: "",
});

function check(d: StudentDraft, taken: string[]) {
  if (!d.name.trim()) return "Full name is required.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email.trim())) return "Enter a valid email address.";
  if (taken.includes(d.email.trim().toLowerCase())) return `${d.email.trim()} is already a sponsored student.`;
  if (!d.sponsorId) return "Choose a sponsor.";
  if (!d.startDate) return "Start date is required.";
  return null;
}

function StudentFields({ d, set, sponsors }: { d: StudentDraft; set: (p: Partial<StudentDraft>) => void; sponsors: Sponsor[] }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <Field label="Full Name *">
        <Input value={d.name} onChange={(e) => set({ name: e.target.value })} placeholder="e.g. Ada Okafor" />
      </Field>
      <Field label="Email *">
        <Input type="email" value={d.email} onChange={(e) => set({ email: e.target.value })} placeholder="student@example.com" />
      </Field>
      <Field label="Phone">
        <Input type="tel" value={d.phone} onChange={(e) => set({ phone: e.target.value })} placeholder="+234 800 000 0000" />
      </Field>
      <Field label="Sponsor *">
        <SponsorSelect sponsors={sponsors} value={d.sponsorId} onChange={(sponsorId) => set({ sponsorId })} />
      </Field>
      <Field label="Program *">
        <Select value={d.program} onChange={(e) => set({ program: e.target.value })} options={[...PROGRAMS]} />
      </Field>
      <Field label="Cohort *">
        <Select value={d.cohort} onChange={(e) => set({ cohort: e.target.value })} options={[...COHORTS]} />
      </Field>
      <Field label="Sponsorship Type *">
        <Select value={d.type} onChange={(e) => set({ type: e.target.value as SponsorshipType })} options={["Full", "Partial"]} />
      </Field>
      <Field label="Status *">
        <Select value={d.status} onChange={(e) => set({ status: e.target.value as TalentStatus })} options={["Pending", "Active", "Completed"]} />
      </Field>
      <Field label="Start Date *">
        <Input type="date" value={d.startDate} onChange={(e) => set({ startDate: e.target.value })} />
      </Field>
    </div>
  );
}

/** Sponsor picker: every sponsor on the Sponsors tab, by name. */
function SponsorSelect({ sponsors, value, onChange, id }: { sponsors: Sponsor[]; value: string; onChange: (id: string) => void; id?: string }) {
  return (
    <span className="relative">
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full appearance-none rounded-[8px] border border-[#d1d5dc] bg-white px-3 py-2.5 pr-9 text-sm text-[#3a3a3a] outline-none focus:border-primary"
      >
        <option value="" disabled>
          Select a sponsor…
        </option>
        {sponsors.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name} ({s.orgType})
          </option>
        ))}
      </select>
      <Building2 className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-[#6a7282]" />
    </span>
  );
}

/** Add one or more students in one go; each row is a student. */
function AddStudents({
  sponsors,
  takenEmails,
  nextNumber,
  me,
  onCancel,
  onSave,
}: {
  sponsors: Sponsor[];
  takenEmails: string[];
  nextNumber: number;
  me: string;
  onCancel: () => void;
  onSave: (added: SponsoredTalent[]) => void;
}) {
  const [rows, setRows] = useState<StudentDraft[]>([blank("")]);
  const [error, setError] = useState<string | null>(null);
  const setRow = (i: number, p: Partial<StudentDraft>) => setRows((rs) => rs.map((r, j) => (j === i ? { ...r, ...p } : r)));

  return (
    <form
      noValidate
      className="flex flex-col gap-5"
      onSubmit={(e) => {
        e.preventDefault();
        const emails = [...takenEmails];
        for (const [i, r] of rows.entries()) {
          const err = check(r, emails);
          if (err) return setError(rows.length > 1 ? `Student ${i + 1}: ${err}` : err);
          emails.push(r.email.trim().toLowerCase());
        }
        setError(null);
        onSave(
          rows.map((r, i) => ({
            ...r,
            name: r.name.trim(),
            email: r.email.trim(),
            phone: r.phone.trim(),
            id: `TLT-${String(nextNumber + i).padStart(3, "0")}`,
            progress: 0,
            certifications: "0 earned",
            internship: "Not Started",
            sponsorHistory: [{ from: null, to: r.sponsorId, at: nowIso(), by: me }],
          })),
        );
      }}
    >
      <p className="text-xs text-[#6a7282]">Fields marked * are required. Choose the sponsor each student is assigned to.</p>
      {rows.map((r, i) => (
        <fieldset key={i} className="rounded-[12px] border border-[#e5e7eb] p-4">
          <legend className="flex items-center gap-3 px-1 text-sm font-semibold text-[#101828]">
            Student {i + 1}
            {rows.length > 1 && (
              <button type="button" onClick={() => setRows((rs) => rs.filter((_, j) => j !== i))} className="text-xs font-medium text-[#c10007] hover:underline">
                Remove
              </button>
            )}
          </legend>
          <StudentFields d={r} set={(p) => setRow(i, p)} sponsors={sponsors} />
        </fieldset>
      ))}
      <button
        type="button"
        onClick={() => setRows((rs) => [...rs, blank(rs[rs.length - 1]?.sponsorId ?? "")])}
        className="flex items-center justify-center gap-2 rounded-[12px] border border-dashed border-[#d1d5dc] py-3 text-sm font-medium text-primary hover:bg-[#faf5ff]"
      >
        <Plus className="size-4" /> Add another student
      </button>
      {error && (
        <p role="alert" className="text-sm text-[#c10007]">
          {error}
        </p>
      )}
      <div className="flex justify-end gap-3 border-t border-[#e5e7eb] pt-5">
        <Btn variant="outline" onClick={onCancel}>
          Cancel
        </Btn>
        <Btn type="submit">{rows.length === 1 ? "Add Student" : `Add ${rows.length} Students`}</Btn>
      </div>
    </form>
  );
}

// ---- Student panel --------------------------------------------------------------

function TalentPanel({
  t,
  sponsors,
  sponsorName,
  takenEmails,
  onClose,
  onSave,
  onReassign,
}: {
  t: SponsoredTalent;
  sponsors: Sponsor[];
  sponsorName: (id: string) => string;
  takenEmails: string[];
  onClose: () => void;
  onSave: (d: StudentDraft) => void;
  onReassign: (sponsorId: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<StudentDraft>(t);
  const [error, setError] = useState<string | null>(null);
  const [reassignTo, setReassignTo] = useState(t.sponsorId);

  return (
    <Panel open onClose={onClose} eyebrow={`${t.id} · ${t.cohort}`} title={t.name} badge={<Badge>{t.status}</Badge>}>
      {editing ? (
        <form
          noValidate
          className="flex flex-col gap-5"
          onSubmit={(e) => {
            e.preventDefault();
            const err = check(draft, takenEmails);
            setError(err);
            if (err) return;
            onSave({ ...draft, name: draft.name.trim(), email: draft.email.trim(), phone: draft.phone.trim() });
            setEditing(false);
          }}
        >
          <h3 className="text-base font-bold text-[#101828]">Edit Information</h3>
          <StudentFields d={draft} set={(p) => setDraft((x) => ({ ...x, ...p }))} sponsors={sponsors} />
          {error && (
            <p role="alert" className="text-sm text-[#c10007]">
              {error}
            </p>
          )}
          <div className="flex justify-end gap-3 border-t border-[#e5e7eb] pt-5">
            <Btn
              variant="outline"
              onClick={() => {
                setDraft(t);
                setError(null);
                setEditing(false);
              }}
            >
              Cancel
            </Btn>
            <Btn type="submit">Save</Btn>
          </div>
        </form>
      ) : (
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-sm font-semibold text-[#101828]">Student Details</h3>
            <button
              type="button"
              onClick={() => {
                setDraft(t);
                setEditing(true);
              }}
              className="flex items-center gap-1.5 rounded-[8px] border border-[#e5e7eb] px-3 py-1.5 text-xs font-medium text-[#4a5565] hover:border-primary hover:text-primary"
            >
              <Pencil className="size-3.5" /> Edit Information
            </button>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <InfoTile label="Email">{t.email}</InfoTile>
            <InfoTile label="Phone">{t.phone || "Not provided"}</InfoTile>
            <InfoTile label="Program">{t.program}</InfoTile>
            <InfoTile label="Cohort">{t.cohort}</InfoTile>
            <InfoTile label="Sponsorship Type">{t.type}</InfoTile>
            <InfoTile label="Start Date">{t.startDate}</InfoTile>
            <InfoTile label="Certifications">{t.certifications}</InfoTile>
            <InfoTile label="Internship">{t.internship}</InfoTile>
          </div>
          <Bar label="Learning Progress" value={t.progress} color="#0091ea" />

          <section aria-labelledby="sponsor-heading" className="rounded-[12px] border border-[#e5e7eb] p-4">
            <h3 id="sponsor-heading" className="text-sm font-semibold text-[#101828]">
              Sponsor
            </h3>
            <p className="mt-1 flex items-center gap-2 text-base font-bold text-[#101828]">
              <Building2 className="size-4 text-[#722fff]" /> {sponsorName(t.sponsorId)}
            </p>
            <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-end">
              <label className="flex flex-1 flex-col gap-1.5">
                <span className="text-sm leading-5 font-medium text-[#364153]">Reassign to</span>
                <SponsorSelect sponsors={sponsors} value={reassignTo} onChange={setReassignTo} />
              </label>
              <Btn className="flex items-center justify-center gap-2 px-4 py-2.5" disabled={reassignTo === t.sponsorId} onClick={() => onReassign(reassignTo)}>
                <ArrowRightLeft className="size-4" /> Reassign
              </Btn>
            </div>
            <h4 className="mt-5 text-xs font-semibold tracking-wide text-[#6a7282] uppercase">Sponsor History</h4>
            <ol className="mt-2 flex flex-col gap-2">
              {[...t.sponsorHistory].reverse().map((h, i) => (
                <li key={i} className="flex flex-wrap items-baseline justify-between gap-x-3 text-sm">
                  <span className="text-[#364153]">
                    {h.from ? (
                      <>
                        Moved from <strong className="font-medium">{sponsorName(h.from)}</strong> to <strong className="font-medium">{sponsorName(h.to)}</strong>
                      </>
                    ) : (
                      <>
                        Assigned to <strong className="font-medium">{sponsorName(h.to)}</strong>
                      </>
                    )}
                  </span>
                  <span className="text-xs text-[#99a1af]">
                    {when(h.at)} · {h.by}
                  </span>
                </li>
              ))}
            </ol>
          </section>
        </div>
      )}
    </Panel>
  );
}
