"use client";

import { useState } from "react";
import { CircleCheck, CircleX, Search } from "lucide-react";
import { PersonCell, SelectMenu, StatusPill, tableClasses as t } from "./shared";
import type { JoinRequest, Member, MemberStatus } from "./data";

type StatusFilter = "all" | MemberStatus;

const statusOptions: { id: StatusFilter; label: string }[] = [
  { id: "all", label: "All Statuses" },
  { id: "active", label: "Active" },
  { id: "suspended", label: "Suspended" },
];

/** Members tab (Figma 293:33173): members table plus pending join requests. */
export function MembersTab({
  members,
  pending,
  onManage,
  onApprove,
  onReject,
}: {
  members: Member[];
  pending: JoinRequest[];
  onManage: (member: Member) => void;
  onApprove: (request: JoinRequest) => void;
  onReject: (request: JoinRequest) => void;
}) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");

  const q = query.trim().toLowerCase();
  const shown = members.filter(
    (m) =>
      (status === "all" || m.status === status) &&
      (!q || m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q)),
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl leading-7 font-bold text-gray-900">Communities Members</h2>
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-59.5">
            <Search
              aria-hidden
              className="pointer-events-none absolute top-1/2 left-3 size-4.5 -translate-y-1/2 text-gray-400"
            />
            <input
              type="search"
              aria-label="Search members"
              placeholder="Search members..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="h-10.5 w-full rounded-lg border border-gray-300 bg-white py-2 pr-4 pl-10 text-base text-gray-900 placeholder:text-[rgba(58,58,58,0.5)] focus:border-primary focus:outline-none"
            />
          </div>
          <SelectMenu label="Filter by status" options={statusOptions} value={status} onChange={setStatus} />
        </div>
      </div>

      <div className={t.wrap}>
        <table className={t.table}>
          <thead className={t.head}>
            <tr>
              <th className={`${t.th} py-5`}>Member</th>
              <th className={`${t.th} py-5`}>Join Date</th>
              <th className={`${t.th} py-5`}>Messages</th>
              <th className={`${t.th} py-5`}>Status</th>
              <th className={`${t.th} py-5`}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {shown.map((m) => (
              <tr key={m.id} className={t.row}>
                <td className={t.td}>
                  <PersonCell name={m.name} email={m.email} />
                </td>
                <td className={t.td}>{m.joined}</td>
                <td className={t.td}>{m.messages}</td>
                <td className={t.td}>
                  <div className="flex flex-wrap gap-1">
                    <StatusPill status={m.status}>{m.status === "suspended" ? "Suspended" : "active"}</StatusPill>
                    {m.muted && <StatusPill status="muted">muted</StatusPill>}
                  </div>
                </td>
                <td className={t.td}>
                  <button
                    type="button"
                    onClick={() => onManage(m)}
                    className="h-7 rounded-lg bg-purple-600 px-3 text-sm leading-5 font-medium text-white hover:bg-purple-700"
                  >
                    Manage
                  </button>
                </td>
              </tr>
            ))}
            {shown.length === 0 && (
              <tr className={t.row}>
                <td colSpan={5} className={`${t.td} py-10 text-center text-gray-500`}>
                  No members match your search.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <h3 className="bg-linear-to-r from-orange-50 to-amber-50 p-6 text-base leading-4 text-neutral-950">
        Pending Reviews
      </h3>

      <div className={t.wrap}>
        <table className={t.table}>
          <thead className={t.head}>
            <tr>
              <th className={`${t.th} py-5`}>Member</th>
              <th className={`${t.th} py-5`}>Request Sent</th>
              <th className={`${t.th} py-5`}>Program</th>
              <th className={`${t.th} w-51.25 py-5`}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {pending.map((r) => (
              <tr key={r.id} className={t.row}>
                <td className={t.td}>
                  <PersonCell name={r.name} email={r.email} />
                </td>
                <td className={t.td}>{r.requested}</td>
                <td className={t.td}>{r.program}</td>
                <td className={t.td}>
                  <div className="flex items-center gap-2.5 text-base leading-6 font-medium">
                    <button
                      type="button"
                      onClick={() => onReject(r)}
                      aria-label={`Reject ${r.name}`}
                      className="flex items-center gap-2 text-[#f44336] hover:underline"
                    >
                      <CircleX aria-hidden className="size-4" />
                      Reject
                    </button>
                    <button
                      type="button"
                      onClick={() => onApprove(r)}
                      aria-label={`Approve ${r.name}`}
                      className="flex items-center gap-2 text-success hover:underline"
                    >
                      <CircleCheck aria-hidden className="size-4" />
                      Approve
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {pending.length === 0 && (
              <tr className={t.row}>
                <td colSpan={4} className={`${t.td} py-10 text-center text-gray-500`}>
                  No pending requests.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
