"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, Boxes, Clock3, Package, PackagePlus, PlusCircle } from "lucide-react";
import { usePos } from "@/lib/pos/store";
import { expiringBatches, scopedStock, stockValue } from "@/lib/pos/selectors";
import { money, number as fmtNumber } from "@/lib/pos/format";
import type { DrugCategory, Product } from "@/lib/pos/types";
import {
  Badge,
  Button,
  Card,
  DataTable,
  DataTableColumn,
  EmptyState,
  Input,
  PageHeader,
  Select,
  Skeleton,
  StatTile,
  cn,
} from "@/components/pos/ui";
import { ProductDetailModal } from "@/components/pos/inventory/ProductDetailModal";
import { AddProductModal } from "@/components/pos/inventory/AddProductModal";
import { ReceiveStockModal } from "@/components/pos/inventory/ReceiveStockModal";

type Tab = "all" | "low" | "expiring" | "out";

const TABS: { id: Tab; label: string }[] = [
  { id: "all", label: "All products" },
  { id: "low", label: "Low stock" },
  { id: "expiring", label: "Expiring soon" },
  { id: "out", label: "Out of stock" },
];

interface ProductRow {
  product: Product;
  onHand: number;
  status: "In stock" | "Low" | "Out of stock";
}

export default function InventoryPage() {
  const { data, scope, ready } = usePos();
  const [tab, setTab] = useState<Tab>("all");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>("all");
  const [rxOnly, setRxOnly] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [receiveOpen, setReceiveOpen] = useState(false);

  // Heavy pass over the (large) stock table — recomputed only when data or scope change.
  const baseRows = useMemo<ProductRow[]>(() => {
    if (!ready) return [];
    const batches = scopedStock(data, scope);
    const onHandById = new Map<string, number>();
    for (const b of batches) {
      onHandById.set(b.productId, (onHandById.get(b.productId) ?? 0) + b.quantity);
    }
    return data.products.map((product) => {
      const onHand = onHandById.get(product.id) ?? 0;
      const status: ProductRow["status"] =
        onHand <= 0 ? "Out of stock" : onHand <= product.reorderLevel ? "Low" : "In stock";
      return { product, onHand, status };
    });
  }, [ready, data, scope]);

  const expiryAlerts = useMemo(() => (ready ? expiringBatches(data, scope) : []), [ready, data, scope]);
  const expiringProductIds = useMemo(
    () => new Set(expiryAlerts.map((a) => a.product?.id).filter(Boolean) as string[]),
    [expiryAlerts],
  );
  const stats = useMemo(() => (ready ? stockValue(data, scope) : { atRetail: 0, atCost: 0, units: 0, skus: 0 }), [
    ready,
    data,
    scope,
  ]);
  // Light pass — cheap filtering over the already-derived rows.
  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return baseRows.filter(({ product, status }) => {
      if (tab === "low" && status !== "Low") return false;
      if (tab === "out" && status !== "Out of stock") return false;
      if (tab === "expiring" && !expiringProductIds.has(product.id)) return false;
      if (category !== "all" && product.category !== category) return false;
      if (rxOnly && !product.prescriptionOnly) return false;
      if (q) {
        const hay = `${product.name} ${product.genericName} ${product.brand} ${product.barcode}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [baseRows, tab, category, rxOnly, search, expiringProductIds]);

  const tabCounts = useMemo(
    () => ({
      all: baseRows.length,
      low: baseRows.filter((r) => r.status === "Low").length,
      expiring: baseRows.filter((r) => expiringProductIds.has(r.product.id)).length,
      out: baseRows.filter((r) => r.status === "Out of stock").length,
    }),
    [baseRows, expiringProductIds],
  );

  const columns: DataTableColumn<ProductRow>[] = [
    {
      key: "product",
      header: "Product",
      sortable: true,
      sortValue: (r) => r.product.name,
      render: (r) => (
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="font-medium text-pos-heading">{r.product.name}</span>
            {r.product.prescriptionOnly ? <Badge tone="accent">Rx</Badge> : null}
            {r.product.controlled ? <Badge tone="violet">Ctrl</Badge> : null}
          </div>
          <p className="mt-0.5 truncate text-xs text-pos-muted">
            {r.product.strength} · {r.product.form}
          </p>
        </div>
      ),
    },
    {
      key: "category",
      header: "Category",
      sortable: true,
      sortValue: (r) => r.product.category,
      render: (r) => <span className="text-pos-muted">{r.product.category}</span>,
    },
    {
      key: "barcode",
      header: "Barcode",
      render: (r) => <span className="font-mono text-xs text-pos-muted">{r.product.barcode}</span>,
    },
    {
      key: "cost",
      header: "Cost",
      align: "right",
      sortable: true,
      sortValue: (r) => r.product.costPrice,
      render: (r) => money(r.product.costPrice, data.settings.currencySymbol),
    },
    {
      key: "sell",
      header: "Sell",
      align: "right",
      sortable: true,
      sortValue: (r) => r.product.sellPrice,
      render: (r) => money(r.product.sellPrice, data.settings.currencySymbol),
    },
    {
      key: "margin",
      header: "Margin",
      align: "right",
      sortable: true,
      sortValue: (r) =>
        r.product.sellPrice > 0
          ? ((r.product.sellPrice - r.product.costPrice) / r.product.sellPrice) * 100
          : 0,
      render: (r) => {
        const margin =
          r.product.sellPrice > 0
            ? ((r.product.sellPrice - r.product.costPrice) / r.product.sellPrice) * 100
            : 0;
        return `${margin.toFixed(1)}%`;
      },
    },
    {
      key: "onHand",
      header: "On hand",
      align: "right",
      sortable: true,
      sortValue: (r) => r.onHand,
      render: (r) => fmtNumber(r.onHand),
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      sortValue: (r) => r.status,
      render: (r) => (
        <Badge tone={r.status === "In stock" ? "ok" : r.status === "Low" ? "warn" : "danger"}>
          {r.status}
        </Badge>
      ),
    },
  ];

  if (!ready) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-9 w-64" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Inventory"
        subtitle={
          scope === "all"
            ? "Products and stock across every branch."
            : "Products and stock for the current branch."
        }
        actions={
          <>
            <Button variant="secondary" icon={PackagePlus} onClick={() => setReceiveOpen(true)}>
              Receive stock
            </Button>
            <Button icon={PlusCircle} onClick={() => setAddOpen(true)}>
              Add product
            </Button>
          </>
        }
      />

      {/* Tiles */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label="Total SKUs" value={fmtNumber(stats.skus)} icon={Package} tone="brand" />
        <StatTile label="Units on hand" value={fmtNumber(stats.units)} icon={Boxes} tone="accent" />
        <StatTile
          label="Stock value (retail)"
          value={money(stats.atRetail, data.settings.currencySymbol, { compact: true })}
          icon={Boxes}
          tone="ok"
        />
        <StatTile
          label="Low stock products"
          value={fmtNumber(tabCounts.low)}
          icon={AlertTriangle}
          tone={tabCounts.low > 0 ? "danger" : "ok"}
        />
      </div>

      <Card>
        {/* Tabs */}
        <div className="mb-5 flex flex-wrap gap-1.5 border-b border-pos-border pb-4">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors",
                tab === t.id
                  ? "bg-pos-brand text-white"
                  : "bg-pos-bg text-pos-muted hover:text-pos-heading",
              )}
            >
              {t.label}
              <span
                className={cn(
                  "rounded-full px-1.5 text-xs",
                  tab === t.id ? "bg-white/20" : "bg-white text-pos-muted",
                )}
              >
                {tabCounts[t.id]}
              </span>
            </button>
          ))}
        </div>

        {/* Filters */}
        <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-[1fr_200px_auto]">
          <Input
            placeholder="Search name, generic, brand or barcode…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Select value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="all">All categories</option>
            {(Array.from(new Set(data.products.map((p) => p.category))) as DrugCategory[])
              .sort()
              .map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
          </Select>
          <label className="flex items-center gap-2 rounded-xl border border-pos-border bg-white px-3.5 py-2.5 text-sm text-pos-heading">
            <input
              type="checkbox"
              checked={rxOnly}
              onChange={(e) => setRxOnly(e.target.checked)}
              className="h-4 w-4 rounded border-pos-border text-pos-brand focus:ring-pos-brand/40"
            />
            Rx only
          </label>
        </div>

        <DataTable
          columns={columns}
          rows={filteredRows}
          keyOf={(r) => r.product.id}
          pageSize={10}
          onRowClick={(r) => setSelectedProduct(r.product)}
          empty={
            <EmptyState
              icon={Clock3}
              title="No products match your filters"
              description="Try clearing the search, category or tab filters."
            />
          }
        />
      </Card>

      <ProductDetailModal product={selectedProduct} onClose={() => setSelectedProduct(null)} />
      <AddProductModal open={addOpen} onClose={() => setAddOpen(false)} />
      <ReceiveStockModal open={receiveOpen} onClose={() => setReceiveOpen(false)} />
    </div>
  );
}
