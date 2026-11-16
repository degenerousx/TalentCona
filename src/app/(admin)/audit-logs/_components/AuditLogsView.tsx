"use client";

import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { Bell, Check, ChevronDown, ChevronRight, Clock, Download, Landmark, ListFilter, Search, Settings, Users } from "lucide-react";
import { toast } from "sonner";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/shadcn/popover";
import { Toaster } from "@/components/shadcn/sonner";
import { Card } from "@/components/ui/Card";
import { ErrorState, LoadingState } from "@/components/ui/States";
import { downloadCsv } from "@/lib/csv";
import { cn } from "@/lib/cn";
import { useCan } from "@/lib/permissions";
import { RANGES, fetchForCsv, requestExport, useAdminActivity, useAuditLog, useAuditSummary, useRecentSecurity, type Range, type ServerFilters } from "./api";
import { LOG_TYPES, MODULES, USER_TYPES, initials, when, type AuditEvent, type LogType } from "./model";

const ROWS = 20;
/** While filtering by user type or module (not backend filters), older events are loaded until a page is full or this many pages are in. */
const MAX_FILTER_PAGES = 10;

// Pill colours measured from the mockup.
const TYPE_TONE: Record<LogType, string> = {
  Change: "bg-[#EEF0FF] text-[#4F46E5]",
  Critical: "bg-[#FFE4E6] text-[#E11D48]",
  Access: "bg-slate-100 text-slate-600",
  Security: "bg-[#FFEDD5] text-[#C2410C]",
  Approval: "bg-[#DCFCE7] text-[#15803D]",
};

const fmt = (n: number) => n.toLocaleString("en-US");

function agoShort(ms: number) {
  if (!ms) return "";
  const s = Math.round((Date.now() - ms) / 1000);
  if (s < 45) return "just now";
  const m = Math.round(s / 60);
  return m < 60 ? `${m} min ago` : `${Math.round(m / 60)} h ago`;
}

type Filters = { search: string; role: string; module: string; types: LogType[]; range: Range; from: string; to: string };
/** The backend's default range is the last 7 days. */
const EMPTY: Filters = { search: "", role: "", module: "", types: [], range: "7d", from: "", to: "" };

/** User type and module aren't backend filters: applied to the loaded events. */
function matches(e: AuditEvent, f: Filters) {
  if (f.role && e.actorRole !== f.role) return false;
  if (f.module && e.module !== f.module) return false;
  return true;
}

/** Search waits for a pause in typing before asking the backend. */
function useDebounced<T>(value: T, ms = 350) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

/** Stat card: 180px tall, 20px padding, 40px icon tile, 14px label, 24px value, 13px caption (mockup ÷ 0.732). */
function StatCard({ icon, tone, label, value, caption, captionTone }: { icon: React.ReactNode; tone: string; label: string; value: string; caption: string; captionTone?: string }) {
  return (
    <Card tone="hairline" className="flex min-h-[180px] flex-col p-5">
      <span className={cn("grid size-10 place-items-center rounded-lg", tone)}>{icon}</span>
      <p className="mt-[18px] text-sm leading-5 text-slate-600">{label}</p>
      <p className="mt-2 text-2xl leading-8 font-bold text-heading">{value}</p>
      <p className={cn("mt-1 text-[13px] leading-[18px] text-slate-500", captionTone)}>{caption}</p>
    </Card>
  );
}

/** Before / After / Session context box: 101px tall. */
function Box({ title, tone, children }: { title: string; tone: "before" | "after" | "session"; children: React.ReactNode }) {
  return (
    <div
      className={cn(
        "min-h-[101px] rounded-md border bg-white px-4 py-4",
        tone === "before" ? "border-[#FCA5A5]" : tone === "after" ? "border-[#86EFAC]" : "border-slate-200",
      )}
    >
      <p
        className={cn(
          "text-xs leading-4",
          tone === "before" ? "font-semibold tracking-wide text-[#DC2626]" : tone === "after" ? "font-semibold tracking-wide text-[#15803D]" : "text-slate-500",
        )}
      >
        {title}
      </p>
      <div className="mt-2.5">{children}</div>
    </div>
  );
}

function MoreFilters({ value, onChange }: { value: Filters; onChange: (f: Filters) => void }) {
  const [open, setOpen] = useState(false);
  const count = (value.types.length ? 1 : 0) + (value.range !== EMPTY.range ? 1 : 0);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="flex h-[42px] w-full shrink-0 items-center justify-center gap-2 rounded-md border border-gray-300 bg-white px-4 text-sm text-slate-900 hover:bg-slate-50 whitespace-nowrap sm:w-[134px]"
        >
          <ListFilter aria-hidden className="size-4" />
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
        <div className="mb-3 flex flex-wrap gap-1.5" role="radiogroup" aria-label="Date range">
          {RANGES.map((r) => (
            <button
              key={r.id}
              type="button"
              role="radio"
              aria-checked={value.range === r.id}
              onClick={() => onChange({ ...value, range: r.id })}
              className={cn(
                "rounded-full px-2.5 py-1 text-xs",
                value.range === r.id ? "bg-primary text-white" : "bg-slate-50 text-slate-600 hover:bg-slate-100",
              )}
            >
              {r.label}
            </button>
          ))}
        </div>
        {value.range === "custom" && (
          <div className="mb-3 grid grid-cols-2 gap-2">
            <label className="flex flex-col gap-1 text-[11px] text-slate-500">
              From
              <input
                type="date"
                value={value.from}
                max={value.to || undefined}
                onChange={(e) => onChange({ ...value, from: e.target.value })}
                className="h-8 rounded-md border border-gray-200 px-2 text-xs text-slate-900"
              />
            </label>
            <label className="flex flex-col gap-1 text-[11px] text-slate-500">
              To
              <input
                type="date"
                value={value.to}
                min={value.from || undefined}
                onChange={(e) => onChange({ ...value, to: e.target.value })}
                className="h-8 rounded-md border border-gray-200 px-2 text-xs text-slate-900"
              />
            </label>
          </div>
        )}
        <div className="flex justify-between">
          <button type="button" onClick={() => onChange({ ...value, types: [], range: EMPTY.range, from: "", to: "" })} className="text-xs font-medium text-slate-600 hover:underline">
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

const select = "h-[42px] rounded-md border border-gray-300 bg-white px-3 text-sm text-slate-900 focus:border-primary focus:outline-none";

/** Audit & System Logs, from the design: stats, security banner, and the platform activity log. */
export function AuditLogsView() {
  const canSeeAdmins = useCan("MANAGE_ADMINS");
  const [filters, setFilters] = useState<Filters>(EMPTY);
  const search = useDebounced(filters.search);
  // Custom range waits for both dates.
  const customReady = filters.range !== "custom" || (!!filters.from && !!filters.to);
  const server: ServerFilters = useMemo(
    () => ({ search, categories: filters.types, range: customReady ? filters.range : EMPTY.range, from: filters.from, to: filters.to }),
    [search, filters.types, filters.range, filters.from, filters.to, customReady],
  );
  const log = useAuditLog(server);
  const summary = useAuditSummary();
  const security = summary.data?.securityEvents ?? 0;
  const recentSecurity = useRecentSecurity(security > 0);
  const admins = useAdminActivity(canSeeAdmins);
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
  /** Filters the backend doesn't apply (user type, module). */
  const localFiltering = !!filters.role || !!filters.module;
  const rangePhrase = RANGES.find((r) => r.id === server.range)?.phrase ?? "";
  const pages = Math.max(1, Math.ceil(filtered.length / ROWS));
  const current = Math.min(page, pages - 1);
  const rows = filtered.slice(current * ROWS, current * ROWS + ROWS);
  const canNext = current < pages - 1 || !!log.hasNextPage;
  const loadedPages = log.data?.pages.length ?? 0;

  // User type / module aren't backend filters, so while one is on keep
  // reading older events until this page is full (or MAX_FILTER_PAGES are loaded).
  const { hasNextPage, isFetchingNextPage, fetchNextPage } = log;
  useEffect(() => {
    if (localFiltering && filtered.length < (current + 1) * ROWS && hasNextPage && !isFetchingNextPage && loadedPages < MAX_FILTER_PAGES)
      void fetchNextPage();
  }, [localFiltering, filtered.length, current, hasNextPage, isFetchingNextPage, loadedPages, fetchNextPage]);
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

  // ---- stats: GET /audit/logs/summary?range=1d ----
  const s = summary.data;
  const loadingStat = summary.isPending ? "…" : summary.isError ? "—" : null;
  // "Mfa failed and password reset requested in the last 24 hours." (from the events themselves)
  // Lower-case only each phrase's first letter, so acronyms (MFA, OTP) survive.
  const kinds = [...new Set((recentSecurity.data ?? []).map((e) => e.activity.replace(/^./, (c) => c.toLowerCase())))].slice(0, 2);
  const bannerText = kinds.length ? `${kinds.join(" and ").replace(/^./, (c) => c.toUpperCase())} in the last 24 hours.` : "Recorded in the last 24 hours.";

  const review = () => {
    setF({ ...EMPTY, types: ["Security"], range: "1d" });
    tableRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  /** Same filters as the table, as a CSV made in the browser. */
  const downloadCsvNow = async () => {
    try {
      const all = (await fetchForCsv(server)).filter((e) => matches(e, filters));
      if (!all.length) return void toast.info("Nothing to export for these filters.");
      downloadCsv(
        `audit-log-${new Date().toISOString().slice(0, 10)}.csv`,
        all.map((e) => ({
          "Log ID": e.ref,
          Date: e.at ?? "",
          Actor: e.actorName,
          "User type": e.actorRole,
          Email: e.actorEmail ?? "",
          Activity: e.activity,
          Action: e.action,
          Module: e.module,
          Target: e.target,
          Type: e.type,
          Categories: e.categories.join(", "),
          Details: e.details.map((d) => `${d.label}: ${d.value}`).join("; "),
          Before: e.before ?? "",
          After: e.after ?? "",
          Device: e.device ?? "",
          IP: e.ip ?? "",
        })),
      );
      toast.success(`Downloaded ${fmt(all.length)} events`);
    } catch (e) {
      toast.error(`Couldn't download: ${e instanceof Error ? e.message : "try again"}`);
    }
  };

  /** POST /audit/logs/export with the table's filters: the backend prepares the export. */
  const exportLog = async () => {
    setExporting(true);
    try {
      const { jobId } = await requestExport(server);
      toast.success("Export requested", {
        description: `Reference ${jobId}. The backend is preparing the audit log with your current filters.`,
        action: { label: "Download CSV now", onClick: () => void downloadCsvNow() },
        duration: 12_000,
      });
    } catch (e) {
      toast.error(`Couldn't start the export: ${e instanceof Error ? e.message : "try again"}`, {
        action: { label: "Download CSV", onClick: () => void downloadCsvNow() },
      });
    } finally {
      setExporting(false);
    }
  };

  return (
    // min-w-0: inside the flex shell the wide table would otherwise widen the page; it scrolls in its card instead.
    <div className="mx-auto flex w-full max-w-[1136px] min-w-0 flex-col gap-7">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-[#F3E8FF] px-2.5 py-0.5 text-[11px] leading-4 font-semibold tracking-wide text-[#5B21B6] uppercase">Super admin only</span>
            <span className="flex items-center gap-1 text-[11px] leading-4 text-slate-500">
              <Check aria-hidden className="size-3" /> Immutable activity record
            </span>
          </div>
          <h1 className="mt-3.5 text-[32px] leading-[1.3] font-bold text-heading">Audit &amp; System Logs</h1>
          <p className="mt-1 text-base leading-5 text-slate-900">Monitor platform activity, administrative changes, and security events</p>
        </div>
        <button
          type="button"
          onClick={() => void exportLog()}
          disabled={exporting}
          className="flex h-[42px] items-center gap-2 rounded-md bg-primary px-[22px] text-base font-medium text-white shadow-sm hover:bg-primary/90 disabled:opacity-70"
        >
          <Download aria-hidden className="size-4" />
          {exporting ? "Exporting…" : "Export audit log"}
        </button>
      </div>

      <section aria-label="Summary" className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<Clock aria-hidden className="size-[18px] text-[#6D28D9]" />}
          tone="bg-[#EDE9FE]"
          label="Events today"
          value={loadingStat ?? fmt(s?.events ?? 0)}
          caption="Last 24 hours, across all modules"
        />
        <StatCard
          icon={<Users aria-hidden className="size-[18px] text-[#6D28D9]" />}
          tone="bg-[#EDE9FE]"
          label="Active administrators"
          value={!canSeeAdmins ? "—" : admins.data ? fmt(admins.data.active) : admins.isError ? "—" : "…"}
          caption={!canSeeAdmins ? "Needs the Manage Admins privilege" : admins.data ? `${admins.data.today} signed in today` : " "}
        />
        <StatCard
          icon={<Settings aria-hidden className="size-[18px] text-[#6D28D9]" />}
          tone="bg-[#EDE9FE]"
          label="Admin changes"
          value={loadingStat ?? fmt(s?.adminChanges ?? 0)}
          caption="Made by administrators in the last 24 hours"
        />
        <StatCard
          icon={<Landmark aria-hidden className="size-[18px] text-[#DC2626]" />}
          tone="bg-[#FEE2E2]"
          label="Security events"
          value={loadingStat ?? fmt(security)}
          caption={security ? `${fmt(security)} require attention` : "Nothing needs attention"}
          captionTone={security ? "text-[#DC2626]" : undefined}
        />
      </section>

      {security > 0 && (
        <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[#FECACA] bg-[#FFF8F7] px-5 py-6">
          <div className="flex items-center gap-4">
            <span className="grid size-11 shrink-0 place-items-center rounded-lg bg-[#FEE2E2]">
              <Bell aria-hidden className="size-5 text-[#DC2626]" />
            </span>
            <div>
              <p className="flex flex-wrap items-center gap-2 text-base leading-6 font-semibold text-[#7F1D1D]">
                {fmt(security)} security {security === 1 ? "event needs" : "events need"} review
                <span className="rounded-full bg-[#EF4444] px-2 py-0.5 text-[10px] leading-3 font-semibold text-white">Attention</span>
              </p>
              <p className="text-sm leading-5 text-slate-700">{bannerText}</p>
            </div>
          </div>
          <button type="button" onClick={review} className="h-10 rounded-md border border-[#FCA5A5] bg-white px-4 text-sm text-[#B91C1C] hover:bg-red-50">
            Review security events
          </button>
        </div>
      )}

      <div ref={tableRef} className="scroll-mt-4">
        <Card tone="hairline" className="overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-6 py-6">
            <div>
              <h2 className="text-lg leading-7 font-semibold text-heading">Platform activity</h2>
              <p className="text-sm leading-5 text-slate-600">A complete record of actions performed by admins, users, and the system</p>
            </div>
            <p className="flex items-center gap-2 text-[11px] leading-4 text-slate-500" aria-live="polite">
              <span className={cn("size-2 rounded-full", log.isError ? "bg-red-500" : "bg-[#22C55E]")} aria-hidden />
              {log.isError ? "Connection lost" : "Live monitoring"}
              <span aria-hidden className="text-slate-300">·</span>
              Last updated {agoShort(log.dataUpdatedAt) || "…"}
            </p>
          </div>

          <div className="flex flex-col gap-3 border-b border-slate-100 px-6 py-[26px] sm:flex-row sm:gap-4">
            <label className="relative flex-1">
              <span className="sr-only">Search audit log</span>
              <Search aria-hidden className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-slate-500" />
              <input
                value={filters.search}
                onChange={(e) => setF({ ...filters, search: e.target.value })}
                placeholder="Search actor, email, action, IP, or log ID…"
                className="h-[42px] w-full rounded-md border border-gray-300 bg-white pr-3 pl-10 text-sm text-slate-900 placeholder:text-slate-500 focus:border-primary focus:outline-none"
              />
            </label>
            <div className="grid grid-cols-1 gap-3 sm:flex sm:gap-4">
              <select aria-label="Users" value={filters.role} onChange={(e) => setF({ ...filters, role: e.target.value })} className={cn(select, "w-full sm:w-[161px]")}>
                <option value="">All users</option>
                {USER_TYPES.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
              <select aria-label="Modules" value={filters.module} onChange={(e) => setF({ ...filters, module: e.target.value })} className={cn(select, "w-full sm:w-[172px]")}>
                <option value="">All modules</option>
                {MODULES.map((m) => (
                  <option key={m}>{m}</option>
                ))}
              </select>
              <div>
                <MoreFilters value={filters} onChange={setF} />
              </div>
            </div>
          </div>

          {log.isPending ? (
            <div className="p-6">
              <LoadingState rows={6} label="Loading activity…" />
            </div>
          ) : log.isError && !loaded.length ? (
            <div className="p-6">
              <ErrorState error={log.error} title="Couldn't load the audit log" onRetry={() => void log.refetch()} retrying={log.isFetching} />
            </div>
          ) : (
            <div className="overflow-x-auto">
              {/* Column widths from the mockup: 24 + 209 / 244 / 172 / 192 / 158 / type / chevron (of 1,136). */}
              <table className="w-full min-w-[960px] table-fixed border-collapse text-left">
                <colgroup>
                  <col style={{ width: "20.5%" }} />
                  <col style={{ width: "21.5%" }} />
                  <col style={{ width: "15.2%" }} />
                  <col style={{ width: "16.9%" }} />
                  <col style={{ width: "13.9%" }} />
                  <col style={{ width: "8.4%" }} />
                  <col style={{ width: "3.6%" }} />
                </colgroup>
                <thead className="bg-gray-50">
                  <tr className="h-[35px] text-[11px] leading-4 tracking-wide text-slate-500 uppercase">
                    <th className="pl-6 font-normal">Actor</th>
                    <th className="font-normal">Activity</th>
                    <th className="font-normal">Module</th>
                    <th className="font-normal">Target</th>
                    <th className="font-normal">Date &amp; time</th>
                    <th className="font-normal">Type</th>
                    <th>
                      <span className="sr-only">Details</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-6 py-10 text-center text-sm text-slate-500">
                        {filtering ? "No events match these filters." : "No activity has been recorded yet."}
                      </td>
                    </tr>
                  )}
                  {rows.map((e) => {
                    const isOpen = open === e.id;
                    return (
                      <Fragment key={e.id}>
                        <tr
                          className={cn("h-[75px] cursor-pointer border-t border-slate-100 hover:bg-gray-50/70", isOpen && "bg-gray-50")}
                          onClick={() => setOpen(isOpen ? null : e.id)}
                        >
                          <td className="pr-3 pl-6">
                            <div className="flex items-center gap-3">
                              {e.actorAvatar ? (
                                // eslint-disable-next-line @next/next/no-img-element -- signed Cloudinary URL, shown as-is
                                <img src={e.actorAvatar} alt="" className="size-9 shrink-0 rounded-full object-cover" />
                              ) : (
                                <span aria-hidden className="grid size-9 shrink-0 place-items-center rounded-full bg-[#EEF0FF] text-xs font-semibold text-[#3730A3]">
                                  {e.actorRole === "System" ? "SY" : initials(e.actorName)}
                                </span>
                              )}
                              <div className="min-w-0">
                                <p className="truncate text-sm leading-5 text-slate-900" title={e.actorEmail ?? undefined}>
                                  {e.actorName}
                                </p>
                                <p className="text-[11px] leading-4 text-slate-500">{e.actorRole}</p>
                              </div>
                            </div>
                          </td>
                          <td className="pr-3">
                            <button
                              type="button"
                              aria-expanded={isOpen}
                              onClick={(ev) => {
                                ev.stopPropagation();
                                setOpen(isOpen ? null : e.id);
                              }}
                              className="text-left text-sm leading-5 font-[450] text-slate-900 hover:underline"
                            >
                              {e.activity}
                            </button>
                            <p className="font-mono text-[10px] leading-4 text-slate-400">{e.ref}</p>
                          </td>
                          <td className="pr-3 text-sm leading-5 text-slate-700">{e.module}</td>
                          <td className="pr-3 text-sm leading-5 text-slate-700">{e.target}</td>
                          <td className="pr-3">
                            <p className="text-sm leading-5 whitespace-nowrap text-slate-900">{when(e.at)}</p>
                            {e.ip && <p className="text-[11px] leading-4 text-slate-400">{e.ip}</p>}
                          </td>
                          <td>
                            <span className={cn("inline-flex h-[23px] items-center rounded-full px-2.5 text-xs", TYPE_TONE[e.type])}>{e.type}</span>
                          </td>
                          <td className="pr-6 text-slate-400">
                            {isOpen ? <ChevronDown aria-hidden className="ml-auto size-4" /> : <ChevronRight aria-hidden className="ml-auto size-4" />}
                          </td>
                        </tr>
                        {isOpen && (
                          <tr className="bg-gray-50">
                            <td colSpan={7} className="px-6 pt-4 pb-5">
                              <div className="grid gap-4 md:grid-cols-[404fr_404fr_245fr]">
                                {e.before || e.after ? (
                                  <>
                                    <Box title="BEFORE" tone="before">
                                      <p className="text-sm leading-5 text-slate-800">{e.before ?? "—"}</p>
                                    </Box>
                                    <Box title="AFTER" tone="after">
                                      <p className="text-sm leading-5 text-slate-800">{e.after ?? "—"}</p>
                                    </Box>
                                  </>
                                ) : (
                                  // No before/after recorded for this event: show what was recorded instead.
                                  <div className="md:col-span-2">
                                    <Box title="Details" tone="session">
                                      <dl className="grid gap-x-6 gap-y-1.5 text-sm leading-5 sm:grid-cols-2">
                                        <div className="flex min-w-0 gap-2">
                                          <dt className="shrink-0 text-slate-500">Action</dt>
                                          <dd className="truncate font-mono text-xs leading-5 text-slate-800">{e.action}</dd>
                                        </div>
                                        {e.details.map((d) => (
                                          <div key={d.label} className="flex min-w-0 gap-2">
                                            <dt className="shrink-0 text-slate-500">{d.label}</dt>
                                            <dd className="truncate text-slate-800" title={d.value}>
                                              {d.value}
                                            </dd>
                                          </div>
                                        ))}
                                        {e.categories.length > 1 && (
                                          <div className="flex min-w-0 gap-2">
                                            <dt className="shrink-0 text-slate-500">Categories</dt>
                                            <dd className="text-slate-800">{e.categories.join(", ")}</dd>
                                          </div>
                                        )}
                                      </dl>
                                    </Box>
                                  </div>
                                )}
                                <Box title="Session context" tone="session">
                                  <p className="text-sm leading-5 text-slate-900">{e.device ?? "Device not recorded"}</p>
                                  <p className="mt-1 font-mono text-[11px] leading-4 text-slate-500">{e.ip ?? "IP not recorded"}</p>
                                  {e.requestId && <p className="mt-1 truncate font-mono text-[10px] leading-4 text-slate-400" title="Request ID">{e.requestId}</p>}
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

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-6 py-4">
            <p className="text-sm leading-5 text-slate-600">
              {filtered.length
                ? `Showing ${fmt(current * ROWS + 1)}–${fmt(current * ROWS + rows.length)} of ${fmt(filtered.length)}${log.hasNextPage ? "+" : ""} events ${rangePhrase}`
                : `Showing 0 events ${rangePhrase}`}
              {localFiltering && log.hasNextPage ? ` · filtered the newest ${fmt(loaded.length)}` : ""}
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                disabled={current === 0}
                onClick={() => setPage(current - 1)}
                className="h-10 rounded-md border border-gray-300 bg-white px-4 text-sm text-slate-900 disabled:text-slate-400"
              >
                Previous
              </button>
              <button
                type="button"
                disabled={!canNext || log.isFetchingNextPage}
                onClick={() => void next()}
                className="h-10 rounded-md border border-gray-300 bg-white px-4 text-sm font-medium text-slate-900 disabled:text-slate-400"
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
