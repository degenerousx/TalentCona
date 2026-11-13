"use client";

import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { Bell, Check, ChevronDown, ChevronRight, Clock, Download, Filter, Landmark, Search, Settings, Users } from "lucide-react";
import { toast } from "sonner";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/shadcn/popover";
import { Toaster } from "@/components/shadcn/sonner";
import { Card } from "@/components/ui/Card";
import { ErrorState, LoadingState } from "@/components/ui/States";
import { downloadCsv } from "@/lib/csv";
import { cn } from "@/lib/cn";
import { useCan } from "@/lib/permissions";
import { fetchForExport, useAdminActivity, useAuditLog, useRecentEvents } from "./api";
import { ACTOR_ROLES, LOG_TYPES, MODULES, initials, when, type AuditEvent, type LogType } from "./model";

const ROWS = 20;
/** While filtering, older events are loaded until a page is full or this many pages are in. */
const MAX_FILTER_PAGES = 10;

const TYPE_TONE: Record<LogType, string> = {
  Change: "bg-indigo-50 text-indigo-600",
  Critical: "bg-red-50 text-red-600",
  Access: "bg-slate-100 text-slate-600",
  Security: "bg-amber-50 text-amber-700",
  Approval: "bg-green-50 text-green-700",
};

const fmt = (n: number) => n.toLocaleString("en-US");

function agoShort(ms: number) {
  if (!ms) return "";
  const s = Math.round((Date.now() - ms) / 1000);
  if (s < 45) return "just now";
  const m = Math.round(s / 60);
  return m < 60 ? `${m} min ago` : `${Math.round(m / 60)} h ago`;
}

type Filters = { search: string; role: string; module: string; types: LogType[]; from: string; to: string };
const EMPTY: Filters = { search: "", role: "", module: "", types: [], from: "", to: "" };

function matches(e: AuditEvent, f: Filters) {
  const q = f.search.trim().toLowerCase();
  if (q && !`${e.actorName} ${e.activity} ${e.action} ${e.target} ${e.ref} ${e.id} ${e.module}`.toLowerCase().includes(q)) return false;
  if (f.role && e.actorRole !== f.role) return false;
  if (f.module && e.module !== f.module) return false;
  if (f.types.length && !f.types.includes(e.type)) return false;
  if (f.from && (!e.at || new Date(e.at) < new Date(`${f.from}T00:00:00`))) return false;
  if (f.to && (!e.at || new Date(e.at) > new Date(`${f.to}T23:59:59.999`))) return false;
  return true;
}

function StatCard({ icon, tone, label, value, caption, captionTone }: { icon: React.ReactNode; tone: string; label: string; value: string; caption: string; captionTone?: string }) {
  return (
    <Card tone="hairline" className="flex flex-col gap-1 p-4">
      <span className={cn("mb-3 grid size-8 place-items-center rounded-md", tone)}>{icon}</span>
      <p className="text-xs leading-4 text-slate-600">{label}</p>
      <p className="text-xl leading-7 font-semibold text-heading">{value}</p>
      <p className={cn("text-[11px] leading-4 text-slate-500", captionTone)}>{caption}</p>
    </Card>
  );
}

function Box({ title, tone, children }: { title: string; tone: "before" | "after" | "session"; children: React.ReactNode }) {
  return (
    <div
      className={cn(
        "min-h-[72px] rounded-md border bg-white px-3 py-3",
        tone === "before" ? "border-red-300" : tone === "after" ? "border-green-300" : "border-slate-200",
      )}
    >
      <p
        className={cn(
          "mb-1.5 text-[10px] leading-3",
          tone === "before" ? "font-semibold text-red-600" : tone === "after" ? "font-semibold text-green-700" : "text-slate-500",
        )}
      >
        {title}
      </p>
      {children}
    </div>
  );
}

function MoreFilters({ value, onChange }: { value: Filters; onChange: (f: Filters) => void }) {
  const [open, setOpen] = useState(false);
  const count = (value.types.length ? 1 : 0) + (value.from || value.to ? 1 : 0);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="flex h-9 w-full shrink-0 items-center justify-center gap-2 rounded-md border border-gray-200 bg-white px-3 text-xs font-medium text-slate-900 hover:bg-slate-50 sm:w-auto"
        >
          <Filter aria-hidden className="size-3.5" />
          More filters
          {count > 0 && <span className="grid size-4 place-items-center rounded-full bg-primary text-[10px] text-white">{count}</span>}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72 p-3">
        <p className="mb-2 text-xs font-semibold text-slate-900">Type</p>
        <div className="mb-3 flex flex-wrap gap-1.5" role="group" aria-label="Type">
          {LOG_TYPES.map((t) => {
            const on = value.types.includes(t);
            return (
              <button
                key={t}
                type="button"
                aria-pressed={on}
                onClick={() => onChange({ ...value, types: on ? value.types.filter((x) => x !== t) : [...value.types, t] })}
                className={cn("flex items-center gap-1 rounded-full px-2.5 py-1 text-xs", on ? TYPE_TONE[t] + " ring-1 ring-current" : "bg-slate-50 text-slate-600 hover:bg-slate-100")}
              >
                {on && <Check aria-hidden className="size-3" />}
                {t}
              </button>
            );
          })}
        </div>
        <p className="mb-2 text-xs font-semibold text-slate-900">Date</p>
        <div className="mb-3 grid grid-cols-2 gap-2">
          <label className="flex flex-col gap-1 text-[11px] text-slate-500">
            From
            <input type="date" value={value.from} onChange={(e) => onChange({ ...value, from: e.target.value })} className="h-8 rounded-md border border-gray-200 px-2 text-xs text-slate-900" />
          </label>
          <label className="flex flex-col gap-1 text-[11px] text-slate-500">
            To
            <input type="date" value={value.to} onChange={(e) => onChange({ ...value, to: e.target.value })} className="h-8 rounded-md border border-gray-200 px-2 text-xs text-slate-900" />
          </label>
        </div>
        <div className="flex justify-between">
          <button type="button" onClick={() => onChange({ ...value, types: [], from: "", to: "" })} className="text-xs font-medium text-slate-600 hover:underline">
            Clear
          </button>
          <button type="button" onClick={() => setOpen(false)} className="h-7 rounded-md bg-primary px-3 text-xs font-medium text-white">
            Done
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

const select = "h-9 rounded-md border border-gray-200 bg-white px-2.5 text-xs text-slate-900 focus:border-primary focus:outline-none";

/** Audit & System Logs, from the design: stats, security banner, and the platform activity log. */
export function AuditLogsView() {
  const canSeeAdmins = useCan("MANAGE_ADMINS");
  const log = useAuditLog();
  const recent = useRecentEvents();
  const admins = useAdminActivity(canSeeAdmins);
  const [filters, setFilters] = useState<Filters>(EMPTY);
  const [page, setPage] = useState(0);
  const [open, setOpen] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const tableRef = useRef<HTMLDivElement>(null);

  const loaded = useMemo(() => {
    const seen = new Set<string>();
    return (log.data?.pages.flatMap((p) => p.items) ?? []).filter((e) => !seen.has(e.id) && seen.add(e.id));
  }, [log.data]);
  const filtered = useMemo(() => loaded.filter((e) => matches(e, filters)), [loaded, filters]);
  const filtering = JSON.stringify(filters) !== JSON.stringify(EMPTY);
  const pages = Math.max(1, Math.ceil(filtered.length / ROWS));
  const current = Math.min(page, pages - 1);
  const rows = filtered.slice(current * ROWS, current * ROWS + ROWS);
  const canNext = current < pages - 1 || !!log.hasNextPage;
  const loadedPages = log.data?.pages.length ?? 0;

  // The API can't search or filter by role/module, so while a filter is on keep
  // reading older events until this page is full (or MAX_FILTER_PAGES are loaded).
  const { hasNextPage, isFetchingNextPage, fetchNextPage } = log;
  useEffect(() => {
    if (filtering && filtered.length < (current + 1) * ROWS && hasNextPage && !isFetchingNextPage && loadedPages < MAX_FILTER_PAGES)
      void fetchNextPage();
  }, [filtering, filtered.length, current, hasNextPage, isFetchingNextPage, loadedPages, fetchNextPage]);
  const setF = (f: Filters) => {
    setFilters(f);
    setPage(0);
    setOpen(null);
  };

  const next = async () => {
    if (current < pages - 1) return setPage(current + 1);
    if (!log.hasNextPage) return;
    const before = filtered.length;
    const res = await log.fetchNextPage();
    const after = (res.data?.pages.flatMap((p) => p.items) ?? []).filter((e) => matches(e, filters)).length;
    if (after > before) setPage(current + 1);
  };

  // ---- stats (last 24 hours / today) ----
  const r = recent.data;
  const today = r ? r.events.filter((e) => e.at && new Date(e.at).getTime() >= r.startOfToday) : [];
  const day = r ? r.events.filter((e) => e.at && new Date(e.at).getTime() >= r.since) : [];
  const adminChanges = today.filter((e) => e.actorRole === "Admin" && e.type !== "Access" && e.type !== "Security");
  const highImpact = adminChanges.filter((e) => e.type === "Critical").length;
  const security = day.filter((e) => e.type === "Security");
  const critical = day.filter((e) => e.type === "Critical");
  const attention = security.length + critical.length;
  const loadingStat = recent.isPending ? "…" : recent.isError ? "—" : null;

  const review = () => {
    setF({ ...EMPTY, types: ["Security", "Critical"] });
    tableRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const exportLog = async () => {
    setExporting(true);
    try {
      const all = (await fetchForExport()).filter((e) => matches(e, filters));
      if (!all.length) return void toast.info("Nothing to export for these filters.");
      downloadCsv(
        `audit-log-${new Date().toISOString().slice(0, 10)}.csv`,
        all.map((e) => ({
          "Log ID": e.ref,
          Date: e.at ?? "",
          Actor: e.actorName,
          Role: e.actorRole,
          Activity: e.activity,
          Action: e.action,
          Module: e.module,
          Target: e.target,
          Type: e.type,
          Before: e.before ?? "",
          After: e.after ?? "",
          Device: e.device ?? "",
          IP: e.ip ?? "",
        })),
      );
      toast.success(`Exported ${fmt(all.length)} events`);
    } catch (e) {
      toast.error(`Couldn't export: ${e instanceof Error ? e.message : "try again"}`);
    } finally {
      setExporting(false);
    }
  };

  return (
    // min-w-0: inside the flex shell the wide table would otherwise widen the page; it scrolls in its card instead.
    <div className="mx-auto flex w-full max-w-[1100px] min-w-0 flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-primary-soft px-2 py-0.5 text-[10px] leading-4 font-semibold tracking-wide text-primary uppercase">Super admin only</span>
            <span className="flex items-center gap-1 text-[11px] leading-4 text-slate-500">
              <Check aria-hidden className="size-3 text-green-600" /> Immutable activity record
            </span>
          </div>
          <h1 className="text-[28px] leading-[1.3] font-bold text-heading">Audit &amp; System Logs</h1>
          <p className="text-sm leading-5 text-slate-900">Monitor platform activity, administrative changes, and security events</p>
        </div>
        <button
          type="button"
          onClick={() => void exportLog()}
          disabled={exporting}
          className="flex h-10 items-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-white shadow-sm hover:bg-primary/90 disabled:opacity-70"
        >
          <Download aria-hidden className="size-4" />
          {exporting ? "Exporting…" : "Export audit log"}
        </button>
      </div>

      <section aria-label="Summary" className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<Clock aria-hidden className="size-4 text-indigo-600" />}
          tone="bg-indigo-50"
          label="Events today"
          value={loadingStat ?? `${fmt(today.length)}${r?.capped ? "+" : ""}`}
          caption="Across all platform modules"
        />
        <StatCard
          icon={<Users aria-hidden className="size-4 text-indigo-600" />}
          tone="bg-indigo-50"
          label="Active administrators"
          value={!canSeeAdmins ? "—" : admins.data ? fmt(admins.data.active) : admins.isError ? "—" : "…"}
          caption={!canSeeAdmins ? "Needs the Manage Admins privilege" : admins.data ? `${admins.data.today} signed in today` : " "}
        />
        <StatCard
          icon={<Settings aria-hidden className="size-4 text-indigo-600" />}
          tone="bg-indigo-50"
          label="Admin changes"
          value={loadingStat ?? fmt(adminChanges.length)}
          caption={`${highImpact} high-impact ${highImpact === 1 ? "change" : "changes"} today`}
        />
        <StatCard
          icon={<Landmark aria-hidden className="size-4 text-red-600" />}
          tone="bg-red-50"
          label="Security events"
          value={loadingStat ?? fmt(security.length)}
          caption={attention ? `${attention} require attention (24h)` : "Nothing needs attention"}
          captionTone={attention ? "text-red-600" : undefined}
        />
      </section>

      {attention > 0 && (
        <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50/60 px-4 py-3">
          <div className="flex items-start gap-3">
            <span className="grid size-8 shrink-0 place-items-center rounded-md bg-red-100">
              <Bell aria-hidden className="size-4 text-red-600" />
            </span>
            <div>
              <p className="flex flex-wrap items-center gap-2 text-sm font-semibold text-heading">
                {attention} security {attention === 1 ? "event needs" : "events need"} review
                <span className="rounded-full bg-red-600 px-1.5 py-0.5 text-[9px] leading-3 font-semibold text-white">Attention</span>
              </p>
              <p className="text-xs leading-4 text-slate-700">
                {[critical.length ? `${critical.length} high-impact ${critical.length === 1 ? "change was" : "changes were"} made (e.g. ${critical[0].activity.toLowerCase()})` : null, security.length ? `${security.length} security ${security.length === 1 ? "event was" : "events were"} recorded (e.g. ${security[0].activity.toLowerCase()})` : null]
                  .filter(Boolean)
                  .join(" and ")}{" "}
                in the last 24 hours.
              </p>
            </div>
          </div>
          <button type="button" onClick={review} className="h-8 rounded-md border border-red-300 bg-white px-3 text-xs font-medium text-red-600 hover:bg-red-50">
            Review security events
          </button>
        </div>
      )}

      <div ref={tableRef} className="scroll-mt-4">
        <Card tone="hairline" className="overflow-hidden">
          <div className="flex flex-wrap items-start justify-between gap-2 border-b border-slate-100 px-4 py-4">
            <div>
              <h2 className="text-base leading-6 font-semibold text-heading">Platform activity</h2>
              <p className="text-xs leading-4 text-slate-600">A complete record of actions performed by admins, users, and the system</p>
            </div>
            <p className="flex items-center gap-1.5 text-[10px] leading-4 text-slate-500" aria-live="polite">
              <span className={cn("size-1.5 rounded-full", log.isError ? "bg-red-500" : "bg-green-500")} aria-hidden />
              {log.isError ? "Connection lost" : "Live monitoring"}
              <span aria-hidden>·</span>
              Last updated {agoShort(log.dataUpdatedAt) || "…"}
            </p>
          </div>

          <div className="flex flex-col gap-2 border-b border-slate-100 px-4 py-4 sm:flex-row">
            <label className="relative flex-1">
              <span className="sr-only">Search audit log</span>
              <Search aria-hidden className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-slate-400" />
              <input
                value={filters.search}
                onChange={(e) => setF({ ...filters, search: e.target.value })}
                placeholder="Search actor, action, target, or log ID…"
                className="h-9 w-full rounded-md border border-gray-200 bg-white pr-3 pl-8 text-xs text-slate-900 placeholder:text-slate-400 focus:border-primary focus:outline-none"
              />
            </label>
            <div className="grid grid-cols-2 gap-2 sm:flex">
              <select aria-label="Users" value={filters.role} onChange={(e) => setF({ ...filters, role: e.target.value })} className={cn(select, "w-full sm:w-32")}>
                <option value="">All users</option>
                {ACTOR_ROLES.map((r) => (
                  <option key={r}>{r}</option>
                ))}
              </select>
              <select aria-label="Modules" value={filters.module} onChange={(e) => setF({ ...filters, module: e.target.value })} className={cn(select, "w-full sm:w-36")}>
                <option value="">All modules</option>
                {MODULES.map((m) => (
                  <option key={m}>{m}</option>
                ))}
              </select>
              <div className="col-span-2 sm:col-span-1">
                <MoreFilters value={filters} onChange={setF} />
              </div>
            </div>
          </div>

          {log.isPending ? (
            <div className="p-4">
              <LoadingState rows={6} label="Loading activity…" />
            </div>
          ) : log.isError && !loaded.length ? (
            <div className="p-4">
              <ErrorState error={log.error} title="Couldn't load the audit log" onRetry={() => void log.refetch()} retrying={log.isFetching} />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[880px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-slate-100 text-[10px] leading-4 tracking-wide text-slate-500 uppercase">
                    <th className="px-4 py-3 font-normal">Actor</th>
                    <th className="px-3 py-3 font-normal">Activity</th>
                    <th className="px-3 py-3 font-normal">Module</th>
                    <th className="px-3 py-3 font-normal">Target</th>
                    <th className="px-3 py-3 font-normal">Date &amp; time</th>
                    <th className="px-3 py-3 font-normal">Type</th>
                    <th className="w-8 px-3 py-3">
                      <span className="sr-only">Details</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-4 py-10 text-center text-sm text-slate-500">
                        {filtering ? "No events match these filters." : "No activity has been recorded yet."}
                      </td>
                    </tr>
                  )}
                  {rows.map((e) => {
                    const isOpen = open === e.id;
                    return (
                      <Fragment key={e.id}>
                        <tr
                          className={cn("cursor-pointer border-b border-slate-100 text-xs hover:bg-slate-50/70", isOpen && "bg-slate-50/70")}
                          onClick={() => setOpen(isOpen ? null : e.id)}
                        >
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2.5">
                              <span aria-hidden className="grid size-7 shrink-0 place-items-center rounded-full bg-primary-soft text-[10px] font-semibold text-primary">
                                {e.actorRole === "System" ? "SY" : initials(e.actorName)}
                              </span>
                              <div className="min-w-0">
                                <p className="truncate font-medium text-slate-900">{e.actorName}</p>
                                <p className="text-[10px] leading-3 text-slate-500">{e.actorRole}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-3 py-3">
                            <button
                              type="button"
                              aria-expanded={isOpen}
                              onClick={(ev) => {
                                ev.stopPropagation();
                                setOpen(isOpen ? null : e.id);
                              }}
                              className="text-left font-medium text-primary hover:underline"
                            >
                              {e.activity}
                            </button>
                            <p className="font-mono text-[9px] leading-3 text-slate-400">{e.ref}</p>
                          </td>
                          <td className="px-3 py-3 text-primary">{e.module}</td>
                          <td className="max-w-[180px] px-3 py-3 text-primary">{e.target}</td>
                          <td className="px-3 py-3 whitespace-nowrap">
                            <p className="text-slate-900">{when(e.at)}</p>
                            {e.ip && <p className="text-[10px] leading-3 text-slate-400">{e.ip}</p>}
                          </td>
                          <td className="px-3 py-3">
                            <span className={cn("rounded-full px-2 py-0.5 text-[10px] leading-4 font-medium", TYPE_TONE[e.type])}>{e.type}</span>
                          </td>
                          <td className="px-3 py-3 text-slate-400">
                            {isOpen ? <ChevronDown aria-hidden className="size-4" /> : <ChevronRight aria-hidden className="size-4" />}
                          </td>
                        </tr>
                        {isOpen && (
                          <tr className="border-b border-slate-100 bg-slate-50/40">
                            <td colSpan={7} className="px-4 py-4">
                              <div className="grid gap-3 md:grid-cols-[1fr_1fr_minmax(0,180px)]">
                                <Box title="BEFORE" tone="before">
                                  <p className="text-xs text-slate-800">{e.before ?? "—"}</p>
                                </Box>
                                <Box title="AFTER" tone="after">
                                  <p className="text-xs text-slate-800">{e.after ?? (e.type === "Access" ? "Record viewed" : "—")}</p>
                                </Box>
                                <Box title="Session context" tone="session">
                                  <p className="text-xs text-primary">{e.device ?? "Unknown device"}</p>
                                  <p className="font-mono text-[10px] text-slate-500">{e.ip ?? "IP not recorded"}</p>
                                </Box>
                              </div>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
            <p className="text-[11px] leading-4 text-slate-500">
              {filtered.length
                ? `Showing ${fmt(current * ROWS + 1)}–${fmt(current * ROWS + rows.length)} of ${fmt(filtered.length)}${log.hasNextPage ? "+" : ""} events`
                : "Showing 0 events"}
              {filtering && log.hasNextPage ? ` · searched the newest ${fmt(loaded.length)}; Next loads older events` : ""}
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={current === 0}
                onClick={() => setPage(current - 1)}
                className="h-8 rounded-md border border-gray-200 px-3 text-xs font-medium text-slate-900 disabled:text-slate-400"
              >
                Previous
              </button>
              <button
                type="button"
                disabled={!canNext || log.isFetchingNextPage}
                onClick={() => void next()}
                className="h-8 rounded-md border border-gray-200 px-3 text-xs font-semibold text-slate-900 disabled:font-medium disabled:text-slate-400"
              >
                {log.isFetchingNextPage ? "Loading…" : "Next"}
              </button>
            </div>
          </div>
        </Card>
      </div>
      <Toaster />
    </div>
  );
}
