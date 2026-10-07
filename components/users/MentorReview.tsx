"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import {
  AwardIcon,
  BriefcaseIcon,
  CircleCheckIcon,
  CircleXIcon,
  ClockIcon,
  GraduationCapIcon,
  LinkIcon,
  RatingStarIcon,
  TrophyIcon,
} from "@/components/app/icons";
import { RATING_LABELS, applicantInitials, type MentorApplication } from "./mentorApplications";
import styles from "./MentorReview.module.css";
import RejectDialog from "./RejectDialog";
import SuccessDialog from "./SuccessDialog";

type Decision = "pending" | "approved" | "rejected";

const DECISION_BADGE: Record<Decision, { label: string; className: string }> = {
  pending: { label: "Pending Review", className: styles.pending },
  approved: { label: "Approved", className: styles.approved },
  rejected: { label: "Rejected", className: styles.rejected },
};

/** Clickable 1–5 trophy scale for the reviewer's own rating. */
function TrophyRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0);
  const shown = hover || value;
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

export default function MentorReview({ application: a }: { application: MentorApplication }) {
  const [rating, setRating] = useState(a.adminRating);
  const [decision, setDecision] = useState<Decision>("pending");
  const [dialog, setDialog] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState(false);
  const [feedback, setFeedback] = useState("");
  const closeDialog = useCallback(() => setDialog(null), []);
  const closeReject = useCallback(() => setRejecting(false), []);
  const badge = DECISION_BADGE[decision];

  const decide = (d: Exclude<Decision, "pending">) => {
    setDecision(d);
    setDialog(`Mentorship Application ${d === "approved" ? "Approved" : "Rejected"} Successfully !`);
  };

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

      <section className={styles.card} aria-label={`${a.name}'s application`}>
        <header className={styles.head}>
          <div className={styles.who}>
            <span className={styles.avatar} aria-hidden="true">
              {applicantInitials(a.name)}
            </span>
            <div className={styles.identity}>
              <h2 className={styles.name}>{a.name}</h2>
              <a href={`mailto:${a.email}`} className={styles.email}>
                {a.email}
              </a>
              <span className={styles.submitted}>
                <ClockIcon size={12} color="#455A64" strokeWidth={2} />
                Submitted {a.submitted}
              </span>
            </div>
          </div>
          <span className={`${styles.badge} ${badge.className}`}>
            {decision === "pending" && <ClockIcon size={12} color="#894B00" strokeWidth={2} />}
            {badge.label}
          </span>
        </header>

        <p className={styles.bio}>{a.bio}</p>

        <dl className={styles.details}>
          <div className={styles.detail}>
            <dt>Education</dt>
            <dd>
              <GraduationCapIcon size={16} color="#722FFF" strokeWidth={1.67} />
              <span>{a.education}</span>
            </dd>
          </div>
          <div className={styles.detail}>
            <dt>Experience</dt>
            <dd>
              <AwardIcon size={16} color="#722FFF" strokeWidth={1.67} />
              <span>
                {a.experience} {a.experience === 1 ? "year" : "years"}
              </span>
            </dd>
          </div>
          <div className={styles.detail}>
            <dt>Expertise</dt>
            <dd>
              <BriefcaseIcon size={16} color="#722FFF" strokeWidth={1.67} />
              <ul className={styles.chips}>
                {a.expertise.map((e) => (
                  <li key={e.skill} className={styles.chip}>
                    {e.skill} -{e.years} {e.years === 1 ? "Year" : "Years"}
                  </li>
                ))}
              </ul>
            </dd>
          </div>
        </dl>

        <div className={styles.links}>
          <a href={a.portfolio} target="_blank" rel="noreferrer" className={styles.link}>
            <LinkIcon size={14} color="#722FFF" strokeWidth={1.67} />
            Portfolio
          </a>
          <a href={a.linkedin} target="_blank" rel="noreferrer" className={styles.link}>
            <LinkIcon size={14} color="#722FFF" strokeWidth={1.67} />
            LinkedIn
          </a>
        </div>

        <div className={styles.ratings}>
          <div className={styles.ratingCol}>
            <h3 className={styles.ratingTitle}>System Rating</h3>
            <div className={styles.ratingRow}>
              <div className={styles.scale} aria-label={`System rating ${a.systemRating} out of 5`}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <RatingStarIcon key={n} on={n <= a.systemRating} />
                ))}
              </div>
              <span className={`${styles.score} ${styles.scoreStars}`}>{a.systemRating}/5</span>
            </div>
            <p className={styles.ratingText}>{RATING_LABELS[a.systemRating]}</p>
          </div>

          <div className={styles.ratingCol}>
            <h3 className={styles.ratingTitle}>Rate This Application</h3>
            <div className={styles.ratingRow}>
              <TrophyRating value={rating} onChange={setRating} />
              <span className={`${styles.score} ${styles.scoreTrophies}`}>{rating}/5</span>
            </div>
            <p className={styles.ratingText}>{RATING_LABELS[rating]}</p>
          </div>
        </div>

        <footer className={styles.footer}>
          {decision === "pending" ? (
            <div className={styles.actions}>
              <button type="button" className={styles.reject} onClick={() => setRejecting(true)}>
                <CircleXIcon size={16} color="#F44336" strokeWidth={1.67} />
                Reject
              </button>
              <button type="button" className={styles.approve} onClick={() => decide("approved")} disabled={rating === 0} title={rating === 0 ? "Rate the application first" : undefined}>
                <CircleCheckIcon size={16} color="#FFFFFF" strokeWidth={1.67} />
                Approve
              </button>
            </div>
          ) : (
            <div className={styles.actions}>
              <button type="button" className={styles.undo} onClick={() => setDecision("pending")}>
                Undo decision
              </button>
            </div>
          )}
        </footer>
      </section>

      {rejecting && (
        <RejectDialog
          initial={feedback}
          onClose={closeReject}
          onSubmit={(text) => {
            setFeedback(text);
            setRejecting(false);
            decide("rejected");
          }}
        />
      )}
      {dialog && <SuccessDialog title={dialog} onClose={closeDialog} />}
    </div>
  );
}
