"use client";

import { Building2, MapPin, Phone, Settings2, User, Users, Wallet } from "lucide-react";
import type { Branch } from "@/lib/pos/types";
import type { BranchPerformance } from "@/lib/pos/selectors";
import { money, number as fmtNumber } from "@/lib/pos/format";
import { Badge, Button, Card } from "@/components/pos/ui";
import { Sparkline, type SparklinePoint } from "./Sparkline";

export interface BranchCardProps {
  branch: Branch;
  performance: BranchPerformance | undefined;
  staffCount: number;
  sparklineData: SparklinePoint[];
  currencySymbol: string;
  onViewData: () => void;
  onManage: () => void;
  /** Hide the "Manage" action for users without `branch:edit`. Defaults to shown. */
  canManage?: boolean;
}

export function BranchCard({
  branch,
  performance,
  staffCount,
  sparklineData,
  currencySymbol,
  onViewData,
  onManage,
  canManage = true,
}: BranchCardProps) {
  const revenue = performance?.revenue ?? 0;
  const transactions = performance?.transactions ?? 0;
  const stockValue = performance?.stockValue ?? 0;

  return (
    <Card className="flex flex-col gap-4 transition-shadow hover:shadow-card-hover">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-pos-brand-soft text-pos-brand-dark">
            <Building2 size={19} />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5">
              <h3 className="truncate text-sm font-semibold text-pos-heading">{branch.name}</h3>
              {branch.isMain ? (
                <Badge tone="brand" className="shrink-0">
                  Main Branch
                </Badge>
              ) : null}
            </div>
            <p className="mt-0.5 truncate text-xs text-pos-muted">{branch.code}</p>
          </div>
        </div>
        <Badge tone={branch.active ? "ok" : "neutral"} className="shrink-0">
          {branch.active ? "Active" : "Inactive"}
        </Badge>
      </div>

      <div className="space-y-1.5 text-xs text-pos-muted">
        <p className="flex items-start gap-1.5">
          <MapPin size={13} className="mt-0.5 shrink-0" />
          <span className="min-w-0 truncate">
            {branch.address}, {branch.city}
          </span>
        </p>
        <p className="flex items-center gap-1.5">
          <User size={13} className="shrink-0" />
          <span className="truncate">{branch.manager}</span>
        </p>
        <p className="flex items-center gap-1.5">
          <Phone size={13} className="shrink-0" />
          <span className="truncate">{branch.phone}</span>
        </p>
        <p className="flex items-center gap-1.5">
          <Users size={13} className="shrink-0" />
          <span className="truncate">{staffCount} staff</span>
        </p>
      </div>

      <div className="rounded-xl bg-pos-bg p-3">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-pos-muted">
            Last 30 days
          </p>
          <Wallet size={12} className="text-pos-muted" />
        </div>
        <Sparkline
          data={sparklineData}
          color={branch.active ? "#0FA98C" : "#94A3B8"}
        />
        <div className="mt-2 grid grid-cols-3 gap-2 text-center">
          <div>
            <p className="truncate text-xs font-semibold text-pos-heading">
              {money(revenue, currencySymbol, { compact: true })}
            </p>
            <p className="text-[10px] text-pos-muted">Revenue</p>
          </div>
          <div>
            <p className="truncate text-xs font-semibold text-pos-heading">
              {fmtNumber(transactions)}
            </p>
            <p className="text-[10px] text-pos-muted">Orders</p>
          </div>
          <div>
            <p className="truncate text-xs font-semibold text-pos-heading">
              {money(stockValue, currencySymbol, { compact: true })}
            </p>
            <p className="text-[10px] text-pos-muted">Stock value</p>
          </div>
        </div>
      </div>

      <div className="mt-auto flex items-center gap-2 pt-1">
        <Button size="sm" className="flex-1" onClick={onViewData}>
          View data
        </Button>
        {canManage ? (
          <Button size="sm" variant="secondary" icon={Settings2} onClick={onManage}>
            Manage
          </Button>
        ) : null}
      </div>
    </Card>
  );
}
