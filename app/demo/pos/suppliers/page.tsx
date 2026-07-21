"use client";

import { useMemo, useState } from "react";
import { Clock3, Package, Truck, Wallet } from "lucide-react";
import { usePos } from "@/lib/pos/store";
import { scopedStock } from "@/lib/pos/selectors";
import { money, number as fmtNumber } from "@/lib/pos/format";
import type { Supplier } from "@/lib/pos/types";
import {
  Card,
  DataTable,
  DataTableColumn,
  EmptyState,
  PageHeader,
  Skeleton,
  StatTile,
} from "@/components/pos/ui";
import { SupplierDetailModal } from "@/components/pos/inventory/SupplierDetailModal";

interface SupplierRow {
  supplier: Supplier;
  productCount: number;
  stockValue: number;
}

export default function SuppliersPage() {
  const { data, scope, ready } = usePos();
  const [selected, setSelected] = useState<Supplier | null>(null);

  const rows = useMemo<SupplierRow[]>(() => {
    if (!ready) return [];
    const batches = scopedStock(data, scope);
    const onHandById = new Map<string, number>();
    for (const b of batches) {
      onHandById.set(b.productId, (onHandById.get(b.productId) ?? 0) + b.quantity);
    }
    return data.suppliers.map((supplier) => {
      const products = data.products.filter((p) => p.supplierId === supplier.id);
      const value = products.reduce(
        (sum, p) => sum + (onHandById.get(p.id) ?? 0) * p.sellPrice,
        0,
      );
      return { supplier, productCount: products.length, stockValue: value };
    });
  }, [ready, data, scope]);

  const stats = useMemo(() => {
    if (!ready) return { suppliers: 0, products: 0, avgLead: 0, totalValue: 0 };
    const avgLead = data.suppliers.length
      ? data.suppliers.reduce((sum, s) => sum + s.leadTimeDays, 0) / data.suppliers.length
      : 0;
    return {
      suppliers: data.suppliers.length,
      products: data.products.filter((p) => data.suppliers.some((s) => s.id === p.supplierId)).length,
      avgLead,
      totalValue: rows.reduce((sum, r) => sum + r.stockValue, 0),
    };
  }, [ready, data, rows]);

  const columns: DataTableColumn<SupplierRow>[] = [
    {
      key: "name",
      header: "Supplier",
      sortable: true,
      sortValue: (r) => r.supplier.name,
      render: (r) => (
        <div className="min-w-0">
          <p className="font-medium text-pos-heading">{r.supplier.name}</p>
          <p className="mt-0.5 truncate text-xs text-pos-muted">{r.supplier.contact}</p>
        </div>
      ),
    },
    {
      key: "phone",
      header: "Phone",
      render: (r) => <span className="text-pos-muted">{r.supplier.phone}</span>,
    },
    {
      key: "email",
      header: "Email",
      render: (r) => <span className="text-pos-muted">{r.supplier.email}</span>,
    },
    {
      key: "lead",
      header: "Lead time",
      align: "right",
      sortable: true,
      sortValue: (r) => r.supplier.leadTimeDays,
      render: (r) => `${r.supplier.leadTimeDays}d`,
    },
    {
      key: "products",
      header: "Products",
      align: "right",
      sortable: true,
      sortValue: (r) => r.productCount,
      render: (r) => fmtNumber(r.productCount),
    },
    {
      key: "value",
      header: "Stock value",
      align: "right",
      sortable: true,
      sortValue: (r) => r.stockValue,
      render: (r) => money(r.stockValue, data.settings.currencySymbol),
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
        title="Suppliers"
        subtitle={
          scope === "all"
            ? "Vendors sourcing stock across every branch."
            : "Vendors sourcing stock for the current branch."
        }
      />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label="Total suppliers" value={fmtNumber(stats.suppliers)} icon={Truck} tone="brand" />
        <StatTile label="Products supplied" value={fmtNumber(stats.products)} icon={Package} tone="accent" />
        <StatTile label="Average lead time" value={`${stats.avgLead.toFixed(1)}d`} icon={Clock3} tone="warn" />
        <StatTile
          label="Stock value sourced"
          value={money(stats.totalValue, data.settings.currencySymbol, { compact: true })}
          icon={Wallet}
          tone="ok"
        />
      </div>

      <Card>
        <DataTable
          columns={columns}
          rows={rows}
          keyOf={(r) => r.supplier.id}
          pageSize={10}
          onRowClick={(r) => setSelected(r.supplier)}
          empty={
            <EmptyState
              icon={Truck}
              title="No suppliers yet"
              description="Suppliers you add will appear here."
            />
          }
        />
      </Card>

      <SupplierDetailModal supplier={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
