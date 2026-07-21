"use client";

import { Building2, ChevronRight } from "lucide-react";
import type { BranchPerformance } from "@/lib/pos/selectors";
import { money, number as fmtNumber } from "@/lib/pos/format";
import { Badge, cn } from "@/components/pos/ui";

const RANK_TONE = ["bg-amber-100 text-amber-700", "bg-slate-100 text-slate-600", "bg-orange-100 text-orange-700"];

export function BranchLeagueTable({
  rows,
  currencySymbol,
  onSelectBranch,
}: {
  rows: BranchPerformance[];
  currencySymbol: string;
  onSelectBranch: (branchId: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      {rows.map((row, i) => (
        <button
          key={row.branchId}
          type="button"
          onClick={() => onSelectBranch(row.branchId)}
          className="flex w-full items-center gap-3 rounded-xl px-2.5 py-3 text-left transition-colors hover:bg-pos-bg sm:gap-4"
        >
          <span
            className={cn(
              "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold",
              i < 3 ? RANK_TONE[i] : "bg-pos-bg text-pos-muted",
            )}
          >
            {i + 1}
          </span>

          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-pos-brand-soft text-pos-brand-dark">
            <Building2 size={16} />
          </span>

          <span className="min-w-0 flex-1">
            <span className="flex items-center gap-2">
              <span className="truncate text-sm font-semibold text-pos-heading">{row.name}</span>
              <Badge tone="neutral" className="shrink-0">
                {row.code}
              </Badge>
              {row.isMain ? (
                <Badge tone="brand" className="shrink-0">
                  Main
                </Badge>
              ) : null}
            </span>
            <span className="mt-1.5 block h-1.5 w-full overflow-hidden rounded-full bg-pos-bg">
              <span
                className="block h-full rounded-full bg-pos-brand"
                style={{ width: `${Math.max(row.share, 2)}%` }}
              />
            </span>
          </span>

          <span className="hidden shrink-0 text-right sm:block sm:w-24">
            <span className="block text-sm font-semibold text-pos-heading">
              {money(row.revenue, currencySymbol, { compact: true })}
            </span>
            <span className="block text-xs text-pos-muted">{row.share.toFixed(1)}% share</span>
          </span>

          <span className="hidden shrink-0 text-right md:block md:w-20">
            <span className="block text-sm font-medium text-pos-heading">{fmtNumber(row.transactions)}</span>
            <span className="block text-xs text-pos-muted">orders</span>
          </span>

          <span className="hidden shrink-0 text-right lg:block lg:w-24">
            <span className="block text-sm font-medium text-pos-ok">
              {money(row.profit, currencySymbol, { compact: true })}
            </span>
            <span className="block text-xs text-pos-muted">profit</span>
          </span>

          <span className="hidden shrink-0 text-right lg:block lg:w-24">
            <span className="block text-sm font-medium text-pos-heading">
              {money(row.stockValue, currencySymbol, { compact: true })}
            </span>
            <span className="block text-xs text-pos-muted">stock</span>
          </span>

          <ChevronRight size={16} className="shrink-0 text-pos-muted" />
        </button>
      ))}
    </div>
  );
}
