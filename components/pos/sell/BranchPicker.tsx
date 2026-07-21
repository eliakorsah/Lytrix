"use client";

import { Building2, MapPin, ShoppingCart } from "lucide-react";
import { usePos } from "@/lib/pos/store";
import { branchPerformance } from "@/lib/pos/selectors";
import { money } from "@/lib/pos/format";
import { Card, EmptyState } from "@/components/pos/ui";
import { useMemo } from "react";

/**
 * Selling requires a specific branch — stock, receipts and cashiers are all
 * per-branch. When the user is on the "All Branches" consolidated view, this
 * prompt stands in for the till until they pick one.
 */
export function BranchPicker() {
  const { data, setScope } = usePos();
  const performance = useMemo(() => branchPerformance(data, 30), [data]);
  const revenueByBranch = useMemo(
    () => new Map(performance.map((p) => [p.branchId, p.revenue])),
    [performance],
  );

  return (
    <div className="mx-auto max-w-3xl py-6">
      <div className="mb-6 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-pos-brand-soft text-pos-brand-dark">
          <ShoppingCart size={26} />
        </div>
        <h1 className="text-xl font-semibold text-pos-heading sm:text-2xl">
          Pick a branch to start selling
        </h1>
        <p className="mx-auto mt-2 max-w-md text-sm text-pos-muted">
          You&apos;re viewing the consolidated Main Branch report. The till needs one
          specific branch — stock, receipts and cashiers are all tracked per location.
        </p>
      </div>

      {data.branches.length === 0 ? (
        <EmptyState title="No branches yet" description="Add a branch to start selling." />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {data.branches.map((branch) => (
            <button
              key={branch.id}
              type="button"
              onClick={() => setScope(branch.id)}
              className="group flex items-start gap-3 rounded-2xl bg-pos-surface p-4 text-left shadow-card transition-all hover:-translate-y-0.5 hover:shadow-card-hover"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-pos-brand-soft text-pos-brand-dark transition-colors group-hover:bg-pos-brand group-hover:text-white">
                <Building2 size={19} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <p className="truncate text-sm font-semibold text-pos-heading">{branch.name}</p>
                  {branch.isMain ? (
                    <span className="shrink-0 rounded-full bg-pos-accent px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white">
                      Main
                    </span>
                  ) : null}
                </div>
                <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-pos-muted">
                  <MapPin size={10} className="shrink-0" />
                  {branch.code} · {branch.city}
                </p>
                <p className="mt-2 text-xs font-medium text-pos-brand-dark">
                  {money(revenueByBranch.get(branch.id) ?? 0, data.settings.currencySymbol, { compact: true })}
                  <span className="ml-1 font-normal text-pos-muted">30d revenue</span>
                </p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
