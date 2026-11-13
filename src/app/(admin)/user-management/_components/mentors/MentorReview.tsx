"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { AwardIcon, BriefcaseIcon, CircleCheckIcon, CircleXIcon, ClockIcon, GraduationCapIcon, LinkIcon, RatingStarIcon, TrophyIcon } from "@/components/icons";
import { errorText, timeAgo, useMentor, useRateMentor, useReviewMentor, type ReviewAction } from "../api";
import { RATING_LABELS, applicantInitials, isAwaitingReview, linkLabel } from "./reviewParts";
import PageState from "../shared/PageState";
import RejectDialog from "../shared/RejectDialog";
import { applicationStatusLabel } from "../filters";
import SuccessDialog from "../shared/SuccessDialog";
import styles from "./MentorReview.module.css";

/** Clickable 1–5 trophy scale for the reviewer's own rating. */
function TrophyRating({ value, onChange, disabled }: { value: number; onChange: (v: number) => void; disabled?: boolean }) {
  const [hover, setHover] = useState(0);
  const shown = (!disabled && hover) || value;
  return (
    <div className={styles.scale} role="radiogroup" aria-label="Rate this application" onMouseLeave={() => setHover(0)}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={value === n}
          aria-label={`${n} out of 5`}
          className={styles.trophy}
          disabled={disabled}
          onMouseEnter={() => setHover(n)}
          onFocus={() => setHover(n)}
          onBlur={() => setHover(0)}
          onClick={() => onChange(n)}
        >
          <TrophyIcon size={32} color={n <= shown ? "#A02FFF" : "#D1D5DC"} />
        </button>
      ))}
    </div>
  );
}

const SUCCESS: Record<ReviewAction, string> = {
  approve: "Mentorship Application Approved Successfully !",
  reject: "Mentorship Application Rejected Successfully !",
  "request-changes": "Changes Requested Successfully !",
};

/**
 * Pending application: details, admin rating (PATCH /rating), Reject and
 * Request changes. Approve opens the assign page, which approves the
 * application only once programs and roles are confirmed there.
 */
export default function MentorReview({ mentorId }: { mentorId: string }) {
  const router = useRouter();
  const query = useMentor(mentorId);
  const rate = useRateMentor(mentorId);
  const review = useReviewMentor(mentorId);
  const [dialog, setDialog] = useState<"reject" | "changes" | null>(null);
  /** Success message, and where closing it goes: Approve continues to program assignment. */
  const [done, setDone] = useState<{ title: string; next: string } | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const closeDialog = useCallback(() => setDialog(null), []);
  const finish = useCallback(() => {
    if (done) router.push(done.next);
  }, [router, done]);
  // The success message shows briefly, then moves on by itself (closing it moves on sooner).
  useEffect(() => {
    if (!done) return;
    const t = setTimeout(finish, 1800);
    return () => clearTimeout(t);
  }, [done, finish]);

  const m = query.data;
  if (!m) return <PageState query={query} noun="mentor application" backHref="/user-management#mentors" />;
  const a = m.application;
  const pending = isAwaitingReview(a.status);
  const rating = rate.isPending ? (rate.variables ?? 0) : (a.adminRating ?? 0);
  const system = a.systemRating != null ? Math.round(a.systemRating) : null;

  const decide = async (action: ReviewAction, reason?: string) => {
    setActionError(null);
    await review.mutateAsync({ action, reason });
    setDialog(null);
    setDone({
      title: SUCCESS[action],
      next: "/user-management#mentors",
    });
  };

  const badgeClass = a.status === "Approved" ? styles.approved : a.status === "Rejected" ? styles.rejected : styles.pending;

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>
        <Link href="/user-management#mentors" className={styles.back} aria-label="Back to mentors">
          <svg width="19" height="17" viewBox="0 0 19 17" fill="none" aria-hidden="true">
            <path d="M8.5 1.6 1.6 8.5l6.9 6.9M1.6 8.5h15.8" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
        Mentor Details
      </h1>

      <section className={styles.card} aria-label={`${m.name}'s application`}>
        <header className={styles.head}>
          <div className={styles.who}>
            <span className={styles.avatar} aria-hidden="true">
              {applicantInitials(m.name)}
            </span>
            <div className={styles.identity}>
              <h2 className={styles.name}>{m.name}</h2>
              <a href={`mailto:${m.email}`} className={styles.email}>
                {m.email}
              </a>
              {/* A not-submitted application has no submission time to show. */}
              {a.submittedAt && a.status !== "Draft" && (
                <span className={styles.submitted}>
                  <ClockIcon size={12} color="#455A64" strokeWidth={2} />
                  Submitted {timeAgo(a.submittedAt)}
                </span>
              )}
            </div>
          </div>
          <span className={`${styles.badge} ${badgeClass}`}>
            {pending && <ClockIcon size={12} color="#894B00" strokeWidth={2} />}
            {pending ? "Pending Review" : applicationStatusLabel(a.status)}
          </span>
        </header>

        <p className={styles.bio}>{a.bio ?? "No bio provided."}</p>

        <dl className={styles.details}>
          <div className={styles.detail}>
            <dt>Education</dt>
            <dd>
              <GraduationCapIcon size={16} color="#722FFF" strokeWidth={1.67} />
              <span>{a.education ?? "Not provided"}</span>
            </dd>
          </div>
          <div className={styles.detail}>
            <dt>Experience</dt>
            <dd>
              <AwardIcon size={16} color="#722FFF" strokeWidth={1.67} />
              <span>{a.experience != null ? `${a.experience} ${a.experience === 1 ? "year" : "years"}` : "Not provided"}</span>
            </dd>
          </div>
          <div className={styles.detail}>
            <dt>Expertise</dt>
            <dd>
              <BriefcaseIcon size={16} color="#722FFF" strokeWidth={1.67} />
              <ul className={styles.chips}>
                {a.expertise.length === 0 && <li className={styles.chip}>Not provided</li>}
                {a.expertise.map((e) => (
                  <li key={e.label} className={styles.chip}>
                    {e.label}
                    {e.years ? ` -${e.years} ${e.years === 1 ? "Year" : "Years"}` : ""}
                  </li>
                ))}
              </ul>
            </dd>
          </div>
        </dl>

        {(a.link || a.introVideo || a.documents.length > 0) && (
          <div className={styles.links}>
            {a.link && (
              <a href={a.link} target="_blank" rel="noreferrer" className={styles.link}>
                <LinkIcon size={14} color="#722FFF" strokeWidth={1.67} />
                {linkLabel(a.link)}
              </a>
            )}
            {a.introVideo && (
              <a href={a.introVideo} target="_blank" rel="noreferrer" className={styles.link}>
                <LinkIcon size={14} color="#722FFF" strokeWidth={1.67} />
                Intro video
              </a>
            )}
            {a.documents.map((d) => (
              <a key={d.url} href={d.url} target="_blank" rel="noreferrer" className={styles.link}>
                <LinkIcon size={14} color="#722FFF" strokeWidth={1.67} />
                {d.label}
              </a>
            ))}
          </div>
        )}

        <div className={styles.ratings}>
          <div className={styles.ratingCol}>
            <h3 className={styles.ratingTitle}>System Rating</h3>
            <div className={styles.ratingRow}>
              <div className={styles.scale} aria-label={system != null ? `System rating ${system} out of 5` : "No system rating"}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <RatingStarIcon key={n} on={system != null && n <= system} />
                ))}
              </div>
              <span className={`${styles.score} ${styles.scoreStars}`}>{system != null ? `${system}/5` : "—"}</span>
            </div>
            <p className={styles.ratingText}>{a.systemRatingSummary ?? RATING_LABELS[system ?? 0]}</p>
          </div>

          <div className={styles.ratingCol}>
            <h3 className={styles.ratingTitle}>Rate This Application</h3>
            <div className={styles.ratingRow}>
              <TrophyRating
                value={rating}
                disabled={!pending || rate.isPending}
                onChange={(v) => {
                  setActionError(null);
                  rate.mutate(v, { onError: (e) => setActionError(`Couldn't save the rating: ${errorText(e)}`) });
                }}
              />
              <span className={`${styles.score} ${styles.scoreTrophies}`}>{rating}/5</span>
            </div>
            <p className={styles.ratingText} aria-live="polite">
              {rate.isPending ? "Saving rating…" : RATING_LABELS[rating]}
            </p>
          </div>
        </div>

        {actionError && (
          <p role="alert" className={styles.ratingText} style={{ color: "#C10007" }}>
            {actionError}
          </p>
        )}

        <footer className={styles.footer}>
          {pending ? (
            <div className={styles.actions}>
              <button type="button" className={styles.reject} onClick={() => setDialog("reject")} disabled={review.isPending}>
                <CircleXIcon size={16} color="#F44336" strokeWidth={1.67} />
                Reject
              </button>
              <button type="button" className={styles.undo} onClick={() => setDialog("changes")} disabled={review.isPending}>
                Request changes
              </button>
              <button
                type="button"
                className={styles.approve}
                disabled={rating === 0 || review.isPending || rate.isPending}
                title={rating === 0 ? "Rate the application first" : undefined}
                // Approval happens on the assign page, once programs and roles are chosen.
                onClick={() => router.push(`/user-management/mentors/assign/${encodeURIComponent(mentorId)}`)}
              >
                <CircleCheckIcon size={16} color="#FFFFFF" strokeWidth={1.67} />
                Approve
              </button>
            </div>
          ) : (
            <p className={styles.ratingText}>
              {a.status === "Draft"
                ? "Not Submitted: the mentor hasn't submitted this application yet, so it can't be reviewed."
                : a.status === "ChangesRequested"
                  ? `Changes were requested${a.reviewedAt ? ` ${timeAgo(a.reviewedAt)}` : ""}${a.rejectionReason ? `: ${a.rejectionReason}` : ""}. It returns to Pending Reviews when the mentor resubmits.`
                  : a.status === "Rejected" && a.rejectionReason
                    ? `Rejected${a.reviewedAt ? ` ${timeAgo(a.reviewedAt)}` : ""}: ${a.rejectionReason}`
                    : `This application was ${applicationStatusLabel(a.status).toLowerCase()}${a.reviewedAt ? ` ${timeAgo(a.reviewedAt)}` : ""}.`}
            </p>
          )}
        </footer>
      </section>

      {dialog === "reject" && <RejectDialog onClose={closeDialog} onSubmit={(text) => decide("reject", text)} />}
      {dialog === "changes" && (
        <RejectDialog
          title="Request Changes"
          label="What should the mentor change?"
          placeholder="Explain what needs updating before the application can be approved..."
          required
          onClose={closeDialog}
          onSubmit={(text) => decide("request-changes", text)}
        />
      )}
      {done && <SuccessDialog title={done.title} onClose={finish} />}
    </div>
  );
}
