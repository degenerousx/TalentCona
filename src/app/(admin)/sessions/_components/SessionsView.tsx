"use client";

import { useState } from "react";
import Link from "next/link";
import { Bell, Calendar, Clock } from "lucide-react";
import { cn } from "@/lib/cn";
import {
  pendingRequests,
  recentSessions,
  upcomingSessions,
  type Session,
  type SessionRequest,
} from "./data";
import {
  CancelModal,
  RequestModal,
  RescheduleModal,
  SuccessModal,
  type RequestOutcome,
} from "./SessionModals";

/** Mentorship Sessions page (Figma 293:35929). State is local until an API exists. */

type Dialog =
  | { kind: "reschedule" | "cancel"; session: Session }
  | { kind: "request"; request: SessionRequest }
  | { kind: "success"; message: string };

const requestTags: Record<SessionRequest["kind"], { label: string; className: string }> = {
  reschedule: { label: "Reschedule Request", className: "bg-blue-50 text-primary" },
  session: { label: "Session Request", className: "bg-[#e6fbf7] text-success" },
  cancellation: { label: "Cancellation Request", className: "bg-[#fff1f0] text-[#d72836]" },
};

const successMessages: Record<SessionRequest["kind"], Record<RequestOutcome, string>> = {
  reschedule: { approved: "Reschedule Approved Successfully !", declined: "Reschedule Declined Successfully !" },
  session: { approved: "Session Approved Successfully !", declined: "Session Declined Successfully !" },
  cancellation: {
    approved: "Cancellation Approved Successfully !",
    declined: "You Have Successfully Kept This Session !",
  },
};

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-[30px] rounded-[14px] border border-gray-200 bg-white p-6">
      <h2 className="text-base leading-4 text-slate-900">{title}</h2>
      {children}
    </section>
  );
}

function SessionRow({
  session,
  muted,
  children,
}: {
  session: Session;
  muted?: boolean;
  children?: React.ReactNode;
}) {
  const completed = session.status === "Completed";
  return (
    <li className={cn("flex flex-col gap-3 rounded-[10px] border border-gray-200 p-4", muted && "bg-gray-50")}>
      <div className="flex items-start gap-3">
        <span
          aria-hidden
          className="grid size-10 shrink-0 place-items-center rounded-full bg-[#ececf0] text-base text-slate-900"
        >
          {session.initials}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-base leading-6 text-slate-900">{session.mentee}</p>
          <p className="text-sm leading-5 text-slate-700">{session.topic}</p>
        </div>
        <span
          className={cn(
            "rounded-lg border px-2 py-0.5 text-xs leading-4",
            completed ? "border-gray-200 bg-[#eceef2] text-slate-900" : "border-success bg-[#b9f6ca] text-[#009624]",
          )}
        >
          {session.status}
        </span>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="flex items-center gap-2 text-sm leading-5 text-slate-700">
          {completed ? <Clock aria-hidden className="size-4" /> : <Calendar aria-hidden className="size-4" />}
          {session.when}
        </p>
        {children}
      </div>
    </li>
  );
}

const pill = "flex h-10 items-center justify-center rounded-lg border px-5 text-xs leading-5 sm:px-[30px]";

export function SessionsView() {
  const [upcoming, setUpcoming] = useState(upcomingSessions);
  const [requests, setRequests] = useState(pendingRequests);
  const [dialog, setDialog] = useState<Dialog | null>(null);
  const close = () => setDialog(null);
  const done = (message: string) => setDialog({ kind: "success", message });

  const resolve = (request: SessionRequest, outcome: RequestOutcome) => {
    setRequests((list) => list.filter((r) => r.id !== request.id));
    if (request.kind === "session" && outcome === "approved") {
      setUpcoming((list) => [
        ...list,
        {
          id: request.id,
          mentee: request.student,
          initials: request.student
            .split(" ")
            .map((w) => w[0])
            .join(""),
          topic: request.topic,
          when: request.date,
          status: "Confirmed",
        },
      ]);
    }
    done(successMessages[request.kind][outcome]);
  };

  return (
    <div className="flex flex-col gap-8">
      <Card title="Upcoming Sessions">
        {upcoming.length ? (
          <ul className="flex flex-col gap-4">
            {upcoming.map((s, i) => (
              <SessionRow key={s.id} session={s}>
                <div className="flex flex-wrap gap-3">
                  <Link
                    href={`/sessions/${s.id}/call`}
                    className={cn(
                      pill,
                      i === 0
                        ? "border-primary bg-primary text-white hover:bg-primary/90"
                        : "border-gray-300 bg-white text-heading hover:bg-gray-50",
                    )}
                  >
                    Join Session
                  </Link>
                  <button
                    type="button"
                    onClick={() => setDialog({ kind: "reschedule", session: s })}
                    className={cn(pill, "border-primary bg-white text-primary hover:bg-primary-soft")}
                  >
                    Reschedule
                  </button>
                  <button
                    type="button"
                    onClick={() => setDialog({ kind: "cancel", session: s })}
                    className={cn(pill, "border-[#d72836] bg-white text-[#d72836] hover:bg-red-50")}
                  >
                    Cancel
                  </button>
                </div>
              </SessionRow>
            ))}
          </ul>
        ) : (
          <p className="text-center text-sm leading-5 text-slate-500">No upcoming sessions.</p>
        )}
      </Card>

      {requests.length > 0 && (
        <section className="flex flex-col gap-4 rounded-[14px] border-[1.6px] border-[#ffc107] bg-[#fff4d1] p-6">
          <h2 className="flex items-center gap-2 text-lg leading-[27px] font-semibold text-[#c1610e]">
            <Bell aria-hidden className="size-5" />
            Pending Requests ({requests.length})
          </h2>
          <ul className="flex flex-col gap-4">
            {requests.map((r) => {
              const tag = requestTags[r.kind];
              return (
                <li
                  key={r.id}
                  className="flex flex-wrap items-start justify-between gap-3 rounded-[10px] border border-[#fde6d2] bg-white p-4"
                >
                  <div className="flex flex-col gap-1">
                    <span className={cn("self-start rounded px-2 py-1 text-xs leading-4 font-semibold", tag.className)}>
                      {tag.label}
                    </span>
                    <p className="text-base leading-6 font-semibold text-slate-900">{r.topic}</p>
                    <p className="text-sm leading-[21px] text-[#5d5d5d]">With {r.student}</p>
                    {r.kind === "reschedule" && (
                      <p className="text-sm leading-[21px] text-[#5d5d5d]">
                        New time: {r.proposedDate} at {r.proposedTime}
                      </p>
                    )}
                    {r.kind === "session" && (
                      <p className="text-sm leading-[21px] text-[#5d5d5d]">Requested time: {r.date}</p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setDialog({ kind: "request", request: r })}
                    className="h-[37px] rounded-lg bg-[#ffc107] px-6 text-xs leading-[21px] font-semibold text-white hover:bg-[#ffc107]/90"
                  >
                    Review Request<span className="sr-only">: {tag.label.toLowerCase()} from {r.student}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <Card title="Recent Sessions">
        <ul className="flex flex-col gap-4">
          {recentSessions.map((s) => (
            <SessionRow key={s.id} session={s} muted />
          ))}
        </ul>
      </Card>

      {dialog?.kind === "reschedule" && (
        <RescheduleModal
          session={dialog.session}
          onClose={close}
          onSubmit={(when) => {
            setUpcoming((list) => list.map((x) => (x.id === dialog.session.id ? { ...x, when } : x)));
            done("Rescheduled Saved Successfully !");
          }}
        />
      )}
      {dialog?.kind === "cancel" && (
        <CancelModal
          session={dialog.session}
          onClose={close}
          onSubmit={() => {
            setUpcoming((list) => list.filter((x) => x.id !== dialog.session.id));
            done("Cancellation Saved Successfully !");
          }}
        />
      )}
      {dialog?.kind === "request" && (
        <RequestModal
          request={dialog.request}
          onClose={close}
          onResolve={(outcome) => resolve(dialog.request, outcome)}
        />
      )}
      {dialog?.kind === "success" && <SuccessModal message={dialog.message} onClose={close} />}
    </div>
  );
}
