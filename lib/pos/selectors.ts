// Derived analytics over the demo dataset.
//
// Every selector takes an explicit `scope` so the Main Branch consolidated view
// ("all") and a single-branch view share exactly one code path.

import type {
  BranchScope,
  PosData,
  Product,
  Sale,
  StockBatch,
} from "./types";

const dayKey = (iso: string) => iso.slice(0, 10);

export const inScope = (branchId: string, scope: BranchScope) =>
  scope === "all" || branchId === scope;

export function scopedSales(data: PosData, scope: BranchScope): Sale[] {
  return data.sales.filter((s) => inScope(s.branchId, scope));
}

export function scopedStock(data: PosData, scope: BranchScope): StockBatch[] {
  return data.stock.filter((b) => inScope(b.branchId, scope));
}

/** Total units of a product on hand, optionally within one branch. */
export function unitsOnHand(
  data: PosData,
  productId: string,
  scope: BranchScope,
): number {
  return scopedStock(data, scope)
    .filter((b) => b.productId === productId)
    .reduce((sum, b) => sum + b.quantity, 0);
}

export interface KpiSet {
  revenue: number;
  revenuePrev: number;
  transactions: number;
  transactionsPrev: number;
  itemsSold: number;
  grossProfit: number;
  grossProfitPrev: number;
  averageBasket: number;
  averageBasketPrev: number;
}

/** Headline numbers for the last `days`, with the preceding window for deltas. */
export function kpis(data: PosData, scope: BranchScope, days = 30): KpiSet {
  const sales = scopedSales(data, scope).filter((s) => s.status === "completed");
  const now = Date.now();
  const windowMs = days * 864e5;
  const costById = new Map(data.products.map((p) => [p.id, p.costPrice]));

  const current = sales.filter(
    (s) => now - new Date(s.createdAt).getTime() <= windowMs,
  );
  const previous = sales.filter((s) => {
    const age = now - new Date(s.createdAt).getTime();
    return age > windowMs && age <= windowMs * 2;
  });

  const revenue = current.reduce((sum, s) => sum + s.total, 0);
  const revenuePrev = previous.reduce((sum, s) => sum + s.total, 0);

  const profitOf = (list: Sale[]) =>
    list.reduce(
      (sum, s) =>
        sum +
        s.lines.reduce(
          (ls, l) =>
            ls + (l.unitPrice - (costById.get(l.productId) ?? 0)) * l.quantity - l.discount,
          0,
        ),
      0,
    );

  const itemsSold = current.reduce(
    (sum, s) => sum + s.lines.reduce((ls, l) => ls + l.quantity, 0),
    0,
  );

  return {
    revenue,
    revenuePrev,
    transactions: current.length,
    transactionsPrev: previous.length,
    itemsSold,
    grossProfit: profitOf(current),
    grossProfitPrev: profitOf(previous),
    averageBasket: current.length ? revenue / current.length : 0,
    averageBasketPrev: previous.length ? revenuePrev / previous.length : 0,
  };
}

/** Percentage change, guarding against a zero baseline. */
export function delta(current: number, previous: number): number {
  if (previous === 0) return current === 0 ? 0 : 100;
  return ((current - previous) / previous) * 100;
}

export interface SeriesPoint {
  date: string;
  label: string;
  revenue: number;
  transactions: number;
  profit: number;
}

/** Daily revenue series for the last `days`, zero-filled. */
export function revenueSeries(
  data: PosData,
  scope: BranchScope,
  days = 30,
): SeriesPoint[] {
  const sales = scopedSales(data, scope).filter((s) => s.status === "completed");
  const costById = new Map(data.products.map((p) => [p.id, p.costPrice]));
  const buckets = new Map<string, SeriesPoint>();

  for (let i = days - 1; i >= 0; i -= 1) {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    buckets.set(key, {
      date: key,
      label: d.toLocaleDateString("en-GB", { day: "numeric", month: "short" }),
      revenue: 0,
      transactions: 0,
      profit: 0,
    });
  }

  for (const sale of sales) {
    const bucket = buckets.get(dayKey(sale.createdAt));
    if (!bucket) continue;
    bucket.revenue += sale.total;
    bucket.transactions += 1;
    bucket.profit += sale.lines.reduce(
      (sum, l) =>
        sum + (l.unitPrice - (costById.get(l.productId) ?? 0)) * l.quantity - l.discount,
      0,
    );
  }

  return [...buckets.values()];
}

export interface BranchPerformance {
  branchId: string;
  name: string;
  code: string;
  isMain: boolean;
  revenue: number;
  transactions: number;
  profit: number;
  stockValue: number;
  share: number; // % of total revenue
}

/** Per-branch league table — the heart of the Main Branch overview. */
export function branchPerformance(
  data: PosData,
  days = 30,
): BranchPerformance[] {
  const now = Date.now();
  const windowMs = days * 864e5;
  const costById = new Map(data.products.map((p) => [p.id, p.costPrice]));
  const retailById = new Map(data.products.map((p) => [p.id, p.sellPrice]));

  const rows = data.branches.map((branch) => {
    const sales = data.sales.filter(
      (s) =>
        s.branchId === branch.id &&
        s.status === "completed" &&
        now - new Date(s.createdAt).getTime() <= windowMs,
    );

    const revenue = sales.reduce((sum, s) => sum + s.total, 0);
    const profit = sales.reduce(
      (sum, s) =>
        sum +
        s.lines.reduce(
          (ls, l) =>
            ls + (l.unitPrice - (costById.get(l.productId) ?? 0)) * l.quantity - l.discount,
          0,
        ),
      0,
    );
    const stockValue = data.stock
      .filter((b) => b.branchId === branch.id)
      .reduce((sum, b) => sum + b.quantity * (retailById.get(b.productId) ?? 0), 0);

    return {
      branchId: branch.id,
      name: branch.name,
      code: branch.code,
      isMain: branch.isMain,
      revenue,
      transactions: sales.length,
      profit,
      stockValue,
      share: 0,
    };
  });

  const total = rows.reduce((sum, r) => sum + r.revenue, 0);
  for (const row of rows) {
    row.share = total ? (row.revenue / total) * 100 : 0;
  }

  return rows.sort((a, b) => b.revenue - a.revenue);
}

export interface TopProduct {
  product: Product;
  unitsSold: number;
  revenue: number;
}

export function topProducts(
  data: PosData,
  scope: BranchScope,
  days = 30,
  limit = 8,
): TopProduct[] {
  const now = Date.now();
  const windowMs = days * 864e5;
  const byId = new Map(data.products.map((p) => [p.id, p]));
  const totals = new Map<string, { units: number; revenue: number }>();

  for (const sale of scopedSales(data, scope)) {
    if (sale.status !== "completed") continue;
    if (now - new Date(sale.createdAt).getTime() > windowMs) continue;
    for (const line of sale.lines) {
      const entry = totals.get(line.productId) ?? { units: 0, revenue: 0 };
      entry.units += line.quantity;
      entry.revenue += line.unitPrice * line.quantity - line.discount;
      totals.set(line.productId, entry);
    }
  }

  return [...totals.entries()]
    .map(([productId, t]) => ({
      product: byId.get(productId)!,
      unitsSold: t.units,
      revenue: t.revenue,
    }))
    .filter((r) => r.product)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, limit);
}

export function salesByCategory(data: PosData, scope: BranchScope, days = 30) {
  const now = Date.now();
  const windowMs = days * 864e5;
  const byId = new Map(data.products.map((p) => [p.id, p]));
  const totals = new Map<string, number>();

  for (const sale of scopedSales(data, scope)) {
    if (sale.status !== "completed") continue;
    if (now - new Date(sale.createdAt).getTime() > windowMs) continue;
    for (const line of sale.lines) {
      const category = byId.get(line.productId)?.category;
      if (!category) continue;
      totals.set(
        category,
        (totals.get(category) ?? 0) + line.unitPrice * line.quantity - line.discount,
      );
    }
  }

  return [...totals.entries()]
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
}

export function paymentMix(data: PosData, scope: BranchScope, days = 30) {
  const now = Date.now();
  const windowMs = days * 864e5;
  const totals = new Map<string, number>();

  for (const sale of scopedSales(data, scope)) {
    if (sale.status !== "completed") continue;
    if (now - new Date(sale.createdAt).getTime() > windowMs) continue;
    totals.set(sale.paymentMethod, (totals.get(sale.paymentMethod) ?? 0) + sale.total);
  }

  return [...totals.entries()].map(([name, value]) => ({ name, value }));
}

export interface StockAlert {
  product: Product;
  branchId: string;
  branchName: string;
  onHand: number;
  reorderLevel: number;
}

/** Products at or below reorder level, per branch. */
export function lowStock(
  data: PosData,
  scope: BranchScope,
  limit?: number,
): StockAlert[] {
  const branchName = new Map(data.branches.map((b) => [b.id, b.name]));
  const alerts: StockAlert[] = [];

  const branchIds =
    scope === "all" ? data.branches.map((b) => b.id) : [scope];

  for (const branchId of branchIds) {
    for (const product of data.products) {
      const onHand = data.stock
        .filter((b) => b.branchId === branchId && b.productId === product.id)
        .reduce((sum, b) => sum + b.quantity, 0);

      // Skip products this branch has never carried — only flag real gaps.
      const carries = data.stock.some(
        (b) => b.branchId === branchId && b.productId === product.id,
      );
      if (!carries) continue;

      if (onHand <= product.reorderLevel) {
        alerts.push({
          product,
          branchId,
          branchName: branchName.get(branchId) ?? "",
          onHand,
          reorderLevel: product.reorderLevel,
        });
      }
    }
  }

  const sorted = alerts.sort(
    (a, b) => a.onHand / a.reorderLevel - b.onHand / b.reorderLevel,
  );
  return limit ? sorted.slice(0, limit) : sorted;
}

export interface ExpiryAlert {
  batch: StockBatch;
  product: Product;
  branchName: string;
  daysLeft: number;
  value: number;
}

/** Batches already expired or expiring within the configured window. */
export function expiringBatches(
  data: PosData,
  scope: BranchScope,
  limit?: number,
): ExpiryAlert[] {
  const byId = new Map(data.products.map((p) => [p.id, p]));
  const branchName = new Map(data.branches.map((b) => [b.id, b.name]));
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const windowDays = data.settings.expiryWarningDays;

  const alerts = scopedStock(data, scope)
    .filter((b) => b.quantity > 0)
    .map((batch) => {
      const product = byId.get(batch.productId);
      const daysLeft = Math.round(
        (new Date(batch.expiryDate).getTime() - now.getTime()) / 864e5,
      );
      return {
        batch,
        product: product!,
        branchName: branchName.get(batch.branchId) ?? "",
        daysLeft,
        value: batch.quantity * (product?.costPrice ?? 0),
      };
    })
    .filter((a) => a.product && a.daysLeft <= windowDays)
    .sort((a, b) => a.daysLeft - b.daysLeft);

  return limit ? alerts.slice(0, limit) : alerts;
}

/** Retail value of everything on hand, in scope. */
export function stockValue(data: PosData, scope: BranchScope) {
  const cost = new Map(data.products.map((p) => [p.id, p.costPrice]));
  const retail = new Map(data.products.map((p) => [p.id, p.sellPrice]));
  const batches = scopedStock(data, scope);

  return {
    atCost: batches.reduce((s, b) => s + b.quantity * (cost.get(b.productId) ?? 0), 0),
    atRetail: batches.reduce((s, b) => s + b.quantity * (retail.get(b.productId) ?? 0), 0),
    units: batches.reduce((s, b) => s + b.quantity, 0),
    skus: new Set(batches.filter((b) => b.quantity > 0).map((b) => b.productId)).size,
  };
}

/** Hour-of-day sales distribution — drives staffing recommendations. */
export function hourlyTraffic(data: PosData, scope: BranchScope, days = 30) {
  const now = Date.now();
  const windowMs = days * 864e5;
  const hours = Array.from({ length: 13 }, (_, i) => ({
    hour: i + 8,
    label: `${i + 8}:00`,
    transactions: 0,
    revenue: 0,
  }));

  for (const sale of scopedSales(data, scope)) {
    if (sale.status !== "completed") continue;
    if (now - new Date(sale.createdAt).getTime() > windowMs) continue;
    const h = new Date(sale.createdAt).getHours();
    const bucket = hours.find((x) => x.hour === h);
    if (bucket) {
      bucket.transactions += 1;
      bucket.revenue += sale.total;
    }
  }

  return hours;
}
