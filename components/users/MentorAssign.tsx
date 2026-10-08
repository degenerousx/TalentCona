"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import {
  AwardIcon,
  BriefcaseIcon,
  ClockIcon,
  LinkIcon,
  SearchIcon,
  StarIcon,
  TrophyIcon,
} from "@/components/app/icons";
import { Check, RoleDefinitions } from "./AssignParts";
import AssignProgramsModal from "./AssignProgramsModal";
import RejectDialog from "./RejectDialog";
import ReviewApplicationModal from "./ReviewApplicationModal";
import type { AssignableMentor } from "./assignableMentors";
import { applicantInitials } from "./mentorApplications";
import { ASSIGNABLE_PROGRAMS, type MentorRole } from "./mentors";
import review from "./MentorReview.module.css";
import styles from "./MentorAssign.module.css";
import SuccessDialog from "./SuccessDialog";

const ROLES: MentorRole[] = ["Instructor", "Program Advisor"];

/** Program id → the roles chosen for it (possibly none yet). */
type Selection = Record<string, MentorRole[]>;

export default function MentorAssign({ mentor: m }: { mentor: AssignableMentor }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [selection, setSelection] = useState<Selection>({});
  /** Assign → Assign Programs → Review Application → (Reject Application) → success. */
  const [step, setStep] = useState<"page" | "programs" | "review" | "reject">("page");
  const [rating, setRating] = useState(m.adminRating);
  const [feedback, setFeedback] = useState("");
  const [done, setDone] = useState<string | null>(null);
  const backToPage = useCallback(() => setStep("page"), []);
  const backToReview = useCallback(() => setStep("review"), []);
  const finish = useCallback(() => router.push("/user-management#mentors"), [router]);

  const q = query.trim().toLowerCase();
  const programs = q ? ASSIGNABLE_PROGRAMS.filter((p) => `${p.title} ${p.track}`.toLowerCase().includes(q)) : ASSIGNABLE_PROGRAMS;
  const chosen = ASSIGNABLE_PROGRAMS.filter((p) => selection[p.id]);

  const toggleProgram = (id: string) =>
    setSelection(({ [id]: current, ...rest }) => (current ? rest : { ...rest, [id]: [] }));
  const toggleRole = (id: string, role: MentorRole) =>
    setSelection((s) => {
      const roles = s[id] ?? [];
      const next = roles.includes(role) ? roles.filter((r) => r !== role) : [...roles, role];
      return { ...s, [id]: ROLES.filter((r) => next.includes(r)) };
    });

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
              <span className={review.submitted}>
                <ClockIcon size={12} color="#455A64" strokeWidth={2} />
                Approved {m.approved}
              </span>
            </div>
          </div>
        </header>

        {(m.portfolio || m.linkedin) && (
          <div className={review.links}>
            {m.portfolio && (
              <a href={m.portfolio} target="_blank" rel="noreferrer" className={review.link}>
                <LinkIcon size={14} color="#722FFF" strokeWidth={1.67} />
                Portfolio
              </a>
            )}
            {m.linkedin && (
              <a href={m.linkedin} target="_blank" rel="noreferrer" className={review.link}>
                <LinkIcon size={14} color="#722FFF" strokeWidth={1.67} />
                LinkedIn
              </a>
            )}
          </div>
        )}

        <dl className={styles.stats}>
          <div className={styles.stat}>
            <dt>Experience</dt>
            <dd className={styles.statWide}>
              <AwardIcon size={16} color="#722FFF" strokeWidth={1.33} />
              <span>
                {m.experience} {m.experience === 1 ? "year" : "years"}
              </span>
            </dd>
          </div>
          <div className={styles.stat}>
            <dt>System Rating</dt>
            <dd>
              <StarIcon />
              <span className={styles.score}>{m.systemRating}</span>
            </dd>
          </div>
          <div className={styles.stat}>
            <dt>Admin Rating</dt>
            <dd>
              <TrophyIcon />
              <span className={styles.score}>{m.adminRating || "—"}</span>
            </dd>
          </div>
        </dl>

        <dl className={review.details}>
          <div className={review.detail}>
            <dt>Expertise</dt>
            <dd>
              <BriefcaseIcon size={16} color="#722FFF" strokeWidth={1.33} />
              <ul className={review.chips}>
                {m.expertise.map((e) => (
                  <li key={e.skill} className={review.chip}>
                    {e.skill} -{e.years} {e.years === 1 ? "Year" : "Years"}
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
            <input type="search" placeholder="Search Programs..." value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Search programs" />
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
            {programs.length === 0 && <li className={styles.noMatch}>No programs match “{query}”.</li>}
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
              onClick={() => setStep("programs")}
            >
              Assign
            </button>
          </div>
        </footer>
      </section>

      {step === "programs" && (
        <AssignProgramsModal
          mentorName={m.name}
          initial={Object.fromEntries(chosen.map((p) => [p.id, selection[p.id][0] ?? null]))}
          onCancel={backToPage}
          onConfirm={(confirmed) => {
            setSelection(Object.fromEntries(Object.entries(confirmed).map(([id, role]) => [id, [role]])));
            setStep("review");
          }}
        />
      )}
      {step === "review" && (
        <ReviewApplicationModal
          mentor={m}
          initialRating={rating}
          onClose={backToPage}
          onApprove={(r) => {
            setRating(r);
            setStep("page");
            setDone("Mentorship Application Approved & Assigned Successfully !");
          }}
          onReject={(r) => {
            setRating(r);
            setStep("reject");
          }}
        />
      )}
      {step === "reject" && (
        <RejectDialog
          initial={feedback}
          onClose={backToReview}
          onSubmit={(text) => {
            setFeedback(text);
            setStep("page");
            setDone("Mentorship Application Rejected Successfully !");
          }}
        />
      )}
      {done && <SuccessDialog title={done} onClose={finish} />}
    </div>
  );
}
