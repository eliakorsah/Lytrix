"use client";

import { useMemo } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Clock3 } from "lucide-react";
import { money, number as fmtNumber } from "@/lib/pos/format";

interface HourBucket {
  hour: number;
  label: string;
  transactions: number;
  revenue: number;
}

function HourTooltip({
  active,
  payload,
  label,
  currencySymbol,
}: {
  active?: boolean;
  payload?: { value: number }[];
  label?: string;
  currencySymbol: string;
}) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="rounded-xl bg-pos-heading px-3 py-2 text-xs text-white shadow-pop">
      <p className="font-semibold">{label}</p>
      <p className="mt-0.5 text-white/80">{fmtNumber(payload[0].value)} transactions</p>
    </div>
  );
}

export function HourlyTrafficChart({
  data,
  currencySymbol,
}: {
  data: HourBucket[];
  currencySymbol: string;
}) {
  const peak = useMemo(
    () => data.reduce((best, d) => (d.transactions > best.transactions ? d : best), data[0]),
    [data],
  );
  const total = data.reduce((s, d) => s + d.transactions, 0);

  return (
    <div>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke="#E8EDF4" strokeDasharray="3 6" />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 10, fill: "#6B7A90" }}
              interval={1}
            />
            <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "#6B7A90" }} width={30} />
            <Tooltip
              content={<HourTooltip currencySymbol={currencySymbol} />}
              cursor={{ fill: "#F6F8FB" }}
            />
            <Bar dataKey="transactions" fill="#4C6FFF" radius={[6, 6, 0, 0]} maxBarSize={28} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {total > 0 && peak ? (
        <div className="mt-3 flex items-center gap-2 rounded-xl bg-pos-accent-soft px-3.5 py-2.5 text-sm text-pos-heading">
          <Clock3 size={15} className="shrink-0 text-pos-accent" />
          <span>
            Peak hour is <span className="font-semibold">{peak.label}</span> with{" "}
            <span className="font-semibold">{fmtNumber(peak.transactions)}</span> transactions —
            consider extra till coverage around then.
          </span>
        </div>
      ) : null}
    </div>
  );
}
