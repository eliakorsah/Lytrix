"use client";

import { money, number } from "@/lib/pos/format";
import { cn } from "@/components/pos/ui";

export interface AgeingSegment {
  key: string;
  label: string;
  count: number;
  amount: number;
  barClass: string;
  dotClass: string;
}

export interface AgeingStripProps {
  segments: AgeingSegment[];
  currencySymbol: string;
}

/** A single horizontal bar, proportionally segmented by outstanding value, with a legend beneath. */
export function AgeingStrip({ segments, currencySymbol }: AgeingStripProps) {
  const total = segments.reduce((sum, s) => sum + s.amount, 0);

  return (
    <div>
      <div className="flex h-3.5 w-full overflow-hidden rounded-full bg-pos-bg">
        {segments.map((s) => {
          const width = total > 0 ? (s.amount / total) * 100 : 100 / segments.length;
          if (width <= 0) return null;
          return (
            <div
              key={s.key}
              className={cn("h-full transition-all first:rounded-l-full last:rounded-r-full", s.barClass)}
              style={{ width: `${width}%` }}
              title={`${s.label}: ${money(s.amount, currencySymbol)}`}
            />
          );
        })}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {segments.map((s) => (
          <div key={s.key} className="rounded-xl bg-pos-bg px-3 py-2.5">
            <div className="flex items-center gap-1.5 text-xs font-medium text-pos-muted">
              <span className={cn("h-2 w-2 rounded-full", s.dotClass)} />
              {s.label}
            </div>
            <p className="mt-1 text-base font-semibold text-pos-heading">
              {money(s.amount, currencySymbol)}
            </p>
            <p className="text-xs text-pos-muted">{number(s.count)} invoice{s.count === 1 ? "" : "s"}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
