"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { AwardIcon, BriefcaseIcon, ClockIcon, LinkIcon, SearchIcon, StarIcon, TrophyIcon } from "@/components/icons";
import { ErrorState, LoadingState } from "@/components/ui/States";
import { Check, RoleDefinitions } from "./AssignParts";
import AssignProgramsModal, { type AssignableProgram, type MentorRole } from "./AssignProgramsModal";
import PageState from "../shared/PageState";
import SuccessDialog from "../shared/SuccessDialog";
import { errorText, mergePrograms, timeAgo, useMentor, usePrograms, useReviewMentor, useSetMentorPrograms } from "../api";
import { applicantInitials, isAwaitingReview, linkLabel } from "./reviewParts";
import reviewStyles from "./MentorReview.module.css";
import styles from "./MentorAssign.module.css";

const ROLES: MentorRole[] = ["Instructor", "Program Advisor"];

/** Program id → the roles chosen for it (possibly none yet). */
type Selection = Record<string, MentorRole[]>;

/** The mentor's current program links as a selection, so the page opens on what they already have. */
const selectionOf = (links: { programId: string; mentor: boolean; advisor: boolean }[]): Selection =>
  Object.fromEntries(
    links.map((l) => [l.programId, [...(l.mentor ? ["Instructor" as const] : []), ...(l.advisor ? ["Program Advisor" as const] : [])]]),
  );



/**
 * Assign an approved mentor to programs (also where Approve on the review
 * page lands): pick programs and one or both roles → confirm →
 * PUT /mentors/admin/:id/programs → success. The page starts from the
 * mentor's current programs, and the PUT sends the full resulting list
 * (the endpoint replaces it), so unticking a program removes it.
 */
export default function MentorAssign({ mentorId }: { mentorId: string }) {
  const router = useRouter();
  const query = useMentor(mentorId);
  const programsQuery = usePrograms();
  const save = useSetMentorPrograms(mentorId);
  const review = useReviewMentor(mentorId);
  // Set once this page has approved the application, so a retry after a failed
  // program save doesn't approve twice (the refetched status is "Approved" by then).
  const [approvedHere, setApprovedHere] = useState(false);
  const [search, setSearch] = useState("");
  // null until the admin changes something: until then the mentor's current programs are shown.
  const [edited, setEdited] = useState<Selection | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [done, setDone] = useState<string | null>(null);
  const backToPage = useCallback(() => setConfirming(false), []);
  const finish = useCallback(() => router.push(`/user-management/mentors/${mentorId}`), [router, mentorId]);
  // Like the review page: the success message shows briefly, then opens the mentor's profile.
  useEffect(() => {
    if (!done) return;
    const t = setTimeout(finish, 1800);
    return () => clearTimeout(t);
  }, [done, finish]);

  const m = query.data;
  if (!m) return <PageState query={query} noun="mentor" backHref="/user-management#mentors" />;
  const a = m.application;
  /** Opened from Approve on the review page: confirming approves, then assigns. */
  const approving = isAwaitingReview(a.status) || approvedHere;
  const selection = edited ?? selectionOf(m.programs);
  const setSelection = (fn: (s: Selection) => Selection) => setEdited(fn(selection));
  const all: AssignableProgram[] = (programsQuery.data ?? []).map((p) => ({ id: p.id, title: p.title, track: p.school }));
  const q = search.trim().toLowerCase();
  const programs = q ? all.filter((p) => `${p.title} ${p.track}`.toLowerCase().includes(q)) : all;
  const chosen = all.filter((p) => selection[p.id]);

  const toggleProgram = (id: string) => setSelection(({ [id]: current, ...rest }) => (current ? rest : { ...rest, [id]: [] }));
  // A mentor can hold one or both roles in a program.
  const toggleRole = (id: string, role: MentorRole) =>
    setSelection((s) => ({ ...s, [id]: s[id]?.includes(role) ? s[id].filter((r) => r !== role) : ROLES.filter((r) => r === role || s[id]?.includes(r)) }));

  return (
    <div className={reviewStyles.page}>
      <h1 className={reviewStyles.title}>
        <Link href="/user-management#mentors" className={reviewStyles.back} aria-label="Back to mentors">
          <svg width="19" height="17" viewBox="0 0 19 17" fill="none" aria-hidden="true">
            <path d="M8.5 1.6 1.6 8.5l6.9 6.9M1.6 8.5h15.8" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
        Mentor Details
      </h1>

      <section className={reviewStyles.card} aria-label={`Assign ${m.name}`}>
        <header className={reviewStyles.head}>
          <div className={reviewStyles.who}>
            <span className={reviewStyles.avatar} aria-hidden="true">
              {applicantInitials(m.name)}
            </span>
            <div className={reviewStyles.identity}>
              <h2 className={reviewStyles.name}>{m.name}</h2>
              <a href={`mailto:${m.email}`} className={reviewStyles.email}>
                {m.email}
              </a>
              {approving ? (
                <span className={`${reviewStyles.badge} ${reviewStyles.pending}`}>
                  <ClockIcon size={12} color="#894B00" strokeWidth={2} />
                  Pending approval
                </span>
              ) : a.reviewedAt && (
                <span className={reviewStyles.submitted}>
                  <ClockIcon size={12} color="#455A64" strokeWidth={2} />
                  Approved {timeAgo(a.reviewedAt)}
                </span>
              )}
            </div>
          </div>
        </header>

        {(a.link || a.introVideo) && (
          <div className={reviewStyles.links}>
            {a.link && (
              <a href={a.link} target="_blank" rel="noreferrer" className={reviewStyles.link}>
                <LinkIcon size={14} color="#722FFF" strokeWidth={1.67} />
                {linkLabel(a.link)}
              </a>
            )}
            {a.introVideo && (
              <a href={a.introVideo} target="_blank" rel="noreferrer" className={reviewStyles.link}>
                <LinkIcon size={14} color="#722FFF" strokeWidth={1.67} />
                Intro video
              </a>
            )}
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

        <dl className={reviewStyles.details}>
          <div className={reviewStyles.detail}>
            <dt>Expertise</dt>
            <dd>
              <BriefcaseIcon size={16} color="#722FFF" strokeWidth={1.33} />
              <ul className={reviewStyles.chips}>
                {a.expertise.length === 0 && <li className={reviewStyles.chip}>Not provided</li>}
                {a.expertise.map((e) => (
                  <li key={e.label} className={reviewStyles.chip}>
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

        <footer className={reviewStyles.footer}>
          <div className={`${reviewStyles.actions} ${styles.actions}`}>
            <Link
              href={approving ? `/user-management/mentors/review/${encodeURIComponent(mentorId)}` : "/user-management#mentors"}
              className={styles.later}
            >
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
          initial={Object.fromEntries(chosen.map((p) => [p.id, selection[p.id]]))}
          onCancel={backToPage}
          onConfirm={async (confirmed) => {
            // The PUT replaces every link: send the confirmed programs, drop current ones
            // the admin unticked here, and keep any current link this page doesn't list.
            const listed = new Set(all.map((p) => p.id));
            const changes = [
              ...m.programs.filter((l) => listed.has(l.programId) && !confirmed[l.programId]).map((l) => ({ programId: l.programId, mentor: false, advisor: false })),
              ...Object.entries(confirmed).map(([programId, roles]) => ({
                programId,
                mentor: roles.includes("Instructor"),
                advisor: roles.includes("Program Advisor"),
              })),
            ];
            // Approve first (only now, after programs and roles are chosen), then save the programs.
            if (approving && !approvedHere) {
              await review.mutateAsync({ action: "approve" });
              setApprovedHere(true);
            }
            try {
              await save.mutateAsync(mergePrograms(m.programs, changes));
            } catch (e) {
              throw new Error(
                approving ? `The application is approved, but the programs couldn't be saved: ${errorText(e)} Try again.` : errorText(e),
              );
            }
            setEdited(confirmed);
            setConfirming(false);
            setDone(approving ? "Mentorship Application Approved Successfully !" : `${m.name} Assigned Successfully !`);
          }}
        />
      )}
      {done && <SuccessDialog title={done} onClose={finish} />}
    </div>
  );
}
