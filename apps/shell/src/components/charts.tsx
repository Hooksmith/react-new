"use client";

import {
  formatMoney,
  formatPercent,
  type CreditBand,
  type MonthlyVolume,
  type StatusBreakdown,
} from "@nexbank/api";
import { loanStatusLabel } from "@nexbank/ui";
import type { ReactNode } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

// Colour-blind-safe palette (Okabe–Ito inspired), distinguishable without relying on hue alone.
const PALETTE = ["#2563eb", "#0891b2", "#16a34a", "#dc2626", "#d97706"];

const axisProps = {
  stroke: "var(--fg-muted)",
  fontSize: 12,
  tickLine: false,
  axisLine: false,
} as const;

/**
 * Every chart is paired with a data table: the SVG is decorative for assistive tech
 * (role="img" + summary label) and the table carries the actual numbers.
 */
function ChartFigure({
  label,
  table,
  children,
}: {
  label: string;
  table: { headers: string[]; rows: (string | number)[][] };
  children: ReactNode;
}) {
  return (
    <figure>
      <div role="img" aria-label={label} className="h-72 w-full">
        {children}
      </div>
      <details className="mt-3 text-sm">
        <summary className="text-fg-muted hover:text-fg cursor-pointer">View data table</summary>
        <table className="mt-2 w-full text-left text-xs">
          <caption className="sr-only">{label}</caption>
          <thead>
            <tr>
              {table.headers.map((h) => (
                <th key={h} scope="col" className="text-fg-muted py-1 pr-4 font-medium">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {table.rows.map((row, i) => (
              <tr key={i} className="border-border border-t">
                {row.map((cell, j) =>
                  j === 0 ? (
                    <th key={j} scope="row" className="py-1 pr-4 font-normal">
                      {cell}
                    </th>
                  ) : (
                    <td key={j} className="py-1 pr-4 tabular-nums">
                      {cell}
                    </td>
                  ),
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </figure>
  );
}

const tooltipStyle = {
  contentStyle: {
    background: "var(--surface)",
    border: "1px solid var(--border)",
    borderRadius: 8,
    fontSize: 12,
  },
  labelStyle: { color: "var(--fg)" },
};

export function VolumeChart({ data }: { data: MonthlyVolume }) {
  return (
    <ChartFigure
      label="Monthly loan volume: disbursed versus repaid over the last 12 months"
      table={{
        headers: ["Month", "Disbursed", "Repaid"],
        rows: data.map((d) => [
          d.month,
          formatMoney(d.disbursed, "USD", true),
          formatMoney(d.repaid, "USD", true),
        ]),
      }}
    >
      <ResponsiveContainer>
        <AreaChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
          <defs>
            <linearGradient id="disbursed" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={PALETTE[0]} stopOpacity={0.3} />
              <stop offset="100%" stopColor={PALETTE[0]} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
          <XAxis dataKey="month" {...axisProps} />
          <YAxis
            {...axisProps}
            tickFormatter={(v: number) => formatMoney(v, "USD", true)}
            width={64}
          />
          <Tooltip {...tooltipStyle} formatter={(v) => formatMoney(Number(v))} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Area
            type="monotone"
            dataKey="disbursed"
            name="Disbursed"
            stroke={PALETTE[0]}
            fill="url(#disbursed)"
            strokeWidth={2}
          />
          <Area
            type="monotone"
            dataKey="repaid"
            name="Repaid"
            stroke={PALETTE[1]}
            fill="none"
            strokeWidth={2}
            strokeDasharray="5 4"
          />
        </AreaChart>
      </ResponsiveContainer>
    </ChartFigure>
  );
}

export function StatusChart({ data }: { data: StatusBreakdown }) {
  const total = data.reduce((s, d) => s + d.count, 0);
  const rows = data.map((d) => ({ ...d, name: loanStatusLabel(d.status) }));
  return (
    <ChartFigure
      label={`Loan pipeline by status, ${total} applications in total`}
      table={{
        headers: ["Status", "Count", "Share"],
        rows: rows.map((d) => [d.name, d.count, formatPercent(total ? d.count / total : 0)]),
      }}
    >
      <ResponsiveContainer>
        <PieChart>
          <Pie
            data={rows}
            dataKey="count"
            nameKey="name"
            innerRadius="55%"
            outerRadius="85%"
            paddingAngle={2}
          >
            {rows.map((d, i) => (
              <Cell key={d.status} fill={PALETTE[i % PALETTE.length]} />
            ))}
          </Pie>
          <Tooltip {...tooltipStyle} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
        </PieChart>
      </ResponsiveContainer>
    </ChartFigure>
  );
}

export function CreditBandChart({ data }: { data: CreditBand[] }) {
  return (
    <ChartFigure
      label="Applicants by credit score band with historical default rate"
      table={{
        headers: ["Band", "Score range", "Applicants", "Default rate"],
        rows: data.map((b) => [b.band, `${b.min}–${b.max}`, b.count, formatPercent(b.defaultRate)]),
      }}
    >
      <ResponsiveContainer>
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
          <XAxis dataKey="band" {...axisProps} />
          <YAxis {...axisProps} allowDecimals={false} />
          <Tooltip {...tooltipStyle} />
          <Bar dataKey="count" name="Applicants" radius={[6, 6, 0, 0]}>
            {data.map((b, i) => (
              <Cell key={b.band} fill={[PALETTE[3], PALETTE[4], PALETTE[1], PALETTE[2]][i]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartFigure>
  );
}
