"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Text,
  Tooltip,
  XAxis,
  YAxis,
  type PieLabelRenderProps,
} from "recharts";
import { Card } from "@/components/ui/Card";

export type Datum = { label: string; value: number };

/* Shared axis styling, as drawn in the Figma charts. */
const tick = { fontSize: 12, fill: "#0f172a", fontFamily: "var(--font-outfit)" };
const axisLine = { stroke: "#0f172a" };
const axisTitle = (value: string) => ({
  value,
  angle: -90,
  position: "insideLeft" as const,
  style: { fontSize: 12, fill: "#808080", textAnchor: "middle" as const },
  offset: 10,
});
const tooltipStyle = {
  contentStyle: { borderRadius: 8, borderColor: "#e5e7eb", fontSize: 12 },
  cursor: { fill: "rgba(148, 163, 184, 0.15)" },
};

/** X-axis label that wraps onto a second line instead of colliding. */
function WrappedTick({ x, y, payload }: { x?: number; y?: number; payload?: { value: string } }) {
  return (
    <Text x={x} y={y} dy={4} width={80} textAnchor="middle" verticalAnchor="start" {...tick}>
      {payload?.value ?? ""}
    </Text>
  );
}

/** Screen-reader version of a chart's data. */
function DataSummary({ data, format }: { data: Datum[]; format: (v: number) => string }) {
  return (
    <ul className="sr-only">
      {data.map((d) => (
        <li key={d.label}>
          {d.label}: {format(d.value)}
        </li>
      ))}
    </ul>
  );
}

type ChartCardProps = { title: string; className?: string; children: React.ReactNode };

/** White card with an 18px title, holding a chart. */
export function ChartCard({ title, className, children }: ChartCardProps) {
  return (
    <Card as="section" className={`flex min-w-0 flex-col gap-4 p-6 ${className ?? ""}`}>
      <h3 className="text-lg leading-[27px] font-semibold text-gray-900">{title}</h3>
      {children}
    </Card>
  );
}

type CartesianProps = {
  data: Datum[];
  color: string;
  yLabel: string;
  yTicks: number[];
  /** Formats values for tooltips and the screen-reader summary. */
  format?: (v: number) => string;
  height?: number;
};

export function BarChartView({ data, color, yLabel, yTicks, format = String, height = 300 }: CartesianProps) {
  return (
    <figure className="m-0">
      <div aria-hidden="true" style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#cccccc" />
            <XAxis
              dataKey="label"
              tick={<WrappedTick />}
              axisLine={axisLine}
              tickLine={axisLine}
              interval={0}
              height={40}
            />
            <YAxis
              ticks={yTicks}
              domain={[yTicks[0], yTicks[yTicks.length - 1]]}
              tick={tick}
              axisLine={axisLine}
              tickLine={axisLine}
              label={axisTitle(yLabel)}
            />
            <Tooltip {...tooltipStyle} formatter={(v) => [format(Number(v)), yLabel]} />
            <Bar dataKey="value" fill={color} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <DataSummary data={data} format={format} />
    </figure>
  );
}

export function LineChartView({ data, color, yLabel, yTicks, format = String, height = 300 }: CartesianProps) {
  return (
    <figure className="m-0">
      <div aria-hidden="true" style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#cccccc" />
            <XAxis dataKey="label" tick={tick} axisLine={axisLine} tickLine={axisLine} />
            <YAxis
              ticks={yTicks}
              domain={[yTicks[0], yTicks[yTicks.length - 1]]}
              tick={tick}
              axisLine={axisLine}
              tickLine={axisLine}
              label={axisTitle(yLabel)}
            />
            <Tooltip {...tooltipStyle} formatter={(v) => [format(Number(v)), yLabel]} />
            <Line type="monotone" dataKey="value" stroke={color} strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <DataSummary data={data} format={format} />
    </figure>
  );
}

export type Slice = Datum & { color: string };

type PieChartViewProps = {
  data: Slice[];
  /** Slice label text. Defaults to each slice's share of the total. */
  formatLabel?: (slice: Slice, share: number) => string;
  height?: number;
};

export function PieChartView({
  data,
  formatLabel = (_, share) => `${Math.round(share * 100)}%`,
  height = 300,
}: PieChartViewProps) {
  const total = data.reduce((sum, d) => sum + d.value, 0);

  const renderLabel = ({ cx, cy, midAngle, outerRadius, percent, index }: PieLabelRenderProps) => {
    const r = Number(outerRadius) + 24;
    const angle = (-Number(midAngle) * Math.PI) / 180;
    const x = Number(cx) + r * Math.cos(angle);
    const y = Number(cy) + r * Math.sin(angle);
    return (
      <text
        x={x}
        y={y}
        fill={data[index ?? 0].color}
        fontSize={12}
        textAnchor={x > Number(cx) ? "start" : "end"}
        dominantBaseline="central"
      >
        {formatLabel(data[index ?? 0], Number(percent))}
      </text>
    );
  };

  return (
    <figure className="m-0">
      <div aria-hidden="true" style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="label"
              outerRadius={100}
              stroke="#ffffff"
              label={renderLabel}
              labelLine={false}
              isAnimationActive={false}
            >
              {data.map((d) => (
                <Cell key={d.label} fill={d.color} />
              ))}
            </Pie>
            <Tooltip contentStyle={tooltipStyle.contentStyle} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <ul className="sr-only">
        {data.map((d) => (
          <li key={d.label}>
            {d.label}: {formatLabel(d, d.value / total)}
          </li>
        ))}
      </ul>
    </figure>
  );
}
