"use client";

import { useId, useState } from "react";
import { Award, ChevronDown, ExternalLink, FileText, Mail, MapPin } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Modal, ModalSection } from "@/components/ui/Modal";
import { Tag, TagList } from "@/components/ui/Tag";
import { TitleLine } from "./TalentCard";
import { shortDate, type ConfirmedMatch, type HiringRequest, type Talent } from "./data";

/** Recording a hire: the request (organization) and the details from the form. */
export type HireDetails = { requestId: string; hiredOn: string; role: string };

type Props = {
  talent: Talent | null;
  /** Hiring requests, for the Hired By and Role options. */
  requests: HiringRequest[];
  /** This talent's confirmed match, if any: shows Job Information instead of the hire form. */
  match?: ConfirmedMatch;
  saving: boolean;
  onHire: (talent: Talent, details: HireDetails) => void;
  onViewCv: (talent: Talent) => void;
  onClose: () => void;
};

const fieldClasses =
  "h-[41px] w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-slate-900 focus:border-accent focus:outline-none";

function Field({ label, children }: { label: string; children: (id: string) => React.ReactNode }) {
  const id = useId();
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-sm leading-5 font-medium text-gray-700">
        {label}
      </label>
      {children(id)}
    </div>
  );
}

function Select({ id, value, onChange, options }: { id: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return (
    <div className="relative">
      <select id={id} value={value} onChange={(e) => onChange(e.target.value)} className={`${fieldClasses} appearance-none pr-10`}>
        <option value="" disabled>
          Select an option
        </option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown aria-hidden className="pointer-events-none absolute top-1/2 right-3 size-5 -translate-y-1/2 text-slate-900" strokeWidth={2.5} />
    </div>
  );
}

/** "Has been Hired?" form for a talent not matched yet; saving records the match. */
function HireForm({ talent, requests, saving, onHire }: { talent: Talent; requests: HiringRequest[]; saving: boolean; onHire: Props["onHire"] }) {
  const [hired, setHired] = useState("");
  const [requestId, setRequestId] = useState("");
  const [hiredOn, setHiredOn] = useState("");
  const [role, setRole] = useState("");
  const roles = [...new Set(requests.map((r) => r.role))];
  const ready = hired === "yes" && requestId && hiredOn && role;

  return (
    <section aria-label="Hiring status" className="flex flex-col gap-6">
      <Field label="Has been Hired?">
        {(id) => <Select id={id} value={hired} onChange={setHired} options={[{ value: "yes", label: "Yes" }, { value: "no", label: "No" }]} />}
      </Field>
      {hired === "yes" && (
        <>
          <Field label="Hired By">
            {(id) =>
              requests.length ? (
                <Select
                  id={id}
                  value={requestId}
                  onChange={(v) => {
                    setRequestId(v);
                    // The request's role is the likely one.
                    setRole(requests.find((r) => r.id === v)?.role ?? role);
                  }}
                  options={requests.map((r) => ({ value: r.id, label: `${r.organization} — ${r.role}` }))}
                />
              ) : (
                <p id={id} className="text-sm leading-5 text-slate-500">No hiring requests yet.</p>
              )
            }
          </Field>
          <Field label="Hire Date">
            {(id) => <input id={id} type="date" value={hiredOn} onChange={(e) => setHiredOn(e.target.value)} className={fieldClasses} />}
          </Field>
          <Field label="Role">
            {(id) => <Select id={id} value={role} onChange={setRole} options={roles.map((r) => ({ value: r, label: r }))} />}
          </Field>
          <Button
            variant="accent"
            size="lg"
            disabled={!ready || saving}
            onClick={() => ready && onHire(talent, { requestId, hiredOn, role })}
          >
            {saving ? "Saving…" : "Save Hiring Details"}
          </Button>
        </>
      )}
    </section>
  );
}

/** The talent's profile, as in the Talent Corner profile design. Sections follow what they submitted. */
export function TalentProfileModal({ talent, requests, match, saving, onHire, onViewCv, onClose }: Props) {
  if (!talent) return null;
  const hiredBy = match ? requests.find((r) => r.id === match.requestId) : undefined;
  const linkClass = "inline-flex items-center gap-2 text-sm leading-5 break-all text-accent hover:underline";

  return (
    <Modal open onClose={onClose} title={talent.name} subtitle={<TitleLine talent={talent} />}>
      <ModalSection title="Contact Information">
        <ul className="flex flex-col gap-2 text-sm leading-5 text-ink">
          <li className="flex items-center gap-2">
            <Mail aria-hidden className="size-4 text-accent" strokeWidth={1.33} />
            <a href={`mailto:${talent.email}`} className="text-accent hover:underline">
              {talent.email}
            </a>
          </li>
          {talent.phone && (
            <li className="flex items-center gap-2">
              <span aria-hidden="true">📱</span>
              <span className="sr-only">Phone:</span>
              {talent.phone}
            </li>
          )}
          <li className="flex items-center gap-2">
            <MapPin aria-hidden className="size-4 text-muted" strokeWidth={1.33} />
            <span className="sr-only">Location:</span>
            {talent.location}
          </li>
        </ul>
      </ModalSection>

      {(talent.portfolioUrl || talent.cvUrl) && (
        <ModalSection title="Online Presence">
          <ul className="flex flex-col gap-2">
            {talent.portfolioUrl && (
              <li>
                <a href={talent.portfolioUrl} target="_blank" rel="noopener noreferrer" className={linkClass}>
                  <ExternalLink aria-hidden className="size-4 shrink-0" strokeWidth={1.33} />
                  {/linkedin\.com/i.test(talent.portfolioUrl) ? "LinkedIn" : "Portfolio"}: {talent.portfolioUrl}
                  <span className="sr-only">(opens in a new tab)</span>
                </a>
              </li>
            )}
            {talent.cvUrl && (
              <li>
                <button type="button" onClick={() => onViewCv(talent)} className={linkClass}>
                  <FileText aria-hidden className="size-4 shrink-0" strokeWidth={1.33} />
                  CV: {talent.cvFileName || "View CV"}
                </button>
              </li>
            )}
          </ul>
        </ModalSection>
      )}

      <ModalSection title="Experience Overview">
        <dl className="grid gap-4 sm:grid-cols-2 sm:gap-8">
          {[
            { label: "Years of Experience", value: talent.experienceLabel ?? `${talent.yearsExperience}+ years` },
            { label: "Skills Listed", value: talent.skills.length },
          ].map((s) => (
            <div key={s.label} className="rounded-lg bg-gray-50 p-4">
              <dt className="text-sm leading-5 text-muted">{s.label}</dt>
              <dd className="text-2xl leading-8 font-bold text-accent">{s.value}</dd>
            </div>
          ))}
        </dl>
      </ModalSection>

      {talent.skills.length > 0 && (
        <ModalSection title="Technical Skills">
          <TagList label="Technical skills">
            {talent.skills.map((s) => (
              <Tag key={s} variant="soft">
                {s}
              </Tag>
            ))}
          </TagList>
        </ModalSection>
      )}

      {talent.education.length > 0 && (
        <ModalSection title="Qualifications">
          <ul className="flex flex-col gap-2">
            {talent.education.map((e) => (
              <li key={e} className="flex min-h-12 items-center gap-2 rounded-lg bg-success-soft px-3 py-2 text-base leading-6 text-success">
                <Award aria-hidden className="size-[18px] shrink-0" strokeWidth={1.5} />
                {e}
              </li>
            ))}
          </ul>
        </ModalSection>
      )}

      {talent.workExperience && (
        <ModalSection title="Work Experience">
          <p className="text-sm leading-6 whitespace-pre-line text-slate-700">{talent.workExperience}</p>
        </ModalSection>
      )}

      {match ? (
        <ModalSection title="Job Information">
          <ul className="flex flex-col gap-2 text-sm leading-5 text-slate-700">
            <li className="font-bold text-accent">{hiredBy?.organization ?? "—"}</li>
            <li>{match.role ?? hiredBy?.role ?? "—"}</li>
            <li>{shortDate(match.hiredOn ?? match.confirmedAt)}</li>
          </ul>
        </ModalSection>
      ) : (
        <HireForm key={talent.id} talent={talent} requests={requests} saving={saving} onHire={onHire} />
      )}
    </Modal>
  );
}
