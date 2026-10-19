"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Award, BookOpen, ChevronLeft, ChevronRight, CircleCheck, Clock, FileText, Flag, TrendingUp } from "lucide-react";
import { buttonClasses } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import type { Assessment } from "./data";

/**
 * Admin preview of the learner's module test (Figma 293:17832 – 293:18221):
 * an intro card, then a timed test with a question navigator.
 */

const clock = (seconds: number) =>
  `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;

function Intro({ assessment, backHref, onStart }: { assessment: Assessment; backHref: string; onStart: () => void }) {
  const total = assessment.questions.reduce((sum, q) => sum + q.points, 0);
  const facts = [
    { label: "Questions", value: String(assessment.questions.length), Icon: BookOpen },
    { label: "Time Limit", value: clock(assessment.timeLimit), Icon: Clock },
    { label: "Total Points", value: String(total), Icon: Award },
    { label: "Passing Score", value: `${assessment.passingScore}%`, Icon: TrendingUp },
  ];
  const rules = [
    `Answer all ${assessment.questions.length} questions to the best of your ability`,
    `You have ${clock(assessment.timeLimit)} to complete the test`,
    "You can flag questions for review and navigate between questions",
    "The test will auto-submit when time runs out",
    `You need ${assessment.passingScore}% or higher to pass`,
    "You can retake the test if you don't pass",
  ];

  return (
    <section className="flex flex-col gap-6 rounded-[14px] border border-gray-200 bg-white p-6 sm:p-12">
      <div className="flex gap-4">
        <span aria-hidden className="grid size-12 shrink-0 place-items-center rounded-full bg-blue-100 text-blue-600">
          <FileText className="size-6" />
        </span>
        <div className="flex flex-col gap-1">
          <p className="text-sm leading-5 text-gray-500">{assessment.course}</p>
          <h1 className="text-2xl leading-8 text-neutral-950">{assessment.title}</h1>
          <p className="text-base leading-6 text-gray-600">{assessment.description}</p>
        </div>
      </div>

      <dl className="grid gap-4 border-y border-gray-200 py-6 sm:grid-cols-2">
        {facts.map(({ label, value, Icon }) => (
          <div key={label} className="flex items-center gap-3 rounded-[10px] bg-gray-50 p-4">
            <Icon aria-hidden className="size-5 text-gray-600" />
            <div>
              <dt className="text-sm leading-5 text-gray-600">{label}</dt>
              <dd className="text-lg leading-7 text-gray-900">{value}</dd>
            </div>
          </div>
        ))}
      </dl>

      <div className="flex flex-col gap-3 border-b border-gray-200 pb-6">
        <h2 className="text-base leading-6 text-gray-900">Instructions:</h2>
        <ul className="flex flex-col gap-2">
          {rules.map((r) => (
            <li key={r} className="flex items-center gap-2 text-sm leading-5 text-gray-600">
              <CircleCheck aria-hidden className="size-4 shrink-0 text-green-600" />
              {r}
            </li>
          ))}
        </ul>
      </div>

      <div className="flex justify-end gap-3">
        <Link href={backHref} className={buttonClasses({ variant: "outline", className: "border-gray-200 text-neutral-950" })}>
          Back to Program
        </Link>
        <button type="button" onClick={onStart} className={buttonClasses({ className: "px-5" })}>
          Start Test
          <ChevronRight aria-hidden className="size-4" />
        </button>
      </div>
    </section>
  );
}

function Test({ assessment, backHref }: { assessment: Assessment; backHref: string }) {
  const { questions } = assessment;
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [flags, setFlags] = useState<Record<string, boolean>>({});
  const [left, setLeft] = useState(assessment.timeLimit);
  const [submittedEarly, setSubmitted] = useState(false);
  // Running out of time submits the test automatically.
  const submitted = submittedEarly || left <= 0;

  // Count down once a second until the test is submitted.
  useEffect(() => {
    if (submitted) return;
    const t = setTimeout(() => setLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [left, submitted]);

  const answered = questions.filter((q) => answers[q.id]?.trim()).length;
  const percent = Math.round((answered / questions.length) * 100);
  const q = questions[index];
  const lastQuestion = index === questions.length - 1;

  if (submitted) {
    return (
      <section className="flex flex-col items-center gap-4 rounded-[14px] border border-gray-200 bg-white p-12 text-center">
        <CircleCheck aria-hidden className="size-12 text-green-600" />
        <h1 className="text-2xl leading-8 text-neutral-950">Test submitted</h1>
        <p className="text-base leading-6 text-gray-600">
          {answered} of {questions.length} questions answered{left <= 0 && " — time ran out"}. Written answers are
          graded by a mentor.
        </p>
        <Link href={backHref} className={buttonClasses({})}>
          Back to Program
        </Link>
      </section>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-4 rounded-lg bg-white px-6 pt-4 pb-5 sm:px-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm leading-5 text-gray-500">{assessment.course}</p>
            <h1 className="text-xl leading-7 text-gray-900">{assessment.title}</h1>
          </div>
          <div className="flex items-center gap-3">
            <p
              className={cn(
                "flex h-10 items-center gap-2 rounded-[10px] px-4 text-base leading-6 tabular-nums",
                left < 60 ? "bg-red-50 text-danger" : "bg-gray-100 text-gray-900",
              )}
            >
              <Clock aria-hidden className="size-4" />
              <span className="sr-only">Time left: </span>
              {clock(left)}
            </p>
            <button
              type="button"
              onClick={() => setSubmitted(true)}
              className={buttonClasses({
                variant: answered === questions.length ? "primary" : "outline",
                className: answered === questions.length ? "" : "border-gray-300 text-neutral-950",
              })}
            >
              Submit Test
            </button>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <div className="flex justify-between text-sm leading-5 text-gray-600">
            <span>
              Progress: {answered} / {questions.length} answered
            </span>
            <span>{percent}%</span>
          </div>
          <div
            role="progressbar"
            aria-label="Questions answered"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={percent}
            className="h-2 overflow-hidden rounded-full bg-[#030213]/20"
          >
            <div className="h-full rounded-full bg-[#030213] transition-[width]" style={{ width: `${percent}%` }} />
          </div>
        </div>
      </header>

      <div className="flex flex-col gap-6 rounded-lg bg-white lg:flex-row">
        <nav
          aria-label="Questions"
          className="rounded-[14px] bg-linear-to-b from-[#fdc700] to-[#ff8904] p-4 shadow-lg lg:min-h-[652px] lg:w-64 lg:shrink-0"
        >
          <p className="mb-3 text-sm leading-5 text-gray-900">Questions</p>
          <ol className="grid grid-cols-4 gap-2 sm:grid-cols-8 lg:grid-cols-4">
            {questions.map((item, i) => {
              const current = i === index;
              const flagged = flags[item.id];
              const done = Boolean(answers[item.id]?.trim());
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => setIndex(i)}
                    aria-current={current ? "step" : undefined}
                    aria-label={`Question ${i + 1}${done ? ", answered" : ""}${flagged ? ", flagged" : ""}`}
                    className={cn(
                      "grid size-12 place-items-center rounded-[10px] text-sm leading-5",
                      current
                        ? "bg-[#2b7fff] text-white"
                        : flagged
                          ? "bg-[#ffbda7] text-danger"
                          : done
                            ? "bg-green-100 text-green-600"
                            : "border border-gray-300 bg-white text-gray-600",
                    )}
                  >
                    {flagged && !current ? <Flag aria-hidden className="size-4" /> : i + 1}
                  </button>
                </li>
              );
            })}
          </ol>
        </nav>

        <div className="flex flex-1 flex-col items-center gap-4 px-4 py-6 lg:py-4">
          <article className="flex w-full max-w-[704px] flex-col gap-7 rounded-[14px] border border-gray-200 p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex flex-col gap-3">
                <p className="flex flex-wrap gap-2 text-xs leading-4">
                  <span className="rounded-lg bg-primary px-2 py-0.5 text-white">
                    Question {index + 1} of {questions.length}
                  </span>
                  <span className="rounded-lg border border-gray-200 px-2 py-0.5 text-neutral-950">
                    {q.points} points
                  </span>
                </p>
                <h2 id="question-prompt" className="text-xl leading-7 text-neutral-950">
                  {q.prompt}
                </h2>
              </div>
              <button
                type="button"
                aria-pressed={Boolean(flags[q.id])}
                aria-label={flags[q.id] ? "Unflag question" : "Flag question for review"}
                onClick={() => setFlags({ ...flags, [q.id]: !flags[q.id] })}
                className={cn(
                  "grid size-9 shrink-0 place-items-center rounded-lg hover:bg-gray-100",
                  flags[q.id] ? "text-danger" : "text-neutral-950",
                )}
              >
                <Flag aria-hidden className="size-4" fill={flags[q.id] ? "currentColor" : "none"} />
              </button>
            </div>
            <textarea
              aria-labelledby="question-prompt"
              value={answers[q.id] ?? ""}
              onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
              placeholder="Type your answer here..."
              rows={3}
              className="w-full resize-y rounded-lg border border-gray-200 px-3 py-2 text-sm leading-5 placeholder:text-[#717182] focus:border-primary focus:outline-none"
            />
          </article>

          <div className="flex w-full max-w-[704px] justify-between gap-3">
            {index > 0 ? (
              <button
                type="button"
                onClick={() => setIndex(index - 1)}
                className={buttonClasses({ variant: "outline", className: "h-10" })}
              >
                <ChevronLeft aria-hidden className="size-4" />
                Previous
              </button>
            ) : (
              <span />
            )}
            {!lastQuestion && (
              <button type="button" onClick={() => setIndex(index + 1)} className={buttonClasses({ className: "h-10" })}>
                Next
                <ChevronRight aria-hidden className="size-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function AssessmentView({ assessment, backHref }: { assessment: Assessment; backHref: string }) {
  const [started, setStarted] = useState(false);
  return started ? (
    <Test assessment={assessment} backHref={backHref} />
  ) : (
    <Intro assessment={assessment} backHref={backHref} onStart={() => setStarted(true)} />
  );
}
