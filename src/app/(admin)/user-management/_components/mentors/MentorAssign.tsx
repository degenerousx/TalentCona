"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { AwardIcon, BriefcaseIcon, ClockIcon, LinkIcon, SearchIcon, StarIcon, TrophyIcon } from "@/components/icons";
import { ErrorState, LoadingState } from "@/components/ui/States";
import { Check, RoleDefinitions } from "./AssignParts";
import AssignProgramsModal, { type AssignableProgram, type MentorRole } from "./AssignProgramsModal";
import PageState from "../shared/PageState";
import SuccessDialog from "../shared/SuccessDialog";
import { mergePrograms, timeAgo, useMentor, usePrograms, useSetMentorPrograms } from "../api";
import { applicantInitials } from "./reviewParts";
import review from "./MentorReview.module.css";
import styles from "./MentorAssign.module.css";

const ROLES: MentorRole[] = ["Instructor", "Program Advisor"];

/** Program id → the roles chosen for it (possibly none yet). */
type Selection = Record<string, MentorRole[]>;

/**
 * Assign an approved, unassigned mentor to programs:
 * pick programs and roles → confirm → PUT /mentors/admin/:id/programs → success.
 */
export default function MentorAssign({ mentorId }: { mentorId: string }) {
  const router = useRouter();
  const query = useMentor(mentorId);
  const programsQuery = usePrograms();
  const save = useSetMentorPrograms(mentorId);
  const [search, setSearch] = useState("");
  const [selection, setSelection] = useState<Selection>({});
  const [confirming, setConfirming] = useState(false);
  const [done, setDone] = useState<string | null>(null);
  const backToPage = useCallback(() => setConfirming(false), []);
  const finish = useCallback(() => router.push(`/user-management/mentors/${mentorId}`), [router, mentorId]);

  const m = query.data;
  if (!m) return <PageState query={query} noun="mentor" backHref="/user-management#mentors" />;
  const a = m.application;
  const all: AssignableProgram[] = (programsQuery.data ?? []).map((p) => ({ id: p.id, title: p.title, track: p.school }));
  const q = search.trim().toLowerCase();
  const programs = q ? all.filter((p) => `${p.title} ${p.track}`.toLowerCase().includes(q)) : all;
  const chosen = all.filter((p) => selection[p.id]);

  const toggleProgram = (id: string) => setSelection(({ [id]: current, ...rest }) => (current ? rest : { ...rest, [id]: [] }));
  // One role per program, as in the Assign Programs modal: picking a role replaces the other one.
  const toggleRole = (id: string, role: MentorRole) => setSelection((s) => ({ ...s, [id]: s[id]?.includes(role) ? [] : [role] }));

  return (
    <div className={review.page}>
      <h1 className={review.title}>
        <Link href="/user-management#mentors" className={review.back} aria-label="Back to mentors">
          <svg width="19" height="17" viewBox="0 0 19 17" fill="none" aria-hidden="true">
            <path d="M8.5 1.6 1.6 8.5l6.9 6.9M1.6 8.5h15.8" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
        Mentor Details
      </h1>

      <section className={review.card} aria-label={`Assign ${m.name}`}>
        <header className={review.head}>
          <div className={review.who}>
            <span className={review.avatar} aria-hidden="true">
              {applicantInitials(m.name)}
            </span>
            <div className={review.identity}>
              <h2 className={review.name}>{m.name}</h2>
              <a href={`mailto:${m.email}`} className={review.email}>
                {m.email}
              </a>
              {a.reviewedAt && (
                <span className={review.submitted}>
                  <ClockIcon size={12} color="#455A64" strokeWidth={2} />
                  Approved {timeAgo(a.reviewedAt)}
                </span>
              )}
            </div>
          </div>
        </header>

        {a.link && (
          <div className={review.links}>
            <a href={a.link} target="_blank" rel="noreferrer" className={review.link}>
              <LinkIcon size={14} color="#722FFF" strokeWidth={1.67} />
              LinkedIn / Portfolio
            </a>
          </div>
        )}

        <dl className={styles.stats}>
          <div className={styles.stat}>
            <dt>Experience</dt>
            <dd className={styles.statWide}>
              <AwardIcon size={16} color="#722FFF" strokeWidth={1.33} />
              <span>{a.experience != null ? `${a.experience} ${a.experience === 1 ? "year" : "years"}` : "—"}</span>
            </dd>
          </div>
          <div className={styles.stat}>
            <dt>System Rating</dt>
            <dd>
              <StarIcon />
              <span className={styles.score}>{a.systemRating ?? "—"}</span>
            </dd>
          </div>
          <div className={styles.stat}>
            <dt>Admin Rating</dt>
            <dd>
              <TrophyIcon />
              <span className={styles.score}>{a.adminRating ?? "—"}</span>
            </dd>
          </div>
        </dl>

        <dl className={review.details}>
          <div className={review.detail}>
            <dt>Expertise</dt>
            <dd>
              <BriefcaseIcon size={16} color="#722FFF" strokeWidth={1.33} />
              <ul className={review.chips}>
                {a.expertise.length === 0 && <li className={review.chip}>Not provided</li>}
                {a.expertise.map((e) => (
                  <li key={e.label} className={review.chip}>
                    {e.label}
                    {e.years ? ` -${e.years} ${e.years === 1 ? "Year" : "Years"}` : ""}
                  </li>
                ))}
              </ul>
            </dd>
          </div>
        </dl>

        <div className={styles.assign}>
          <RoleDefinitions />

          <label className={styles.search}>
            <span className={styles.searchIcon}>
              <SearchIcon size={20} />
            </span>
            <input type="search" placeholder="Search Programs..." value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Search programs" />
          </label>

          <ul className={styles.programs} aria-label="Programs">
            {programs.map((p) => {
              const roles = selection[p.id];
              return (
                <li key={p.id} className={`${styles.program} ${roles ? styles.programOn : ""}`}>
                  <label className={styles.programHead}>
                    <Check checked={Boolean(roles)} onChange={() => toggleProgram(p.id)} label={`Assign to ${p.title}`} />
                    <span className={styles.programText}>
                      <span className={styles.programTitle}>{p.title}</span>
                      <span className={styles.programTrack}>{p.track}</span>
                    </span>
                  </label>
                  {roles && (
                    <div className={styles.roleChoices} role="group" aria-label={`Role in ${p.title}`}>
                      {ROLES.map((r) => (
                        <label key={r} className={styles.roleChoice}>
                          <Check checked={roles.includes(r)} onChange={() => toggleRole(p.id, r)} label={r} />
                          <span>{r}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </li>
              );
            })}
            {programsQuery.isPending && (
              <li>
                <LoadingState variant="inline" label="Loading programs…" />
              </li>
            )}
            {programsQuery.isError && (
              <li>
                <ErrorState error={programsQuery.error} title="Couldn't load programs" onRetry={() => void programsQuery.refetch()} retrying={programsQuery.isFetching} />
              </li>
            )}
            {programsQuery.isSuccess && programs.length === 0 && (
              <li className={styles.noMatch}>{q ? <>No programs match “{search}”.</> : "No programs exist yet."}</li>
            )}
          </ul>

          <div className={styles.summary} aria-live="polite">
            <h3 className={styles.summaryTitle}>Selected Assignments:</h3>
            <ul className={styles.summaryList}>
              {chosen.map((p) => (
                <li key={p.id}>
                  • {p.title} -{" "}
                  {selection[p.id].length ? <b>{selection[p.id].join(" & ")}</b> : <span className={styles.summaryMissing}>choose a role</span>}
                </li>
              ))}
              {chosen.length === 0 && <li className={styles.summaryEmpty}>No programs selected yet.</li>}
            </ul>
          </div>
        </div>

        <footer className={review.footer}>
          <div className={`${review.actions} ${styles.actions}`}>
            <Link href="/user-management#mentors" className={styles.later}>
              I will do this later
            </Link>
            <button
              type="button"
              className={styles.assignButton}
              disabled={chosen.length === 0}
              title={chosen.length ? undefined : "Choose a program first"}
              onClick={() => setConfirming(true)}
            >
              Assign
            </button>
          </div>
        </footer>
      </section>

      {confirming && (
        <AssignProgramsModal
          mentorName={m.name}
          programs={chosen}
          initial={Object.fromEntries(chosen.map((p) => [p.id, selection[p.id][0] ?? null]))}
          onCancel={backToPage}
          onConfirm={async (confirmed) => {
            const changes = Object.entries(confirmed).map(([programId, role]) => ({
              programId,
              mentor: role === "Instructor",
              advisor: role === "Program Advisor",
            }));
            await save.mutateAsync(mergePrograms(m.programs, changes));
            setSelection(Object.fromEntries(Object.entries(confirmed).map(([id, role]) => [id, [role]])));
            setConfirming(false);
            setDone(`${m.name} Assigned Successfully !`);
          }}
        />
      )}
      {done && <SuccessDialog title={done} onClose={finish} />}
    </div>
  );
}
