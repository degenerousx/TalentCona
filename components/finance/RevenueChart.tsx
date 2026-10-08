"use client";

/**
 * Revenue vs Expenses line chart, drawn to match the Recharts output in the
 * design (1062 × 300 at 1440px, linear lines, dashed grid). It stretches
 * horizontally with its box like a ResponsiveContainer.
 */

import { useEffect, useRef, useState } from "react";
import styles from "./FinancialOps.module.css";

const DESIGN_W = 1062.22;
const H = 300;
const X0 = 73.3; // y-axis gutter, fixed in px as in Recharts
const RIGHT_GAP = 5.63;
const Y_LABEL_X = 64.25;
const Y_TOP = H * 0.0167;
const Y_BASE = H * 0.8033;
const Y_MAX = 80000;
const Y_TICKS = [0, 20000, 40000, 60000, 80000];

const y = (v: number) => Y_BASE - (v / Y_MAX) * (Y_BASE - Y_TOP);

type Series = { name: string; values: number[]; color: string };

export default function RevenueChart({ months, series }: { months: string[]; series: Series[] }) {
  const boxRef = useRef<HTMLDivElement>(null);
  const [W, setW] = useState(DESIGN_W);
  const [hover, setHover] = useState<number | null>(null);

  useEffect(() => {
    const box = boxRef.current;
    if (!box) return;
    const measure = () => setW(Math.max(560, box.clientWidth));
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(box);
    return () => ro.disconnect();
  }, []);

  const X1 = W - RIGHT_GAP;
  const step = (X1 - X0) / (months.length - 1);
  const x = (i: number) => X0 + i * step;

  return (
    <div ref={boxRef} className={styles.chartBox} onMouseLeave={() => setHover(null)}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        width={W}
        height={H}
        style={{ display: "block" }}
        role="img"
        aria-label={`${series.map((s) => s.name).join(" and ")} from ${months[0]} to ${months[months.length - 1]}`}
        fontFamily="var(--font-outfit), sans-serif"
        fontSize="12"
      >
        <g stroke="#CCCCCC" strokeDasharray="3 3" strokeWidth="1">
          {Y_TICKS.map((v) => (
            <line key={v} x1={X0} x2={X1} y1={y(v)} y2={y(v)} />
          ))}
          {months.map((m, i) => (
            <line key={m} x1={x(i)} x2={x(i)} y1={Y_TOP} y2={Y_BASE} />
          ))}
        </g>

        {hover !== null && <line x1={x(hover)} x2={x(hover)} y1={Y_TOP} y2={Y_BASE} stroke="#CCCCCC" strokeWidth="1" />}

        {series.map((s) => (
          <g key={s.name}>
            <polyline points={s.values.map((v, i) => `${x(i)},${y(v)}`).join(" ")} fill="none" stroke={s.color} strokeWidth="2" />
            {s.values.map((v, i) => (
              <circle key={i} cx={x(i)} cy={y(v)} r={hover === i ? 4 : 2.4} fill={hover === i ? s.color : "#FFFFFF"} stroke={s.color} strokeWidth="2" />
            ))}
          </g>
        ))}

        <g stroke="#666666" strokeWidth="1">
          <line x1={X0} x2={X1} y1={Y_BASE} y2={Y_BASE} />
          {months.map((m, i) => (
            <line key={m} x1={x(i)} x2={x(i)} y1={Y_BASE} y2={Y_BASE + 6} />
          ))}
          <line x1={X0} x2={X0} y1={Y_TOP} y2={Y_BASE} />
          {Y_TICKS.map((v) => (
            <line key={v} x1={X0 - 6.8} x2={X0} y1={y(v)} y2={y(v)} />
          ))}
        </g>
        <g fill="#666666">
          {months.map((m, i) => {
            // Like Recharts, keep the last label inside the surface.
            const last = i === months.length - 1;
            return (
              <text key={m} x={last ? W - 1.6 : x(i)} y={Y_BASE + 16} textAnchor={last ? "end" : "middle"}>
                {m}
              </text>
            );
          })}
          {Y_TICKS.map((v) => (
            // The top label is nudged down to stay inside the surface.
            <text key={v} x={Y_LABEL_X} y={Math.max(y(v), Y_TOP + 6.8) + 4} textAnchor="end">
              {v}
            </text>
          ))}
        </g>

        {/* Hover targets, one band per month. */}
        {months.map((m, i) => (
          <rect key={m} x={x(i) - step / 2} y={Y_TOP} width={step} height={Y_BASE - Y_TOP} fill="transparent" onMouseEnter={() => setHover(i)} />
        ))}
      </svg>

      {hover !== null && (
        <div
          className={styles.tooltip}
          style={{ left: Math.min(x(hover) + 10, W - 170), top: Math.max(Y_TOP, Math.min(...series.map((s) => y(s.values[hover]))) - 30) }}
          role="status"
        >
          <p className={styles.tooltipLabel}>{months[hover]}</p>
          {series.map((s) => (
            <p key={s.name} style={{ color: s.color }}>
              {s.name} : {s.values[hover]}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
