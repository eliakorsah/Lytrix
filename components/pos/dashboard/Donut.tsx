"use client";

import { useMemo, useState } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { money } from "@/lib/pos/format";
import { EmptyState } from "@/components/pos/ui";

export interface DonutDatum {
  name: string;
  value: number;
}

export const DONUT_COLORS = [
  "#0FA98C",
  "#4C6FFF",
  "#F59E0B",
  "#EF4759",
  "#8B5CF6",
  "#16B364",
  "#3350D9",
  "#FBB03B",
  "#E23A4E",
  "#A78BFA",
  "#0B8A72",
  "#0EA36F",
];

function DonutTooltip({
  active,
  payload,
  currencySymbol,
  total,
}: {
  active?: boolean;
  payload?: { name: string; value: number }[];
  currencySymbol: string;
  total: number;
}) {
  if (!active || !payload || !payload.length) return null;
  const p = payload[0];
  const share = total ? (p.value / total) * 100 : 0;
  return (
    <div className="rounded-xl bg-pos-heading px-3 py-2 text-xs text-white shadow-pop">
      <p className="font-semibold">{p.name}</p>
      <p className="mt-0.5 text-white/80">
        {money(p.value, currencySymbol)} · {share.toFixed(1)}%
      </p>
    </div>
  );
}

export function Donut({
  data,
  currencySymbol,
  centerLabel = "Total",
  height = 220,
  maxSlices = 7,
}: {
  data: DonutDatum[];
  currencySymbol: string;
  centerLabel?: string;
  height?: number;
  /** Long tails are rolled into a single "Other" slice to keep the card short. */
  maxSlices?: number;
}) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  // Roll everything past `maxSlices` into "Other" so a 12-category dataset
  // doesn't produce a 12-row legend taller than the chart beside it.
  const slices = useMemo(() => {
    const sorted = [...data].sort((a, b) => b.value - a.value);
    if (sorted.length <= maxSlices) return sorted;
    const head = sorted.slice(0, maxSlices);
    const tail = sorted.slice(maxSlices);
    const rest = tail.reduce((sum, d) => sum + d.value, 0);
    return rest > 0
      ? [...head, { name: `Other (${tail.length})`, value: rest }]
      : head;
  }, [data, maxSlices]);

  const total = useMemo(() => slices.reduce((s, d) => s + d.value, 0), [slices]);

  if (!slices.length || total === 0) {
    return <EmptyState title="No data yet" description="Nothing to show for this period." />;
  }

  return (
    // Stacked, not side-by-side: this chart is used inside narrow one-third
    // cards, and a viewport breakpoint can't tell how wide its container is —
    // a flex row here squeezed the legend until the labels vanished.
    <div className="flex flex-col items-center gap-4">
      <div className="relative shrink-0" style={{ width: height, height }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={slices}
              dataKey="value"
              nameKey="name"
              innerRadius="68%"
              outerRadius="98%"
              paddingAngle={2}
              stroke="none"
              onMouseEnter={(_, i) => setActiveIndex(i)}
              onMouseLeave={() => setActiveIndex(null)}
            >
              {slices.map((entry, i) => (
                <Cell
                  key={entry.name}
                  fill={DONUT_COLORS[i % DONUT_COLORS.length]}
                  opacity={activeIndex === null || activeIndex === i ? 1 : 0.35}
                />
              ))}
            </Pie>
            <Tooltip content={<DonutTooltip currencySymbol={currencySymbol} total={total} />} />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <p className="text-[11px] font-medium uppercase tracking-wide text-pos-muted">{centerLabel}</p>
          <p className="mt-0.5 text-lg font-semibold text-pos-heading">
            {money(total, currencySymbol, { compact: true })}
          </p>
        </div>
      </div>

      <ul className="w-full min-w-0 space-y-1">
        {slices.map((d, i) => {
          const share = total ? (d.value / total) * 100 : 0;
          return (
            <li
              key={d.name}
              onMouseEnter={() => setActiveIndex(i)}
              onMouseLeave={() => setActiveIndex(null)}
              className="flex items-center gap-2 rounded-lg px-1.5 py-1 text-sm transition-colors hover:bg-pos-bg"
            >
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ background: DONUT_COLORS[i % DONUT_COLORS.length] }}
              />
              {/* min-w-0 lets the label truncate instead of pushing the
                  figures out of the card on a narrow container. */}
              <span className="min-w-0 flex-1 truncate text-pos-heading" title={d.name}>
                {d.name}
              </span>
              <span className="shrink-0 tabular-nums text-pos-muted">
                {money(d.value, currencySymbol, { compact: true })}
              </span>
              <span className="w-9 shrink-0 text-right text-xs tabular-nums text-pos-muted/70">
                {share.toFixed(0)}%
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
