"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { LinkIcon, RatingStarIcon } from "@/components/app/icons";
import type { AssignableMentor } from "./assignableMentors";
import { RATING_LABELS, applicantInitials } from "./mentorApplications";
import review from "./MentorReview.module.css";
import styles from "./ReviewApplicationModal.module.css";

/** Clickable 1–5 star scale. */
function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0);
  const shown = hover || value;
  return (
    <div className={review.scale} role="radiogroup" aria-label="Rate this application" onMouseLeave={() => setHover(0)}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={value === n}
          aria-label={`${n} out of 5`}
          className={review.trophy}
          onMouseEnter={() => setHover(n)}
          onFocus={() => setHover(n)}
          onBlur={() => setHover(0)}
          onClick={() => onChange(n)}
        >
          <RatingStarIcon on={n <= shown} />
        </button>
      ))}
    </div>
  );
}

/** Last look at the mentor's application before approving and assigning them (or rejecting). */
export default function ReviewApplicationModal({
  mentor: m,
  initialRating,
  onClose,
  onApprove,
  onReject,
}: {
  mentor: AssignableMentor;
  initialRating: number;
  onClose: () => void;
  onApprove: (rating: number) => void;
  onReject: (rating: number) => void;
}) {
  const titleId = useId();
  const ref = useRef<HTMLDivElement>(null);
  const [rating, setRating] = useState(initialRating);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    ref.current?.focus();
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  return createPortal(
    <div className={styles.overlay} onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div ref={ref} className={styles.modal} role="dialog" aria-modal="true" aria-labelledby={titleId} tabIndex={-1}>
        <header className={styles.head}>
          <h2 id={titleId} className={styles.title}>
            Review Application
          </h2>
          <button type="button" className={styles.close} onClick={onClose} aria-label="Close">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path d="M15 5 5 15M5 5l10 10" stroke="#3A3A3A" strokeWidth="1.67" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </header>

        <div className={styles.body}>
          <div className={styles.who}>
            <span className={styles.avatar} aria-hidden="true">
              {applicantInitials(m.name)}
            </span>
            <div className={styles.identity}>
              <h3 className={styles.name}>{m.name}</h3>
              <a href={`mailto:${m.email}`} className={styles.email}>
                {m.email}
              </a>
            </div>
          </div>

          <dl className={styles.fields}>
            {m.expertise[0] && (
              <div className={styles.field}>
                <dt>Expertise</dt>
                <dd>{m.expertise[0].skill}</dd>
              </div>
            )}
            <div className={styles.field}>
              <dt>Total Years of Experience</dt>
              <dd>
                {m.experience} {m.experience === 1 ? "year" : "years"}
              </dd>
            </div>
            {m.education && (
              <div className={styles.field}>
                <dt>Education</dt>
                <dd>{m.education}</dd>
              </div>
            )}
            {m.bio && (
              <div className={styles.field}>
                <dt>Bio</dt>
                <dd className={styles.bio}>{m.bio}</dd>
              </div>
            )}
            <div className={styles.field}>
              <dt>Expertise</dt>
              <dd>
                <ul className={styles.chips}>
                  {m.expertise.map((e) => (
                    <li key={e.skill} className={styles.chip}>
                      {e.skill} - {e.years} {e.years === 1 ? "Year" : "Years"}
                    </li>
                  ))}
                </ul>
              </dd>
            </div>
            {(m.portfolio || m.linkedin) && (
              <div className={styles.field}>
                <dt>Links</dt>
                <dd className={styles.links}>
                  {m.portfolio && (
                    <a href={m.portfolio} target="_blank" rel="noreferrer" className={styles.link}>
                      <LinkIcon size={16} color="#9810FA" strokeWidth={1.33} />
                      Portfolio
                    </a>
                  )}
                  {m.linkedin && (
                    <a href={m.linkedin} target="_blank" rel="noreferrer" className={styles.link}>
                      <LinkIcon size={16} color="#9810FA" strokeWidth={1.33} />
                      LinkedIn
                    </a>
                  )}
                </dd>
              </div>
            )}
          </dl>

          <div className={`${review.ratings} ${styles.rate}`}>
            <div className={review.ratingCol}>
              <h3 className={review.ratingTitle}>Rate This Application</h3>
              <div className={review.ratingRow}>
                <StarRating value={rating} onChange={setRating} />
                <span className={`${review.score} ${review.scoreStars}`}>{rating}/5</span>
              </div>
              <p className={review.ratingText}>{RATING_LABELS[rating]}</p>
            </div>
          </div>
        </div>

        <footer className={styles.foot}>
          <button type="button" className={styles.reject} onClick={() => onReject(rating)}>
            Reject
          </button>
          <button
            type="button"
            className={styles.approve}
            disabled={rating === 0}
            title={rating === 0 ? "Rate the application first" : undefined}
            onClick={() => onApprove(rating)}
          >
            Approve &amp; Assign
          </button>
        </footer>
      </div>
    </div>,
    document.body,
  );
}
