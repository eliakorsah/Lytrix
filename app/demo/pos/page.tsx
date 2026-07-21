"use client";

import Link from "next/link";
import { useMemo } from "react";
import {
  ArrowRight,
  Clock3,
  PackageSearch,
  Receipt,
  ShoppingBag,
  Sparkles,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { usePos } from "@/lib/pos/store";
import {
  branchPerformance,
  delta,
  expiringBatches,
  hourlyTraffic,
  kpis,
  lowStock,
  revenueSeries,
  salesByCategory,
  scopedSales,
  topProducts,
} from "@/lib/pos/selectors";
import { expiryLabel, money, number as fmtNumber, timeAgo } from "@/lib/pos/format";
import {
  Badge,
  Button,
  Card,
  CardHeader,
  EmptyState,
  PageHeader,
  Select,
  Skeleton,
  StatTile,
} from "@/components/pos/ui";
import { Donut } from "@/components/pos/dashboard/Donut";
import { RevenueAreaChart } from "@/components/pos/dashboard/RevenueAreaChart";
import { BranchLeagueTable } from "@/components/pos/dashboard/BranchLeagueTable";
import { HourlyTrafficChart } from "@/components/pos/dashboard/HourlyTrafficChart";
import { usePeriod } from "@/components/pos/dashboard/usePeriod";

const PAYMENT_TONE: Record<string, "brand" | "accent" | "warn" | "violet"> = {
  Cash: "brand",
  Card: "accent",
  "Mobile Money": "warn",
  Insurance: "violet",
};

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

export default function PosDashboardPage() {
  const { data, ready, scope, setScope, activeBranch, currentUser } = usePos();
  const [period, setPeriod] = usePeriod();

  const scopeName = scope === "all" ? "All Branches" : activeBranch?.name ?? "—";
  const symbol = data.settings.currencySymbol;

  const kpiSet = useMemo(() => (ready ? kpis(data, scope, period) : null), [ready, data, scope, period]);
  const series = useMemo(
    () => (ready ? revenueSeries(data, scope, period) : []),
    [ready, data, scope, period],
  );
  const category = useMemo(
    () => (ready ? salesByCategory(data, scope, period) : []),
    [ready, data, scope, period],
  );
  const branches = useMemo(() => (ready ? branchPerformance(data, period) : []), [ready, data, period]);
  const traffic = useMemo(
    () => (ready ? hourlyTraffic(data, scope, period) : []),
    [ready, data, scope, period],
  );
  const lowStockAlerts = useMemo(() => (ready ? lowStock(data, scope, 6) : []), [ready, data, scope]);
  const expiryAlerts = useMemo(() => (ready ? expiringBatches(data, scope, 6) : []), [ready, data, scope]);
  const recentSales = useMemo(() => {
    if (!ready) return [];
    return [...scopedSales(data, scope)]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 8);
  }, [ready, data, scope]);
  const products = useMemo(
    () => (ready ? topProducts(data, scope, period, 8) : []),
    [ready, data, scope, period],
  );
  const topProductMax = products.length ? products[0].revenue : 0;
  const branchNameById = useMemo(() => new Map(data.branches.map((b) => [b.id, b.name])), [data.branches]);

  if (!ready || !kpiSet) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${greeting()}${currentUser ? `, ${currentUser.name.split(" ").slice(0, 2).join(" ")}` : ""}`}
        subtitle={
          <span className="inline-flex items-center gap-1.5">
            Viewing <span className="font-semibold text-pos-heading">{scopeName}</span>
            {scope === "all" ? (
              <Badge tone="brand" className="ml-1">
                Consolidated
              </Badge>
            ) : null}
          </span>
        }
        actions={
          <Select
            aria-label="Date range"
            value={String(period)}
            onChange={(e) => setPeriod(Number(e.target.value))}
            className="w-40"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
          </Select>
        }
      />

      {/* KPI row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile
          variant="gradient"
          tone="brand"
          icon={Wallet}
          label="Revenue"
          value={money(kpiSet.revenue, symbol, { compact: true })}
          delta={delta(kpiSet.revenue, kpiSet.revenuePrev)}
        />
        <StatTile
          variant="gradient"
          tone="ok"
          icon={TrendingUp}
          label="Gross profit"
          value={money(kpiSet.grossProfit, symbol, { compact: true })}
          delta={delta(kpiSet.grossProfit, kpiSet.grossProfitPrev)}
        />
        <StatTile
          variant="gradient"
          tone="accent"
          icon={Receipt}
          label="Transactions"
          value={fmtNumber(kpiSet.transactions)}
          delta={delta(kpiSet.transactions, kpiSet.transactionsPrev)}
        />
        <StatTile
          variant="gradient"
          tone="violet"
          icon={ShoppingBag}
          label="Average basket"
          value={money(kpiSet.averageBasket, symbol)}
          delta={delta(kpiSet.averageBasket, kpiSet.averageBasketPrev)}
        />
      </div>

      {/* Revenue + category */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader title="Revenue trend" subtitle={`Last ${period} days`} />
          <RevenueAreaChart data={series} currencySymbol={symbol} />
        </Card>
        <Card>
          <CardHeader title="Sales by category" subtitle={`Last ${period} days`} />
          <Donut data={category} currencySymbol={symbol} centerLabel="Total sales" />
        </Card>
      </div>

      {/* Branch league / hourly traffic */}
      {scope === "all" ? (
        <Card>
          <CardHeader
            title="Branch performance"
            subtitle="Ranked by revenue — click a branch to drill in"
          />
          {branches.length ? (
            <BranchLeagueTable rows={branches} currencySymbol={symbol} onSelectBranch={setScope} />
          ) : (
            <EmptyState title="No branch data" description="No sales recorded yet." />
          )}
        </Card>
      ) : (
        <Card>
          <CardHeader title="Hourly traffic" subtitle={`${activeBranch?.name ?? ""} · last ${period} days`} />
          {traffic.some((t) => t.transactions > 0) ? (
            <HourlyTrafficChart data={traffic} currencySymbol={symbol} />
          ) : (
            <EmptyState title="No traffic yet" description="No transactions in this period." />
          )}
        </Card>
      )}

      {/* Alerts */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader
            title="Low stock"
            subtitle="At or below reorder level"
            action={
              <span className="rounded-full bg-pos-warn-soft px-2.5 py-1 text-xs font-semibold text-pos-warn">
                {lowStockAlerts.length}
              </span>
            }
          />
          {lowStockAlerts.length === 0 ? (
            <EmptyState
              icon={PackageSearch}
              title="Stock levels healthy"
              description="Nothing is below reorder level right now."
            />
          ) : (
            <ul className="divide-y divide-pos-border/70">
              {lowStockAlerts.map((a) => {
                return (
                  <li key={`${a.branchId}-${a.product.id}`} className="flex items-center gap-3 py-3">
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-pos-heading">
                        {a.product.name}
                      </span>
                      <span className="mt-0.5 block truncate text-xs text-pos-muted">
                        {scope === "all" ? `${a.branchName} · ` : ""}
                        {a.onHand} on hand / reorder at {a.reorderLevel}
                      </span>
                    </span>
                    <Badge tone={a.onHand === 0 ? "danger" : "warn"} className="shrink-0">
                      {a.onHand === 0 ? "Out of stock" : "Low"}
                    </Badge>
                    <Link href="/demo/pos/transfers" className="shrink-0">
                      <Button variant="secondary" size="sm">
                        Request transfer
                      </Button>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        <Card>
          <CardHeader
            title="Expiring soon"
            subtitle={`Within ${data.settings.expiryWarningDays} days`}
            action={
              <span className="rounded-full bg-pos-danger-soft px-2.5 py-1 text-xs font-semibold text-pos-danger">
                {expiryAlerts.length}
              </span>
            }
          />
          {expiryAlerts.length === 0 ? (
            <EmptyState icon={Clock3} title="Nothing expiring" description="All batches are within date." />
          ) : (
            <ul className="divide-y divide-pos-border/70">
              {expiryAlerts.map((a) => (
                <li key={a.batch.id} className="flex items-center gap-3 py-3">
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-pos-heading">
                      {a.product?.name ?? "Unknown product"}
                    </span>
                    <span className="mt-0.5 block truncate text-xs text-pos-muted">
                      {scope === "all" ? `${a.branchName} · ` : ""}
                      Batch {a.batch.batchNumber} · {money(a.value, symbol, { compact: true })} at risk
                    </span>
                  </span>
                  <Badge tone={a.daysLeft < 0 ? "danger" : "warn"} className="shrink-0">
                    {expiryLabel(a.daysLeft)}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      {/* Recent sales + top products */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader
            title="Recent sales"
            subtitle="Latest transactions"
            action={
              <Link href="/demo/pos/sales" className="inline-flex items-center gap-1 text-sm font-medium text-pos-brand hover:text-pos-brand-dark">
                View all <ArrowRight size={14} />
              </Link>
            }
          />
          {recentSales.length === 0 ? (
            <EmptyState icon={Receipt} title="No sales yet" description="Transactions will appear here." />
          ) : (
            <ul className="divide-y divide-pos-border/70">
              {recentSales.map((sale) => (
                <li key={sale.id} className="flex items-center gap-3 py-3">
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                      <span className="truncate text-sm font-medium text-pos-heading">{sale.receiptNo}</span>
                      <span className="text-xs text-pos-muted">{timeAgo(sale.createdAt)}</span>
                    </span>
                    <span className="mt-0.5 block truncate text-xs text-pos-muted">
                      {scope === "all" ? `${branchNameById.get(sale.branchId) ?? ""} · ` : ""}
                      {sale.cashierName} · {sale.lines.length} item{sale.lines.length === 1 ? "" : "s"}
                    </span>
                  </span>
                  <Badge tone={PAYMENT_TONE[sale.paymentMethod] ?? "brand"} className="hidden shrink-0 sm:inline-flex">
                    {sale.paymentMethod}
                  </Badge>
                  <span className="shrink-0 text-sm font-semibold text-pos-heading">
                    {money(sale.total, symbol)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <CardHeader title="Top products" subtitle={`Last ${period} days`} />
          {products.length === 0 ? (
            <EmptyState icon={Sparkles} title="No sales yet" description="Top sellers will appear here." />
          ) : (
            <ul className="space-y-3.5">
              {products.map((p, i) => (
                <li key={p.product.id}>
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-pos-bg text-[11px] font-bold text-pos-muted">
                      {i + 1}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-pos-heading">
                        {p.product.name}
                      </span>
                      <span className="block truncate text-xs text-pos-muted">
                        {p.product.strength} · {fmtNumber(p.unitsSold)} units
                      </span>
                    </span>
                    <span className="shrink-0 text-sm font-semibold text-pos-heading">
                      {money(p.revenue, symbol, { compact: true })}
                    </span>
                  </div>
                  <span className="mt-1.5 block h-1.5 w-full overflow-hidden rounded-full bg-pos-bg">
                    <span
                      className="block h-full rounded-full bg-pos-brand"
                      style={{ width: `${topProductMax ? Math.max((p.revenue / topProductMax) * 100, 4) : 0}%` }}
                    />
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-10 w-40" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Skeleton className="h-80 xl:col-span-2" />
        <Skeleton className="h-80" />
      </div>
      <Skeleton className="h-72" />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Skeleton className="h-64" />
        <Skeleton className="h-64" />
      </div>
    </div>
  );
}
