"use client";

import { useMemo } from "react";
import { Download, PackageSearch, TrendingDown, TrendingUp } from "lucide-react";
import { usePos } from "@/lib/pos/store";
import {
  branchPerformance,
  expiringBatches,
  kpis,
  lowStock,
  paymentMix,
  revenueSeries,
  salesByCategory,
  scopedSales,
  scopedStock,
  stockValue,
  topProducts,
} from "@/lib/pos/selectors";
import { money, number as fmtNumber } from "@/lib/pos/format";
import {
  Badge,
  Button,
  Card,
  CardHeader,
  DataTable,
  EmptyState,
  PageHeader,
  Select,
  Skeleton,
  useToast,
} from "@/components/pos/ui";
import { Donut } from "@/components/pos/dashboard/Donut";
import { RevenueProfitCombo } from "@/components/pos/dashboard/RevenueProfitCombo";
import { BranchComparisonChart } from "@/components/pos/dashboard/BranchComparisonChart";
import { usePeriod } from "@/components/pos/dashboard/usePeriod";
import { downloadCsv } from "@/components/pos/dashboard/csv";
import type { BranchPerformance } from "@/lib/pos/selectors";
import type { Product } from "@/lib/pos/types";

interface SlowMover {
  product: Product;
  unitsSold: number;
  unitsOnHand: number;
  tiedUpCapital: number;
}

export default function PosReportsPage() {
  const { data, ready, scope, activeBranch } = usePos();
  const { push } = useToast();
  const [period, setPeriod] = usePeriod();

  const symbol = data.settings.currencySymbol;
  const scopeName = scope === "all" ? "All Branches" : activeBranch?.name ?? "—";

  const kpiSet = useMemo(() => (ready ? kpis(data, scope, period) : null), [ready, data, scope, period]);
  const series = useMemo(
    () => (ready ? revenueSeries(data, scope, period) : []),
    [ready, data, scope, period],
  );
  const branches = useMemo(() => (ready ? branchPerformance(data, period) : []), [ready, data, period]);
  const payments = useMemo(
    () => (ready ? paymentMix(data, scope, period) : []),
    [ready, data, scope, period],
  );
  const category = useMemo(
    () => (ready ? salesByCategory(data, scope, period) : []),
    [ready, data, scope, period],
  );
  const products = useMemo(
    () => (ready ? topProducts(data, scope, period, 6) : []),
    [ready, data, scope, period],
  );
  const inventory = useMemo(() => (ready ? stockValue(data, scope) : null), [ready, data, scope]);
  const lowStockAlerts = useMemo(() => (ready ? lowStock(data, scope) : []), [ready, data, scope]);
  const expiryAlerts = useMemo(() => (ready ? expiringBatches(data, scope) : []), [ready, data, scope]);

  const categoryTable = useMemo(() => {
    const total = category.reduce((s, c) => s + c.value, 0);
    const unitsByCategory = new Map<string, number>();
    const productCategory = new Map(data.products.map((p) => [p.id, p.category]));
    if (ready) {
      const now = Date.now();
      const windowMs = period * 864e5;
      for (const sale of scopedSales(data, scope)) {
        if (sale.status !== "completed") continue;
        if (now - new Date(sale.createdAt).getTime() > windowMs) continue;
        for (const line of sale.lines) {
          const cat = productCategory.get(line.productId);
          if (!cat) continue;
          unitsByCategory.set(cat, (unitsByCategory.get(cat) ?? 0) + line.quantity);
        }
      }
    }
    return category.map((c) => ({
      name: c.name,
      revenue: c.value,
      units: unitsByCategory.get(c.name) ?? 0,
      share: total ? (c.value / total) * 100 : 0,
    }));
  }, [category, data, scope, period, ready]);

  const slowMovers: SlowMover[] = useMemo(() => {
    if (!ready) return [];
    const now = Date.now();
    const windowMs = period * 864e5;
    const soldUnits = new Map<string, number>();
    for (const sale of scopedSales(data, scope)) {
      if (sale.status !== "completed") continue;
      if (now - new Date(sale.createdAt).getTime() > windowMs) continue;
      for (const line of sale.lines) {
        soldUnits.set(line.productId, (soldUnits.get(line.productId) ?? 0) + line.quantity);
      }
    }

    const carriedIds = new Set(scopedStock(data, scope).map((b) => b.productId));

    return data.products
      .filter((p) => carriedIds.has(p.id))
      .map((product) => {
        const unitsOnHand = scopedStock(data, scope)
          .filter((b) => b.productId === product.id)
          .reduce((s, b) => s + b.quantity, 0);
        return {
          product,
          unitsSold: soldUnits.get(product.id) ?? 0,
          unitsOnHand,
          tiedUpCapital: unitsOnHand * product.costPrice,
        };
      })
      .filter((m) => m.unitsOnHand > 0)
      .sort((a, b) => a.unitsSold - b.unitsSold || b.tiedUpCapital - a.tiedUpCapital)
      .slice(0, 6);
  }, [ready, data, scope, period]);

  const branchColumns = [
    {
      key: "name",
      header: "Branch",
      sortable: true,
      render: (r: BranchPerformance) => (
        <span className="flex items-center gap-2">
          <span className="font-medium text-pos-heading">{r.name}</span>
          <Badge tone="neutral">{r.code}</Badge>
        </span>
      ),
    },
    {
      key: "revenue",
      header: "Revenue",
      align: "right" as const,
      sortable: true,
      render: (r: BranchPerformance) => money(r.revenue, symbol, { compact: true }),
    },
    {
      key: "transactions",
      header: "Transactions",
      align: "right" as const,
      sortable: true,
      render: (r: BranchPerformance) => fmtNumber(r.transactions),
    },
    {
      key: "profit",
      header: "Profit",
      align: "right" as const,
      sortable: true,
      render: (r: BranchPerformance) => money(r.profit, symbol, { compact: true }),
    },
    {
      key: "margin",
      header: "Margin",
      align: "right" as const,
      sortable: true,
      sortValue: (r: BranchPerformance) => (r.revenue ? (r.profit / r.revenue) * 100 : 0),
      render: (r: BranchPerformance) => `${r.revenue ? ((r.profit / r.revenue) * 100).toFixed(1) : "0.0"}%`,
    },
    {
      key: "stockValue",
      header: "Stock value",
      align: "right" as const,
      sortable: true,
      render: (r: BranchPerformance) => money(r.stockValue, symbol, { compact: true }),
    },
    {
      key: "share",
      header: "Share",
      align: "right" as const,
      sortable: true,
      render: (r: BranchPerformance) => (
        <span className="inline-flex items-center gap-2">
          <span className="h-1.5 w-14 overflow-hidden rounded-full bg-pos-bg">
            <span
              className="block h-full rounded-full bg-pos-brand"
              style={{ width: `${Math.max(r.share, 2)}%` }}
            />
          </span>
          {r.share.toFixed(1)}%
        </span>
      ),
    },
  ];

  const categoryColumns = [
    { key: "name", header: "Category", sortable: true },
    {
      key: "units",
      header: "Units sold",
      align: "right" as const,
      sortable: true,
      render: (r: { units: number }) => fmtNumber(r.units),
    },
    {
      key: "revenue",
      header: "Revenue",
      align: "right" as const,
      sortable: true,
      render: (r: { revenue: number }) => money(r.revenue, symbol, { compact: true }),
    },
    {
      key: "share",
      header: "Share",
      align: "right" as const,
      sortable: true,
      render: (r: { share: number; revenue: number }) => (
        <span className="inline-flex items-center gap-2">
          <span className="h-1.5 w-14 overflow-hidden rounded-full bg-pos-bg">
            <span
              className="block h-full rounded-full bg-pos-accent"
              style={{ width: `${Math.max(r.share, 2)}%` }}
            />
          </span>
          {r.share.toFixed(1)}%
        </span>
      ),
    },
  ];

  const handleExport = () => {
    if (!kpiSet || !inventory) return;
    const rows: (string | number)[][] = [
      ["MediPlus Pharmacy — Analytics export"],
      ["Scope", scopeName],
      ["Period", `Last ${period} days`],
      [],
      ["Metric", "Value"],
      ["Revenue", kpiSet.revenue.toFixed(2)],
      ["Gross profit", kpiSet.grossProfit.toFixed(2)],
      ["Transactions", kpiSet.transactions],
      ["Items sold", kpiSet.itemsSold],
      ["Average basket", kpiSet.averageBasket.toFixed(2)],
      [],
      ["Category", "Units sold", "Revenue", "Share %"],
      ...categoryTable.map((c) => [c.name, c.units, c.revenue.toFixed(2), c.share.toFixed(1)]),
    ];

    if (scope === "all") {
      rows.push([], ["Branch", "Code", "Revenue", "Transactions", "Profit", "Stock value", "Share %"]);
      for (const b of branches) {
        rows.push([b.name, b.code, b.revenue.toFixed(2), b.transactions, b.profit.toFixed(2), b.stockValue.toFixed(2), b.share.toFixed(1)]);
      }
    }

    downloadCsv(
      `mediplus-analytics-${scope}-${period}d-${new Date().toISOString().slice(0, 10)}.csv`,
      rows,
    );
    push({
      title: "Report exported",
      description: "Your CSV download has started.",
      tone: "success",
    });
  };

  if (!ready || !kpiSet || !inventory) {
    return <ReportsSkeleton />;
  }

  const margin = kpiSet.revenue ? (kpiSet.grossProfit / kpiSet.revenue) * 100 : 0;
  const potentialMargin = inventory.atRetail - inventory.atCost;
  const atRiskValue =
    lowStockAlerts.length + expiryAlerts.length > 0
      ? expiryAlerts.reduce((s, a) => s + a.value, 0)
      : 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Analytics & Reports"
        subtitle={
          <span>
            Deep dive for <span className="font-semibold text-pos-heading">{scopeName}</span>
          </span>
        }
        actions={
          <>
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
            <Button variant="secondary" icon={Download} onClick={handleExport}>
              Export CSV
            </Button>
          </>
        }
      />

      {/* Summary strip */}
      <Card>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          <SummaryStat label="Revenue" value={money(kpiSet.revenue, symbol, { compact: true })} />
          <SummaryStat label="Gross profit" value={money(kpiSet.grossProfit, symbol, { compact: true })} />
          <SummaryStat label="Margin" value={`${margin.toFixed(1)}%`} />
          <SummaryStat label="Items sold" value={fmtNumber(kpiSet.itemsSold)} />
          <SummaryStat label="Transactions" value={fmtNumber(kpiSet.transactions)} />
          <SummaryStat label="Avg. basket" value={money(kpiSet.averageBasket, symbol)} />
        </div>
      </Card>

      {/* Revenue vs profit */}
      <Card>
        <CardHeader title="Revenue vs profit" subtitle={`Last ${period} days`} />
        <RevenueProfitCombo data={series} currencySymbol={symbol} />
      </Card>

      {/* Branch comparison */}
      {scope === "all" ? (
        <Card>
          <CardHeader title="Branch comparison" subtitle="Ranked by revenue" />
          {branches.length ? (
            <>
              <BranchComparisonChart rows={branches} currencySymbol={symbol} />
              <div className="mt-6">
                <DataTable columns={branchColumns} rows={branches} keyOf={(r) => r.branchId} pageSize={8} />
              </div>
            </>
          ) : (
            <EmptyState title="No branch data" description="No sales recorded yet." />
          )}
        </Card>
      ) : null}

      {/* Payment mix + category performance */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card>
          <CardHeader title="Payment mix" subtitle={`Last ${period} days`} />
          <Donut data={payments} currencySymbol={symbol} centerLabel="Total paid" />
        </Card>
        <Card className="xl:col-span-2">
          <CardHeader title="Category performance" subtitle={`Last ${period} days`} />
          {categoryTable.length ? (
            <DataTable columns={categoryColumns} rows={categoryTable} keyOf={(r) => r.name} pageSize={8} />
          ) : (
            <EmptyState title="No category data" description="No sales recorded yet." />
          )}
        </Card>
      </div>

      {/* Top & slow movers */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader
            title="Best sellers"
            subtitle={`Last ${period} days`}
            action={<TrendingUp size={16} className="text-pos-ok" />}
          />
          {products.length === 0 ? (
            <EmptyState title="No sales yet" description="Best sellers will appear here." />
          ) : (
            <ul className="space-y-3">
              {products.map((p, i) => (
                <li key={p.product.id} className="flex items-center gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-pos-ok-soft text-[11px] font-bold text-pos-ok">
                    {i + 1}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-pos-heading">
                      {p.product.name}
                    </span>
                    <span className="block truncate text-xs text-pos-muted">
                      {fmtNumber(p.unitsSold)} units sold
                    </span>
                  </span>
                  <span className="shrink-0 text-sm font-semibold text-pos-heading">
                    {money(p.revenue, symbol, { compact: true })}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <CardHeader
            title="Slow movers"
            subtitle="Least units sold this period"
            action={<TrendingDown size={16} className="text-pos-danger" />}
          />
          {slowMovers.length === 0 ? (
            <EmptyState title="No dead stock" description="Every carried product has been selling." />
          ) : (
            <ul className="space-y-3">
              {slowMovers.map((m) => (
                <li key={m.product.id} className="flex items-center gap-3">
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-pos-heading">
                      {m.product.name}
                    </span>
                    <span className="block truncate text-xs text-pos-muted">
                      {m.unitsSold === 0 ? "No sales" : `${fmtNumber(m.unitsSold)} sold`} · {fmtNumber(m.unitsOnHand)} on hand
                    </span>
                  </span>
                  {m.unitsSold === 0 ? (
                    <Badge tone="danger" className="shrink-0">
                      Dead stock
                    </Badge>
                  ) : null}
                  <span className="shrink-0 text-sm font-semibold text-pos-heading">
                    {money(m.tiedUpCapital, symbol, { compact: true })}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      {/* Inventory health */}
      <Card>
        <CardHeader title="Inventory health" subtitle="Current stock position for this scope" />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          <SummaryStat label="Value at cost" value={money(inventory.atCost, symbol, { compact: true })} />
          <SummaryStat label="Value at retail" value={money(inventory.atRetail, symbol, { compact: true })} />
          <SummaryStat label="Potential margin" value={money(potentialMargin, symbol, { compact: true })} />
          <SummaryStat label="SKUs carried" value={fmtNumber(inventory.skus)} />
          <SummaryStat
            label="Low stock lines"
            value={fmtNumber(lowStockAlerts.length)}
            icon={lowStockAlerts.length ? PackageSearch : undefined}
          />
          <SummaryStat
            label="Value at risk (expiry)"
            value={money(atRiskValue, symbol, { compact: true })}
          />
        </div>
      </Card>
    </div>
  );
}

function SummaryStat({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon?: typeof PackageSearch;
}) {
  return (
    <div>
      <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-pos-muted">
        {Icon ? <Icon size={12} /> : null}
        {label}
      </p>
      <p className="mt-1 text-lg font-semibold text-pos-heading sm:text-xl">{value}</p>
    </div>
  );
}

function ReportsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-10 w-72" />
      </div>
      <Skeleton className="h-24" />
      <Skeleton className="h-80" />
      <Skeleton className="h-96" />
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Skeleton className="h-72" />
        <Skeleton className="h-72 xl:col-span-2" />
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Skeleton className="h-64" />
        <Skeleton className="h-64" />
      </div>
      <Skeleton className="h-32" />
    </div>
  );
}
