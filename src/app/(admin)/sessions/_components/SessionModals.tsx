"use client";

import { useEffect, useId, useRef, useState } from "react";
import {
  AlertCircle,
  BookOpen,
  Calendar,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleCheck,
  Clock,
  MessageSquare,
  X,
} from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { cn } from "@/lib/cn";
import { cancelReasons, timeSlots, type Session, type SessionRequest } from "./data";

/* -------------------------------------------------------------------------- */
/* Building blocks                                                            */
/* -------------------------------------------------------------------------- */

const tones = {
  warning: "border-[#fde6d2] bg-[#fff9e6] text-[#c1610e]",
  danger: "border-[#ffccc7] bg-[#fff1f0] text-[#d72836]",
  info: "border-blue-200 bg-blue-50 text-blue-800",
};

function Notice({
  tone,
  title,
  icon = <AlertCircle aria-hidden className="size-4" />,
  children,
}: {
  tone: keyof typeof tones;
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("flex gap-2 rounded-[10px] border p-4", tones[tone])}>
      <span className="mt-0.5 shrink-0">{icon}</span>
      <div className="text-sm leading-5">
        <p className="font-semibold">{title}</p>
        <p>{children}</p>
      </div>
    </div>
  );
}

function Detail({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <p className="text-sm leading-5 text-[#5d5d5d]">{label}</p>
      <div className="text-sm leading-5 text-slate-900">{children}</div>
    </div>
  );
}

function StudentCard({ request, children }: { request: SessionRequest; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3 rounded-[10px] border border-gray-200 bg-gray-50 p-4">
      <div className="flex items-center gap-3">
        <span
          aria-hidden
          className="grid size-10 shrink-0 place-items-center rounded-full bg-linear-to-br from-[#c27aff] to-[#fb64b6] text-base text-white"
        >
          {request.student[0]}
        </span>
        <div>
          <p className="text-base leading-6 text-heading">{request.student}</p>
          <p className="text-xs leading-4 text-slate-900">{request.program}</p>
        </div>
      </div>
      {children}
    </div>
  );
}

type ButtonTone = "approve" | "decline" | "keep" | "danger" | "primary" | "plain";

const buttonTones: Record<ButtonTone, string> = {
  approve: "bg-success text-white hover:bg-success/90",
  decline: "border border-[#d72836] bg-white text-[#d72836] hover:bg-red-50",
  keep: "border border-success bg-white text-green-700 hover:bg-green-50",
  danger: "bg-[#d72836] text-white hover:bg-[#d72836]/90",
  primary: "bg-primary text-white hover:bg-primary/90",
  plain: "border border-gray-200 bg-white text-slate-900 hover:bg-gray-50",
};

function ActionButton({
  tone,
  children,
  ...props
}: { tone: ButtonTone } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className={cn("h-9 rounded-lg px-4 text-sm leading-5 font-medium", buttonTones[tone])}
      {...props}
    >
      {children}
    </button>
  );
}

function Footer({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-wrap justify-end gap-3">{children}</div>;
}

const titleClass = "text-xl leading-7 text-slate-900";
const subtitle = (text: string) => <p className="text-sm leading-5 text-[#5d5d5d]">{text}</p>;

/* -------------------------------------------------------------------------- */
/* Success popup (293:36632 – 293:37256)                                      */
/* -------------------------------------------------------------------------- */

export function SuccessModal({ message, onClose }: { message: string; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    const trigger = document.activeElement as HTMLElement | null;
    dialog.showModal();
    return () => {
      dialog.close();
      trigger?.focus();
    };
  }, []);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
      className="m-auto w-[calc(100%-2rem)] max-w-[550px] rounded-2xl bg-white p-0 shadow-xl backdrop:bg-slate-900/50"
    >
      <div className="relative flex flex-col items-center gap-6 px-10 pt-10 pb-12 text-center">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute top-4 right-4 grid size-9 place-items-center rounded-lg text-slate-700 hover:bg-slate-100"
        >
          <X aria-hidden className="size-5" />
        </button>
        <span className="grid size-[100px] place-items-center rounded-full border-[7px] border-[#b9f6ca] bg-success text-white">
          <Check aria-hidden className="size-8" strokeWidth={3} />
        </span>
        <h2 id={titleId} className="text-2xl leading-[31px] font-semibold text-heading">
          {message}
        </h2>
      </div>
    </dialog>
  );
}

/* -------------------------------------------------------------------------- */
/* Review a pending request (293:36704 / 36774 / 36851)                       */
/* -------------------------------------------------------------------------- */

export type RequestOutcome = "approved" | "declined";

export function RequestModal({
  request,
  onClose,
  onResolve,
}: {
  request: SessionRequest;
  onClose: () => void;
  onResolve: (outcome: RequestOutcome) => void;
}) {
  if (request.kind === "reschedule") {
    return (
      <Modal
        open
        size="sm"
        title="Reschedule Request"
        titleClassName={titleClass}
        subtitle={subtitle(`${request.student} has requested to reschedule your session`)}
        onClose={onClose}
        footer={
          <Footer>
            <ActionButton tone="decline" onClick={() => onResolve("declined")}>
              Decline Request
            </ActionButton>
            <ActionButton tone="approve" onClick={() => onResolve("approved")}>
              Approve Reschedule
            </ActionButton>
          </Footer>
        }
      >
        <Notice tone="warning" title="Pending Your Approval">
          Please review the student&apos;s request and choose to approve or decline the reschedule.
        </Notice>
        <StudentCard request={request}>
          <Detail label="Session">
            <p className="text-base leading-6 font-semibold">{request.topic}</p>
          </Detail>
          <Detail label="Student's Reason">&ldquo;{request.reason}&rdquo;</Detail>
        </StudentCard>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2 rounded-[10px] border-[1.6px] border-[#d72836] bg-[#fff1f0] p-4">
            <p className="text-xs leading-4 text-[#5d5d5d]">Current Time</p>
            <p className="flex items-center gap-2 text-sm leading-5 font-semibold text-slate-900">
              <Clock aria-hidden className="size-4 text-[#d72836]" />
              {request.currentTime}
            </p>
          </div>
          <div className="flex flex-col gap-2 rounded-[10px] border-[1.6px] border-success bg-[#e6fbf7] p-4">
            <p className="text-xs leading-4 text-[#5d5d5d]">Proposed New Time</p>
            <p className="flex items-center gap-2 text-sm leading-5 font-semibold text-slate-900">
              <Calendar aria-hidden className="size-4 text-success" />
              {request.proposedDate} <span className="ml-2">{request.proposedTime}</span>
            </p>
          </div>
        </div>
      </Modal>
    );
  }

  if (request.kind === "session") {
    const rows = [
      { icon: Calendar, label: "Date & Time", value: [request.date, request.time] },
      { icon: BookOpen, label: "Topic", value: ["Front-End Development Program"] },
      { icon: BookOpen, label: "Event Type", value: [request.eventType] },
      { icon: MessageSquare, label: "What would you like to discuss?", value: [request.discuss] },
    ];
    return (
      <Modal
        open
        size="sm"
        title="Session Request"
        titleClassName={titleClass}
        subtitle={subtitle(`${request.student} has requested to schedule a session`)}
        onClose={onClose}
        footer={
          <Footer>
            <ActionButton tone="decline" onClick={() => onResolve("declined")}>
              Decline Request
            </ActionButton>
            <ActionButton tone="approve" onClick={() => onResolve("approved")}>
              Approve Session
            </ActionButton>
          </Footer>
        }
      >
        <Notice tone="warning" title="Pending Your Approval">
          Please review the student&apos;s request and choose to approve or decline the session.
        </Notice>
        <StudentCard request={request}>
          <dl className="flex flex-col gap-3 border-t border-gray-200 pt-3">
            {rows.map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex gap-3">
                <Icon aria-hidden className="mt-0.5 size-4 shrink-0 text-slate-500" />
                <div>
                  <dt className="text-sm leading-5 text-[#5d5d5d]">{label}</dt>
                  {value.map((v) => (
                    <dd key={v} className="text-sm leading-5 text-slate-900">
                      {v}
                    </dd>
                  ))}
                </div>
              </div>
            ))}
          </dl>
        </StudentCard>
      </Modal>
    );
  }

  return (
    <Modal
      open
      size="sm"
      title="Cancellation Request"
      titleClassName={titleClass}
      subtitle={subtitle(`${request.student} has requested to cancel your session`)}
      onClose={onClose}
      footer={
        <Footer>
          <ActionButton tone="keep" onClick={() => onResolve("declined")}>
            Keep Session
          </ActionButton>
          <ActionButton tone="danger" onClick={() => onResolve("approved")}>
            Approve Cancellation
          </ActionButton>
        </Footer>
      }
    >
      <Notice tone="danger" title="Cancellation Request">
        {request.student} has requested to cancel this session. Please review and decide.
      </Notice>
      <StudentCard request={request}>
        <Detail label="Session Details">
          <p className="text-base leading-6 font-semibold">{request.topic}</p>
          <p className="flex items-center gap-1.5 text-sm leading-5">
            <Clock aria-hidden className="size-4 text-slate-500" />
            {request.when}
          </p>
        </Detail>
        <Detail label="Student's Reason">&ldquo;{request.reason}&rdquo;</Detail>
      </StudentCard>
      <Notice tone="info" title="Note" icon={<CircleCheck aria-hidden className="size-4" />}>
        If you approve, the session will be cancelled. You can reschedule a new session with the student later.
      </Notice>
    </Modal>
  );
}

/* -------------------------------------------------------------------------- */
/* Reschedule (293:36909) and Cancel (293:37108 / 37169)                      */
/* -------------------------------------------------------------------------- */

function SessionSummary({ session, showTime }: { session: Session; showTime?: boolean }) {
  return (
    <div className="flex flex-col gap-1 rounded-[10px] border border-gray-200 bg-gray-50 p-4">
      <p className="text-sm leading-5 font-semibold text-slate-900">{session.topic}</p>
      <p className="text-sm leading-5 text-[#5d5d5d]">with {session.mentee}</p>
      {showTime && (
        <p className="flex items-center gap-1.5 text-sm leading-5 text-[#5d5d5d]">
          <Calendar aria-hidden className="size-4" />
          Current: {session.when}
        </p>
      )}
    </div>
  );
}

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

/** Month grid date picker; days before today are disabled. */
function DatePicker({ value, onChange }: { value: Date | null; onChange: (d: Date) => void }) {
  const today = startOfDay(new Date());
  const [month, setMonth] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const first = month.getDay();
  const days = Array.from({ length: 42 }, (_, i) => new Date(month.getFullYear(), month.getMonth(), i - first + 1));
  const label = month.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const shift = (n: number) => setMonth(new Date(month.getFullYear(), month.getMonth() + n, 1));
  const canGoBack = month > new Date(today.getFullYear(), today.getMonth(), 1);

  return (
    <div className="rounded-[10px] border border-gray-200 p-4">
      <div className="mb-3 flex items-center justify-between">
        <button
          type="button"
          aria-label="Previous month"
          disabled={!canGoBack}
          onClick={() => shift(-1)}
          className="grid size-8 place-items-center rounded-lg text-slate-700 hover:bg-gray-100 disabled:opacity-30"
        >
          <ChevronLeft aria-hidden className="size-4" />
        </button>
        <p className="text-sm leading-5 font-medium text-slate-900" aria-live="polite">
          {label}
        </p>
        <button
          type="button"
          aria-label="Next month"
          onClick={() => shift(1)}
          className="grid size-8 place-items-center rounded-lg text-slate-700 hover:bg-gray-100"
        >
          <ChevronRight aria-hidden className="size-4" />
        </button>
      </div>
      <div role="grid" aria-label={label} className="grid grid-cols-7 gap-y-1 text-center text-sm leading-5">
        {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
          <span key={d} role="columnheader" className="py-1 text-xs text-slate-500">
            {d}
          </span>
        ))}
        {days.map((d) => {
          const inMonth = d.getMonth() === month.getMonth();
          const past = d < today;
          const selected = value?.getTime() === d.getTime();
          const isToday = d.getTime() === today.getTime();
          return (
            <button
              key={d.toISOString()}
              type="button"
              role="gridcell"
              disabled={past || !inMonth}
              aria-selected={selected}
              aria-label={d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
              onClick={() => onChange(d)}
              className={cn(
                "mx-auto grid size-9 place-items-center rounded-lg",
                selected
                  ? "bg-primary font-semibold text-white"
                  : past || !inMonth
                    ? "text-slate-300"
                    : "font-medium text-slate-900 hover:bg-primary-soft",
                isToday && !selected && "border border-gray-300",
              )}
            >
              {d.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}

const fieldLabel = "text-sm leading-5 font-medium text-slate-900";

export function RescheduleModal({
  session,
  onClose,
  onSubmit,
}: {
  session: Session;
  onClose: () => void;
  onSubmit: (when: string) => void;
}) {
  const formId = useId();
  const [date, setDate] = useState<Date | null>(null);
  const [time, setTime] = useState("");
  const [error, setError] = useState("");

  return (
    <Modal
      open
      size="sm"
      title="Reschedule Session"
      titleClassName={titleClass}
      subtitle={subtitle(`Reschedule your session with ${session.mentee}`)}
      onClose={onClose}
      footer={
        <Footer>
          <ActionButton tone="plain" onClick={onClose}>
            Cancel
          </ActionButton>
          <ActionButton tone="primary" type="submit" form={formId}>
            Submit
          </ActionButton>
        </Footer>
      }
    >
      <form
        id={formId}
        className="flex flex-col gap-5"
        onSubmit={(e) => {
          e.preventDefault();
          if (!date) return setError("Choose a new date.");
          const day = date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
          onSubmit(`${day}, ${time}`);
        }}
      >
        <Notice tone="warning" title="Reschedule">
          This will reschedule the session and notify the mentee of the new time.
        </Notice>
        <SessionSummary session={session} showTime />
        <div className="flex flex-col gap-2">
          <label htmlFor={`${formId}-reason`} className={fieldLabel}>
            Reason for reschedule <span className="text-[#d72836]">*</span>
          </label>
          <textarea
            id={`${formId}-reason`}
            required
            rows={2}
            placeholder="Please explain why you need to reschedule..."
            className="rounded-lg border border-primary px-3 py-2 text-sm leading-5 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <div className="flex flex-col gap-2">
          <p className={fieldLabel}>New Date</p>
          <DatePicker
            value={date}
            onChange={(d) => {
              setDate(d);
              setError("");
            }}
          />
          {error && (
            <p role="alert" className="text-sm leading-5 text-[#d72836]">
              {error}
            </p>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor={`${formId}-time`} className={fieldLabel}>
            Time
          </label>
          <div className="relative">
            <select
              id={`${formId}-time`}
              required
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="h-10 w-full appearance-none rounded-lg border border-gray-300 bg-white px-3 pr-10 text-sm leading-5 text-slate-900"
            >
              <option value="">Choose a time slot</option>
              {timeSlots.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
            <ChevronDown
              aria-hidden
              className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-slate-500"
            />
          </div>
        </div>
      </form>
    </Modal>
  );
}

export function CancelModal({
  session,
  onClose,
  onSubmit,
}: {
  session: Session;
  onClose: () => void;
  onSubmit: () => void;
}) {
  const formId = useId();
  const [reason, setReason] = useState("");

  return (
    <Modal
      open
      size="sm"
      title="Cancel Session"
      titleClassName={titleClass}
      subtitle={subtitle(`Cancel your session with ${session.mentee}`)}
      onClose={onClose}
      footer={
        <Footer>
          <ActionButton tone="danger" type="submit" form={formId}>
            Submit
          </ActionButton>
        </Footer>
      }
    >
      <form
        id={formId}
        className="flex flex-col gap-5"
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit();
        }}
      >
        <Notice tone="danger" title="Cancellation">
          This will cancel the session and notify the mentee of the cancellation.
        </Notice>
        <SessionSummary session={session} />
        <fieldset className="flex flex-col gap-3">
          <legend className={cn(fieldLabel, "mb-3")}>
            Reason for cancellation <span className="text-[#d72836]">*</span>
          </legend>
          {cancelReasons.map((r) => (
            <label key={r} className="flex items-center gap-3 text-sm leading-5 text-slate-900">
              <input
                type="radio"
                name="reason"
                value={r}
                required
                checked={reason === r}
                onChange={() => setReason(r)}
                className="size-4 accent-primary"
              />
              {r}
            </label>
          ))}
          {reason === "Other" && (
            <>
              <label htmlFor={`${formId}-other`} className="sr-only">
                Your reason
              </label>
              <textarea
                id={`${formId}-other`}
                required
                rows={3}
                placeholder="Please specify your reason..."
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm leading-5 placeholder:text-slate-500 focus:border-primary focus:outline-none"
              />
            </>
          )}
        </fieldset>
      </form>
    </Modal>
  );
}
