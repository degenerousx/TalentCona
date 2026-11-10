"use client";

import { useId, useState } from "react";
import { Award, ExternalLink, Mail, MapPin, Phone } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Modal, ModalSection } from "@/components/ui/Modal";
import { ErrorState, LoadingState } from "@/components/ui/States";
import { Tag, TagList } from "@/components/ui/Tag";
import { useMarkAvailable, useMarkHired, useTalent, useTalentRequests } from "./api";
import { ProgramLine } from "./TalentCard";
import type { Talent } from "./data";

type Props = { talentId: string; onClose: () => void };

const fieldClasses =
  "h-[41px] w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-slate-900 focus:border-accent focus:outline-none";

const errorMessage = (error: unknown) =>
  error instanceof Error && error.message ? error.message : "Something went wrong. Please try again.";

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

/**
 * "Has been Hired?" → Yes shows Hired By / Hire Date / Role, then saves with
 * PATCH /talent-pool/admin/:id/hire. Companies and roles from talent requests
 * are offered as suggestions; any value can be typed.
 */
function HireForm({ talent }: { talent: Talent }) {
  const [hired, setHired] = useState<"" | "yes" | "no">("");
  const [hiredBy, setHiredBy] = useState("");
  const [hiredAt, setHiredAt] = useState("");
  const [hiredRole, setHiredRole] = useState(talent.targetRole);
  const mark = useMarkHired();
  const requests = useTalentRequests("all", "");
  const items = requests.data?.pages.flatMap((p) => p.items) ?? [];
  const companies = [...new Set(items.map((r) => r.company))];
  const roles = [...new Set(items.flatMap((r) => r.roles.map((role) => role.title)))];
  const companyList = useId();
  const roleList = useId();
  const today = new Date().toISOString().slice(0, 10);

  const save = () => {
    if (!hiredBy.trim() || !hiredAt || !hiredRole.trim()) return toast.error("Fill in Hired By, Hire Date and Role.");
    mark.mutate(
      { id: talent.id, hiredBy: hiredBy.trim(), hiredAt, hiredRole: hiredRole.trim() },
      { onSuccess: () => toast.success(`${talent.name} marked as hired by ${hiredBy.trim()}`), onError: (e) => toast.error(errorMessage(e)) },
    );
  };

  return (
    <section aria-label="Hiring status" className="flex flex-col gap-6">
      <Field label="Has been Hired?">
        {(id) => (
          <select id={id} value={hired} onChange={(e) => setHired(e.target.value as "yes" | "no")} className={fieldClasses}>
            <option value="" disabled>
              Select an option
            </option>
            <option value="yes">Yes</option>
            <option value="no">No</option>
          </select>
        )}
      </Field>
      {hired === "yes" && (
        <>
          <Field label="Hired By">
            {(id) => (
              <>
                <input id={id} list={companyList} value={hiredBy} onChange={(e) => setHiredBy(e.target.value)} placeholder="Company name" maxLength={150} className={fieldClasses} />
                <datalist id={companyList}>
                  {companies.map((c) => (
                    <option key={c} value={c} />
                  ))}
                </datalist>
              </>
            )}
          </Field>
          <Field label="Hire Date">
            {(id) => <input id={id} type="date" max={today} value={hiredAt} onChange={(e) => setHiredAt(e.target.value)} className={fieldClasses} />}
          </Field>
          <Field label="Role">
            {(id) => (
              <>
                <input id={id} list={roleList} value={hiredRole} onChange={(e) => setHiredRole(e.target.value)} placeholder="Job title" maxLength={120} className={fieldClasses} />
                <datalist id={roleList}>
                  {roles.map((r) => (
                    <option key={r} value={r} />
                  ))}
                </datalist>
              </>
            )}
          </Field>
          <Button variant="primary" size="lg" className="w-full" onClick={save} disabled={mark.isPending}>
            {mark.isPending ? "Saving…" : "Save Hiring Details"}
          </Button>
        </>
      )}
    </section>
  );
}

export function TalentProfileModal({ talentId, onClose }: Props) {
  const query = useTalent(talentId);
  const reopen = useMarkAvailable();
  const talent = query.data;

  return (
    <Modal open onClose={onClose} title={talent?.name ?? "Talent profile"} subtitle={talent ? <ProgramLine talent={talent} /> : undefined}>
      {query.isPending && <LoadingState variant="block" label="Loading profile…" />}
      {query.isError && <ErrorState error={query.error} title="Couldn't load this profile" onRetry={() => void query.refetch()} retrying={query.isFetching} />}
      {talent && (
        <>
          <ModalSection title="Contact Information">
            <ul className="flex flex-col gap-2 text-sm leading-5 text-ink">
              {talent.email && (
                <li className="flex items-center gap-2">
                  <Mail aria-hidden className="size-4 text-accent" strokeWidth={1.33} />
                  <a href={`mailto:${talent.email}`} className="text-accent hover:underline">
                    {talent.email}
                  </a>
                </li>
              )}
              {talent.phone && (
                <li className="flex items-center gap-2">
                  <Phone aria-hidden className="size-4 text-muted" strokeWidth={1.33} />
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

          {talent.links.length > 0 && (
            <ModalSection title="Online Presence">
              <ul className="flex flex-col gap-2 text-sm leading-5">
                {talent.links.map((l) => (
                  <li key={l.label}>
                    <a href={l.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 break-all text-accent hover:underline">
                      <ExternalLink aria-hidden className="size-4 shrink-0" strokeWidth={1.33} />
                      {l.label}: {l.url}
                      <span className="sr-only">(opens in a new tab)</span>
                    </a>
                  </li>
                ))}
              </ul>
            </ModalSection>
          )}

          {(talent.seeking || talent.targetRole) && (
            <ModalSection title="Career Interest">
              <dl className="grid gap-4 sm:grid-cols-2 sm:gap-8">
                {[
                  { label: "Looking for", value: talent.seeking === "Both" ? "Job or internship" : talent.seeking === "Hire" ? "A job" : talent.seeking || "-" },
                  { label: "Target role", value: talent.targetRole || "-" },
                ].map((s) => (
                  <div key={s.label} className="rounded-lg bg-gray-50 p-4">
                    <dt className="text-sm leading-5 text-muted">{s.label}</dt>
                    <dd className="text-base leading-6 font-semibold text-ink">{s.value}</dd>
                  </div>
                ))}
              </dl>
            </ModalSection>
          )}

          {(talent.grade !== null || talent.projectsCompleted !== null) && (
            <ModalSection title="Academic Performance">
              <dl className="grid gap-4 sm:grid-cols-2 sm:gap-8">
                {[
                  talent.grade !== null ? { label: "Final Grade", value: `${talent.grade}%` } : null,
                  talent.projectsCompleted !== null ? { label: "Projects Completed", value: talent.projectsCompleted } : null,
                ]
                  .filter((s) => s !== null)
                  .map((s) => (
                    <div key={s.label} className="rounded-lg bg-gray-50 p-4">
                      <dt className="text-sm leading-5 text-muted">{s.label}</dt>
                      <dd className="text-2xl leading-8 font-bold text-accent">{s.value}</dd>
                    </div>
                  ))}
              </dl>
            </ModalSection>
          )}

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

          {talent.certifications.length > 0 && (
            <ModalSection title="Certifications">
              <ul className="flex flex-col gap-2">
                {talent.certifications.map((c) => (
                  <li key={c} className="flex min-h-12 items-center gap-2 rounded-lg bg-success-soft px-3 py-2 text-base leading-6 text-success">
                    <Award aria-hidden className="size-[18px] shrink-0" strokeWidth={1.5} />
                    {c}
                  </li>
                ))}
              </ul>
            </ModalSection>
          )}

          {talent.status === "hired" ? (
            <ModalSection title="Job Information">
              <ul className="flex flex-col gap-2 text-sm leading-5 text-slate-700">
                <li className="font-bold text-accent">{talent.job?.company || "Hired"}</li>
                {talent.job?.role && <li>{talent.job.role}</li>}
                {talent.job?.date && <li>{talent.job.date}</li>}
              </ul>
              <Button
                variant="outline"
                className="mt-2 self-start px-4"
                disabled={reopen.isPending}
                onClick={() =>
                  reopen.mutate(talent.id, {
                    onSuccess: () => toast.success(`${talent.name} is available again`),
                    onError: (e) => toast.error(errorMessage(e)),
                  })
                }
              >
                {reopen.isPending ? "Saving…" : "Mark as Available Again"}
              </Button>
            </ModalSection>
          ) : (
            <HireForm key={talent.id} talent={talent} />
          )}
        </>
      )}
    </Modal>
  );
}
