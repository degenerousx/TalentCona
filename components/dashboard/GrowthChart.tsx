"use client";

/**
 * Platform Growth area chart, drawn to match the Recharts output in the
 * design (721 × 347 surface at 1440px, monotone curves, dashed grid). Like a
 * Recharts ResponsiveContainer, the plot stretches horizontally with its box.
 */

import { useEffect, useRef, useState } from "react";

type Point = [number, number];

const DESIGN_W = 721;
const H = 347;
const X0 = 78; // y-axis gutter, fixed in px as in Recharts
const RIGHT_GAP = 6;
const Y_LABEL_X = 67.2;
const Y_TOP = H * 0.0168;
const Y_BASE = H * 0.8833;
const Y_MAX = 100000;

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];
const Y_TICKS = [0, 25000, 50000, 75000, 100000];

export type GrowthSeries = { students: number[]; revenue: number[] };

const y = (v: number) => Y_BASE - (v / Y_MAX) * (Y_BASE - Y_TOP);

/** d3 curveMonotoneX tangents (Fritsch–Carlson). */
function tangents(pts: Point[]): number[] {
  const n = pts.length;
  const t = new Array<number>(n).fill(0);
  const sign = (v: number) => (v < 0 ? -1 : 1);
  for (let i = 1; i < n - 1; i++) {
    const [x0, y0] = pts[i - 1];
    const [x1, y1] = pts[i];
    const [x2, y2] = pts[i + 1];
    const h0 = x1 - x0;
    const h1 = x2 - x1;
    const s0 = (y1 - y0) / h0;
    const s1 = (y2 - y1) / h1;
    const p = (s0 * h1 + s1 * h0) / (h0 + h1);
    t[i] = (sign(s0) + sign(s1)) * Math.min(Math.abs(s0), Math.abs(s1), 0.5 * Math.abs(p)) || 0;
  }
  // End points: d3's slope2, a one-sided estimate from the neighbour's tangent.
  const edge = (a: Point, b: Point, tb: number) => ((3 * (b[1] - a[1])) / (b[0] - a[0]) - tb) / 2;
  if (n > 1) {
    t[0] = edge(pts[0], pts[1], t[1]);
    t[n - 1] = edge(pts[n - 2], pts[n - 1], t[n - 2]);
  }
  return t;
}

function linePath(values: number[], x: (i: number) => number): string {
  const pts: Point[] = values.map((v, i) => [x(i), y(v)]);
  const t = tangents(pts);
  let d = `M${pts[0][0]},${pts[0][1]}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const [x0, y0] = pts[i];
    const [x1, y1] = pts[i + 1];
    const dx = (x1 - x0) / 3;
    d += `C${x0 + dx},${y0 + dx * t[i]},${x1 - dx},${y1 - dx * t[i + 1]},${x1},${y1}`;
  }
  return d;
}

function Area({ values, stroke, fill, x }: { values: number[]; stroke: string; fill: string; x: (i: number) => number }) {
  const line = linePath(values, x);
  const area = `${line}L${x(values.length - 1)},${Y_BASE}L${x(0)},${Y_BASE}Z`;
  return (
    <g>
      <path d={area} fill={fill} />
      <path d={line} fill="none" stroke={stroke} strokeWidth="1" />
    </g>
  );
}

export default function GrowthChart({ data }: { data: GrowthSeries }) {
  const boxRef = useRef<HTMLDivElement>(null);
  const [W, setW] = useState(DESIGN_W);

  useEffect(() => {
    const box = boxRef.current;
    if (!box) return;
    // The surface sits 7.89px narrower than its container in the design.
    const measure = () => setW(Math.max(320, box.clientWidth - 7.89));
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(box);
    return () => ro.disconnect();
  }, []);

  const X1 = W - RIGHT_GAP;
  const x = (i: number) => X0 + (i * (X1 - X0)) / (MONTHS.length - 1);

  return (
    <div ref={boxRef}>
    <svg
      viewBox={`0 0 ${W} ${H}`}
      width={W}
      height={H}
      style={{ display: "block", maxWidth: "100%", height: "auto" }}
      role="img"
      aria-label="Platform growth from January to June: students and revenue"
      fontFamily="var(--font-outfit), sans-serif"
      fontSize="12"
    >
      {/* Grid */}
      <g stroke="#CCCCCC" strokeDasharray="3 3" strokeWidth="1">
        {Y_TICKS.map((v) => (
          <line key={v} x1={X0} x2={X1} y1={y(v)} y2={y(v)} />
        ))}
        {MONTHS.map((m, i) => (
          <line key={m} x1={x(i)} x2={x(i)} y1={Y_TOP} y2={Y_BASE} />
        ))}
      </g>

      <Area values={data.students} stroke="#3B82F6" fill="rgba(59, 130, 246, 0.2)" x={x} />
      <Area values={data.revenue} stroke="#10B981" fill="rgba(16, 185, 129, 0.2)" x={x} />

      {/* X axis */}
      <g stroke="#666666" strokeWidth="1">
        <line x1={X0} x2={X1} y1={Y_BASE} y2={Y_BASE} />
        {MONTHS.map((m, i) => (
          <line key={m} x1={x(i)} x2={x(i)} y1={Y_BASE} y2={Y_BASE + 6} />
        ))}
      </g>
      <g fill="#666666" textAnchor="middle">
        {MONTHS.map((m, i) => {
          // Like Recharts, keep the last label inside the surface.
          const last = i === MONTHS.length - 1;
          return (
            <text key={m} x={last ? x(i) + 1 : x(i)} y={Y_BASE + 16.5} textAnchor={last ? "end" : undefined}>
              {m}
            </text>
          );
        })}
      </g>

      {/* Y axis */}
      <g stroke="#666666" strokeWidth="1">
        <line x1={X0} x2={X0} y1={Y_TOP} y2={Y_BASE} />
        {Y_TICKS.map((v) => (
          <line key={v} x1={X0 - 6} x2={X0} y1={y(v)} y2={y(v)} />
        ))}
      </g>
      <g fill="#666666" textAnchor="end">
        {Y_TICKS.map((v) => (
          // Like Recharts, the top label is nudged down to stay inside the surface.
          <text key={v} x={Y_LABEL_X} y={Math.max(y(v), Y_TOP + 7.8) + 4}>
            {v}
          </text>
        ))}
      </g>
    </svg>
    </div>
  );
}
