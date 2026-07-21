"use client";

import { useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { SeriesPoint } from "@/lib/pos/selectors";
import { money, number as fmtNumber } from "@/lib/pos/format";
import { cn } from "@/components/pos/ui";

type Metric = "revenue" | "profit" | "transactions";

const METRIC_LABEL: Record<Metric, string> = {
  revenue: "Revenue",
  profit: "Profit",
  transactions: "Transactions",
};

const METRIC_COLOR: Record<Metric, string> = {
  revenue: "#0FA98C",
  profit: "#4C6FFF",
  transactions: "#F59E0B",
};

function ChartTooltip({
  active,
  payload,
  label,
  metric,
  currencySymbol,
}: {
  active?: boolean;
  payload?: { value: number }[];
  label?: string;
  metric: Metric;
  currencySymbol: string;
}) {
  if (!active || !payload || !payload.length) return null;
  const value = payload[0].value;
  return (
    <div className="rounded-xl bg-pos-heading px-3 py-2 text-xs text-white shadow-pop">
      <p className="font-semibold">{label}</p>
      <p className="mt-0.5 text-white/80">
        {METRIC_LABEL[metric]}:{" "}
        {metric === "transactions" ? fmtNumber(value) : money(value, currencySymbol)}
      </p>
    </div>
  );
}

export function RevenueAreaChart({
  data,
  currencySymbol,
}: {
  data: SeriesPoint[];
  currencySymbol: string;
}) {
  const [metric, setMetric] = useState<Metric>("revenue");
  const color = METRIC_COLOR[metric];

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-1.5">
        {(Object.keys(METRIC_LABEL) as Metric[]).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMetric(m)}
            className={cn(
              "rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
              metric === m
                ? "bg-pos-brand text-white"
                : "bg-pos-bg text-pos-muted hover:text-pos-heading",
            )}
          >
            {METRIC_LABEL[m]}
          </button>
        ))}
      </div>

      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id={`fill-${metric}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.32} />
                <stop offset="100%" stopColor={color} stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke="#E8EDF4" strokeDasharray="3 6" />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11, fill: "#6B7A90" }}
              minTickGap={24}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11, fill: "#6B7A90" }}
              width={56}
              tickFormatter={(v) =>
                metric === "transactions" ? fmtNumber(v) : money(v, currencySymbol, { compact: true })
              }
            />
            <Tooltip
              content={<ChartTooltip metric={metric} currencySymbol={currencySymbol} />}
              cursor={{ stroke: "#E8EDF4", strokeWidth: 1 }}
            />
            <Area
              type="monotone"
              dataKey={metric}
              stroke={color}
              strokeWidth={2.5}
              strokeLinecap="round"
              fill={`url(#fill-${metric})`}
              activeDot={{ r: 4, strokeWidth: 0 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
