"use client";

import { useMemo } from "react";
import { Area, AreaChart, ResponsiveContainer, Tooltip } from "recharts";
import type { PosData, BranchScope } from "@/lib/pos/types";
import { number as fmtNumber } from "@/lib/pos/format";

interface SparkPoint {
  date: string;
  label: string;
  units: number;
}

function buildSeries(data: PosData, scope: BranchScope, productId: string, days = 30): SparkPoint[] {
  const buckets = new Map<string, SparkPoint>();
  for (let i = days - 1; i >= 0; i -= 1) {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    buckets.set(key, {
      date: key,
      label: d.toLocaleDateString("en-GB", { day: "numeric", month: "short" }),
      units: 0,
    });
  }

  for (const sale of data.sales) {
    if (sale.status !== "completed") continue;
    if (scope !== "all" && sale.branchId !== scope) continue;
    const key = sale.createdAt.slice(0, 10);
    const bucket = buckets.get(key);
    if (!bucket) continue;
    for (const line of sale.lines) {
      if (line.productId !== productId) continue;
      bucket.units += line.quantity;
    }
  }

  return [...buckets.values()];
}

function SparkTooltip({ active, payload }: { active?: boolean; payload?: { payload: SparkPoint }[] }) {
  if (!active || !payload || !payload.length) return null;
  const point = payload[0].payload;
  return (
    <div className="rounded-lg bg-pos-heading px-2.5 py-1.5 text-xs text-white shadow-pop">
      <p className="font-semibold">{point.label}</p>
      <p className="text-white/80">{fmtNumber(point.units)} sold</p>
    </div>
  );
}

export function ProductSparkline({
  data,
  scope,
  productId,
}: {
  data: PosData;
  scope: BranchScope;
  productId: string;
}) {
  const series = useMemo(() => buildSeries(data, scope, productId), [data, scope, productId]);
  const total = series.reduce((sum, p) => sum + p.units, 0);

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wide text-pos-muted">
          30-day sales trend
        </p>
        <p className="text-xs font-semibold text-pos-heading">{fmtNumber(total)} units</p>
      </div>
      <div className="h-20 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={series} margin={{ top: 4, right: 4, left: 4, bottom: 0 }}>
            <defs>
              <linearGradient id={`spark-${productId}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#0FA98C" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#0FA98C" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <Tooltip content={<SparkTooltip />} cursor={{ stroke: "#E8EDF4", strokeWidth: 1 }} />
            <Area
              type="monotone"
              dataKey="units"
              stroke="#0FA98C"
              strokeWidth={2}
              fill={`url(#spark-${productId})`}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
