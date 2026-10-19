"use client";

import { useState } from "react";
import {
  Award,
  CircleAlert,
  CircleCheckBig,
  Clock,
  DollarSign,
  Download,
  TrendingUp,
  Users,
} from "lucide-react";
import { BarChartView, ChartCard, LineChartView, PieChartView } from "./Charts";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { MetricTile } from "@/components/ui/MetricTile";
import { Pill, type PillTone } from "@/components/ui/Pill";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { StatCard } from "@/components/ui/StatCard";
import { TabPanel, Tabs, type TabItem } from "@/components/ui/Tabs";
import { downloadCsv } from "@/lib/csv";
import * as d from "./data";

type TabId = "financial" | "students" | "mentors";

const tabs: TabItem<TabId>[] = [
  { id: "financial", label: "Financial Report" },
  { id: "students", label: "Student Success Report" },
  { id: "mentors", label: "Mentors Response Rate Report" },
];

const ID = "reports";
const tileIcon = { strokeWidth: 1.67 } as const;

function ReportHeader({ title, onExport }: { title: string; onExport: () => void }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <h2 className="text-lg leading-7 font-semibold text-gray-900">{title}</h2>
      <Button
        variant="primary"
        size="md"
        onClick={onExport}
        icon={<Download aria-hidden className="size-4" strokeWidth={1.33} />}
      >
        Export Report
      </Button>
    </div>
  );
}

function TileGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">{children}</div>;
}

/* ---------------------------------------------------------------- Financial */

function FinancialReport() {
  const t = d.financialTiles;
  const exportReport = () =>
    downloadCsv("financial-report.csv", [
      ...d.financialBreakdown.map((b) => ({ Section: "Breakdown", Item: b.label, Amount: b.amount, Share: `${b.value}%` })),
      ...d.revenueByProgram.map((r) => ({ Section: "Revenue by Program", Item: r.label, Amount: `$${r.value.toLocaleString("en-US")}`, Share: "" })),
    ]);

  return (
    <div className="flex flex-col gap-7">
      <ReportHeader title="Financial Breakdown" onExport={exportReport} />

      <TileGrid>
        <MetricTile tone="green" icon={<DollarSign {...tileIcon} />} label="Total Revenue" value={t.totalRevenue.value} caption={t.totalRevenue.caption} />
        <MetricTile tone="blue" icon={<TrendingUp {...tileIcon} />} label="Highest Revenue" value={t.highestRevenue.value} caption={t.highestRevenue.caption} />
        <MetricTile tone="purple" icon={<DollarSign {...tileIcon} />} label="Avg Revenue/Student" value={t.avgRevenuePerStudent.value} caption={t.avgRevenuePerStudent.caption} />
        <MetricTile tone="orange" icon={<Award {...tileIcon} />} label="Best Value" value={t.bestValue.value} caption={t.bestValue.caption} />
      </TileGrid>

      <section aria-label="Cost breakdown" className="flex flex-col items-center gap-8 lg:flex-row">
        <div className="w-full lg:w-[455px] lg:shrink-0">
          {/* Values are already percentages of total spend; show them as-is. */}
          <PieChartView data={d.financialBreakdown} formatLabel={(s) => `${s.value}%`} />
        </div>
        <ul className="flex w-full flex-col gap-4">
          {d.financialBreakdown.map((b) => (
            <li key={b.label} className="flex min-h-[76px] items-center justify-between gap-4 rounded-lg bg-gray-50 px-4 py-3">
              <span className="flex items-center gap-3 text-base leading-6 font-medium text-slate-500">
                <span aria-hidden="true" className="size-4 shrink-0 rounded" style={{ backgroundColor: b.color }} />
                {b.label}
              </span>
              <span className="flex flex-col items-end">
                <span className="text-base leading-6 font-bold text-gray-900">{b.amount}</span>
                <span className="text-sm leading-5 text-slate-900">{b.value}%</span>
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="flex flex-col gap-2 rounded-lg bg-blue-50 p-6">
        <h3 className="text-lg leading-[27px] font-semibold text-blue-900">Summary</h3>
        <ul className="flex flex-col gap-1 text-sm leading-5 text-blue-700">
          {d.financialSummary.map((s) => (
            <li key={s.label}>
              {s.label} <strong className="font-bold">{s.value}</strong>
              {s.note && ` ${s.note}`}
            </li>
          ))}
        </ul>
      </section>

      <ChartCard title="Revenue by Program">
        <BarChartView
          data={d.revenueByProgram}
          color="#10b981"
          yLabel="Revenue ($)"
          yTicks={[0, 35000, 70000, 105000, 140000]}
          format={(v) => `$${v.toLocaleString("en-US")}`}
        />
      </ChartCard>
    </div>
  );
}

/* ---------------------------------------------------------- Student success */

const programColumns: Column<d.ProgramRow>[] = [
  { key: "program", header: "Program", rowHeader: true, className: "min-w-[150px]" },
  { key: "enrolled", header: "Total Enrolled", className: "font-medium" },
  { key: "completed", header: "Completed", className: "font-medium text-green-600" },
  { key: "inProgress", header: "In Progress", className: "font-medium text-blue-600" },
  { key: "dropped", header: "Dropped", className: "font-medium text-red-600" },
  { key: "completionRate", header: "Completion Rate", className: "font-semibold" },
  { key: "avgDuration", header: "Avg Duration" },
];

function StudentSuccessReport() {
  const t = d.studentTiles;
  const exportReport = () =>
    downloadCsv(
      "student-success-report.csv",
      d.programRows.map((r) => ({
        Program: r.program,
        "Total Enrolled": r.enrolled,
        Completed: r.completed,
        "In Progress": r.inProgress,
        Dropped: r.dropped,
        "Completion Rate": r.completionRate,
        "Avg Duration": r.avgDuration,
      })),
    );

  return (
    <div className="flex flex-col gap-7">
      <ReportHeader title="Program Completion Rate Report" onExport={exportReport} />

      <TileGrid>
        <MetricTile tone="purple" icon={<Users {...tileIcon} />} label="Total Enrolled" value={t.enrolled.value} caption={t.enrolled.caption} />
        <MetricTile tone="green" icon={<CircleCheckBig {...tileIcon} />} label="Total Completed" value={t.completed.value} caption={t.completed.caption} />
        <MetricTile tone="blue" icon={<Clock {...tileIcon} />} label="In Progress" value={t.inProgress.value} caption={t.inProgress.caption} />
        <MetricTile tone="red" icon={<CircleAlert {...tileIcon} />} label="Dropped Out" value={t.droppedOut.value} caption={t.droppedOut.caption} />
      </TileGrid>

      <div className="grid gap-6 lg:grid-cols-2 lg:gap-10">
        <ChartCard title="Completion Rate by Program">
          <BarChartView
            data={d.completionByProgram}
            color="#3b82f6"
            yLabel="Completion Rate (%)"
            yTicks={[0, 25, 50, 75, 100]}
            format={(v) => `${v}%`}
          />
        </ChartCard>
        <ChartCard title="Completion Rate Trend (6 Months)">
          <LineChartView
            data={d.completionTrend}
            color="#10b981"
            yLabel="Completion Rate (%)"
            yTicks={[60, 70, 80, 90, 100]}
            format={(v) => `${v}%`}
          />
        </ChartCard>
      </div>

      <DataTable
        caption="Completion by program"
        columns={programColumns}
        rows={d.programRows}
        rowKey={(r) => r.program}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ Mentors */

const statusTone: Record<d.MentorStatus, PillTone> = {
  Excellent: "green",
  Good: "blue",
  "Needs Attention": "orange",
};

const rateBar = (rate: number) =>
  rate >= 95 ? "bg-green-600" : rate >= 85 ? "bg-blue-600" : "bg-orange-600";

const mentorColumns: Column<d.MentorRow>[] = [
  { key: "mentor", header: "Mentor", rowHeader: true, className: "min-w-[160px]" },
  { key: "program", header: "Program", className: "text-gray-600" },
  {
    key: "responseRate",
    header: "Response Rate",
    render: (m) => (
      <span className="flex items-center gap-2">
        <ProgressBar
          value={m.responseRate}
          label={`${m.mentor} response rate`}
          barClassName={rateBar(m.responseRate)}
          className="w-32"
        />
        <span className="font-semibold">{m.responseRate}%</span>
      </span>
    ),
  },
  { key: "avgResponseTime", header: "Avg Response Time" },
  {
    key: "status",
    header: "Status",
    render: (m) => <Pill tone={statusTone[m.status]}>{m.status}</Pill>,
  },
];

function MentorResponseReport() {
  const t = d.mentorTiles;
  const exportReport = () =>
    downloadCsv(
      "mentor-response-report.csv",
      d.mentorRows.map((m) => ({
        Mentor: m.mentor,
        Program: m.program,
        "Response Rate": `${m.responseRate}%`,
        "Avg Response Time": m.avgResponseTime,
        Status: m.status,
      })),
    );

  return (
    <div className="flex flex-col gap-7">
      <ReportHeader title="Mentor Response Rate Report" onExport={exportReport} />

      <TileGrid>
        <MetricTile tone="blue" icon={<Clock {...tileIcon} />} label="Avg Response Time" value={t.avgResponseTime.value} caption={t.avgResponseTime.caption} />
        <MetricTile tone="green" icon={<CircleCheckBig {...tileIcon} />} label="Avg Response Rate" value={t.avgResponseRate.value} caption={t.avgResponseRate.caption} />
        <MetricTile tone="orange" icon={<CircleAlert {...tileIcon} />} label="Pending Queries" value={t.pendingQueries.value} caption={t.pendingQueries.caption} />
        <MetricTile tone="purple" icon={<Users {...tileIcon} />} label="Total Queries" value={t.totalQueries.value} caption={t.totalQueries.caption} />
      </TileGrid>

      <div className="grid gap-6 lg:grid-cols-2">
        <ChartCard title="Response Rate by Mentor">
          <BarChartView
            data={d.responseRateByMentor}
            color="#3b82f6"
            yLabel="Response Rate (%)"
            yTicks={[0, 25, 50, 75, 100]}
            format={(v) => `${v}%`}
          />
        </ChartCard>
        <ChartCard title="Average Response Time by Day">
          <LineChartView
            data={d.responseTimeByDay}
            color="#3b82f6"
            yLabel="Avg Response Time (hrs)"
            yTicks={[0, 2, 4, 7]}
            format={(v) => `${v} hrs`}
          />
        </ChartCard>
      </div>

      <DataTable
        caption="Response rate by mentor"
        columns={mentorColumns}
        rows={d.mentorRows}
        rowKey={(m) => m.mentor}
      />
    </div>
  );
}

/* --------------------------------------------------------------------- Page */

export function ReportsView() {
  const [tab, setTab] = useState<TabId>("financial");
  const k = d.kpis;

  return (
    <div className="flex flex-col gap-8">
      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          tone="default"
          label="Total Revenue (YTD)"
          value={k.revenueYtd.value}
          valueClassName="text-gray-900"
          icon={<DollarSign className="text-green-500" strokeWidth={2.67} />}
          footnote={k.revenueYtd.note}
          footnoteClassName="text-green-600"
        />
        <StatCard
          tone="default"
          label="Total Revenue (MTD)"
          value={k.revenueMtd.value}
          valueClassName="text-gray-900"
          icon={<DollarSign className="text-yellow-400" strokeWidth={2.67} />}
          footnote={k.revenueMtd.note}
          footnoteClassName="text-[#deb315]"
        />
        <StatCard
          tone="default"
          label="Platform Growth"
          value={k.platformGrowth.value}
          valueClassName="text-gray-900"
          icon={<TrendingUp className="text-blue-500" strokeWidth={2.67} />}
          footnote={k.platformGrowth.note}
        />
        <StatCard
          tone="default"
          label="Completion Rate"
          value={k.completionRate.value}
          valueClassName="text-gray-900"
          icon={<Users className="text-purple-500" strokeWidth={2.67} />}
          footnote={k.completionRate.note}
          footnoteClassName="text-purple-600"
        />
      </div>

      <Card className="overflow-hidden">
        <Tabs idBase={ID} label="Reports" tabs={tabs} value={tab} onChange={setTab} />
        <TabPanel idBase={ID} id={tab} className="p-4 sm:p-6">
          {tab === "financial" && <FinancialReport />}
          {tab === "students" && <StudentSuccessReport />}
          {tab === "mentors" && <MentorResponseReport />}
        </TabPanel>
      </Card>
    </div>
  );
}
