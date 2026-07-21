"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { BranchPerformance } from "@/lib/pos/selectors";
import { money } from "@/lib/pos/format";

function BarTooltip({
  active,
  payload,
  currencySymbol,
}: {
  active?: boolean;
  payload?: { payload: BranchPerformance }[];
  currencySymbol: string;
}) {
  if (!active || !payload || !payload.length) return null;
  const row = payload[0].payload;
  return (
    <div className="rounded-xl bg-pos-heading px-3 py-2 text-xs text-white shadow-pop">
      <p className="font-semibold">{row.name}</p>
      <p className="mt-0.5 text-white/80">{money(row.revenue, currencySymbol)}</p>
      <p className="text-white/60">{row.share.toFixed(1)}% of network revenue</p>
    </div>
  );
}

export function BranchComparisonChart({
  rows,
  currencySymbol,
}: {
  rows: BranchPerformance[];
  currencySymbol: string;
}) {
  const height = Math.max(220, rows.length * 44);
  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={rows}
          layout="vertical"
          margin={{ top: 4, right: 24, left: 0, bottom: 4 }}
        >
          <CartesianGrid horizontal={false} stroke="#E8EDF4" strokeDasharray="3 6" />
          <XAxis
            type="number"
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 11, fill: "#6B7A90" }}
            tickFormatter={(v) => money(v, currencySymbol, { compact: true })}
          />
          <YAxis
            type="category"
            dataKey="code"
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 12, fill: "#0F1B2D" }}
            width={64}
          />
          <Tooltip content={<BarTooltip currencySymbol={currencySymbol} />} cursor={{ fill: "#F6F8FB" }} />
          <Bar dataKey="revenue" fill="#0FA98C" radius={[0, 6, 6, 0]} maxBarSize={22} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
