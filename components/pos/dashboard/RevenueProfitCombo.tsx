"use client";

import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { SeriesPoint } from "@/lib/pos/selectors";
import { money } from "@/lib/pos/format";

function ComboTooltip({
  active,
  payload,
  label,
  currencySymbol,
}: {
  active?: boolean;
  payload?: { value: number; name: string; color: string }[];
  label?: string;
  currencySymbol: string;
}) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="rounded-xl bg-pos-heading px-3 py-2 text-xs text-white shadow-pop">
      <p className="font-semibold">{label}</p>
      {payload.map((p) => (
        <p key={p.name} className="mt-0.5 flex items-center gap-1.5 text-white/80">
          <span className="h-2 w-2 rounded-full" style={{ background: p.color }} />
          {p.name}: {money(p.value, currencySymbol)}
        </p>
      ))}
    </div>
  );
}

export function RevenueProfitCombo({
  data,
  currencySymbol,
}: {
  data: SeriesPoint[];
  currencySymbol: string;
}) {
  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 10, right: 8, left: 0, bottom: 0 }}>
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
            tickFormatter={(v) => money(v, currencySymbol, { compact: true })}
          />
          <Tooltip content={<ComboTooltip currencySymbol={currencySymbol} />} cursor={{ fill: "#F6F8FB" }} />
          <Legend
            iconType="circle"
            wrapperStyle={{ fontSize: 12, color: "#6B7A90" }}
          />
          <Bar dataKey="revenue" name="Revenue" fill="#0FA98C" radius={[6, 6, 0, 0]} maxBarSize={26} />
          <Line
            type="monotone"
            dataKey="profit"
            name="Profit"
            stroke="#4C6FFF"
            strokeWidth={2.5}
            strokeLinecap="round"
            dot={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
