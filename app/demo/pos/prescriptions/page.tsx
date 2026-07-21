"use client";

import { useMemo, useState } from "react";
import { ClipboardList, Pill, ShieldAlert, Stethoscope } from "lucide-react";
import { usePos } from "@/lib/pos/store";
import { scopedSales } from "@/lib/pos/selectors";
import { dateTime, money, number, percent } from "@/lib/pos/format";
import type { Product, Sale } from "@/lib/pos/types";
import {
  Badge,
  Card,
  CardHeader,
  DataTable,
  type DataTableColumn,
  Input,
  Modal,
  PageHeader,
  Select,
  Skeleton,
  StatTile,
} from "@/components/pos/ui";

type DateRange = "today" | "7d" | "30d" | "all";

function withinRange(iso: string, range: DateRange): boolean {
  if (range === "all") return true;
  const now = Date.now();
  const days = range === "today" ? 1 : range === "7d" ? 7 : 30;
  const start = range === "today" ? new Date().setHours(0, 0, 0, 0) : now - days * 864e5;
  return new Date(iso).getTime() >= start;
}

interface RxRow {
  id: string;
  sale: Sale;
  ref: string;
  branchId: string;
  rxLines: { name: string; strength: string; quantity: number; value: number; controlled: boolean }[];
  totalValue: number;
}

interface ControlledRow {
  id: string;
  ref: string;
  createdAt: string;
  branchId: string;
  productName: string;
  quantity: number;
  pharmacist: string;
}

export default function PrescriptionsPage() {
  const { data, ready, scope } = usePos();

  const [search, setSearch] = useState("");
  const [dateRange, setDateRange] = useState<DateRange>("30d");
  const [selected, setSelected] = useState<RxRow | null>(null);

  const branchName = useMemo(() => new Map(data.branches.map((b) => [b.id, b.name])), [data.branches]);
  const productById = useMemo(() => new Map<string, Product>(data.products.map((p) => [p.id, p])), [data.products]);

  const scopedInRange = useMemo(() => {
    if (!ready) return [];
    return scopedSales(data, scope).filter((s) => withinRange(s.createdAt, dateRange));
  }, [ready, data, scope, dateRange]);

  const rxRows: RxRow[] = useMemo(() => {
    const rows: RxRow[] = [];
    for (const sale of scopedInRange) {
      if (!sale.prescriptionRef) continue;
      const rxLines = sale.lines
        .map((l) => ({ line: l, product: productById.get(l.productId) }))
        .filter((x) => x.product?.prescriptionOnly)
        .map((x) => ({
          name: x.line.name,
          strength: x.line.strength,
          quantity: x.line.quantity,
          value: x.line.unitPrice * x.line.quantity - x.line.discount,
          controlled: !!x.product?.controlled,
        }));
      if (rxLines.length === 0) continue;
      rows.push({
        id: sale.id,
        sale,
        ref: sale.prescriptionRef,
        branchId: sale.branchId,
        rxLines,
        totalValue: rxLines.reduce((sum, l) => sum + l.value, 0),
      });
    }
    return rows.sort((a, b) => b.sale.createdAt.localeCompare(a.sale.createdAt));
  }, [scopedInRange, productById]);

  const filteredRxRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rxRows;
    return rxRows.filter(
      (r) =>
        r.ref.toLowerCase().includes(q) ||
        (r.sale.customerName ?? "").toLowerCase().includes(q) ||
        r.sale.cashierName.toLowerCase().includes(q) ||
        r.rxLines.some((l) => l.name.toLowerCase().includes(q)),
    );
  }, [rxRows, search]);

  const controlledRows: ControlledRow[] = useMemo(() => {
    const rows: ControlledRow[] = [];
    for (const sale of scopedInRange) {
      for (const line of sale.lines) {
        const product = productById.get(line.productId);
        if (!product?.controlled) continue;
        rows.push({
          id: `${sale.id}-${line.productId}`,
          ref: sale.prescriptionRef ?? sale.receiptNo,
          createdAt: sale.createdAt,
          branchId: sale.branchId,
          productName: line.name,
          quantity: line.quantity,
          pharmacist: sale.cashierName,
        });
      }
    }
    return rows.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [scopedInRange, productById]);

  const tiles = useMemo(() => {
    const totalPrescriptions = rxRows.length;
    const uniqueItems = new Set(
      rxRows.flatMap((r) => r.rxLines.map((l) => l.name)),
    ).size;
    const totalRevenue = scopedInRange.reduce((sum, s) => sum + s.total, 0);
    const rxRevenue = rxRows.reduce((sum, r) => sum + r.totalValue, 0);
    const rxSharePct = totalRevenue ? (rxRevenue / totalRevenue) * 100 : 0;
    return {
      totalPrescriptions,
      uniqueItems,
      rxSharePct,
      controlledDispenses: controlledRows.length,
    };
  }, [rxRows, scopedInRange, controlledRows]);

  const rxColumns: DataTableColumn<RxRow>[] = useMemo(() => {
    const cols: DataTableColumn<RxRow>[] = [
      { key: "ref", header: "Rx reference", sortable: true, render: (r) => <span className="font-medium">{r.ref}</span> },
      { key: "date", header: "Date", sortable: true, sortValue: (r) => r.sale.createdAt, render: (r) => dateTime(r.sale.createdAt) },
    ];
    if (scope === "all") {
      cols.push({
        key: "branch",
        header: "Branch",
        sortable: true,
        sortValue: (r) => branchName.get(r.branchId) ?? "",
        render: (r) => branchName.get(r.branchId) ?? "—",
      });
    }
    cols.push(
      { key: "customer", header: "Patient", sortable: true, sortValue: (r) => r.sale.customerName ?? "", render: (r) => r.sale.customerName || "Walk-in Customer" },
      { key: "pharmacist", header: "Pharmacist", sortable: true, sortValue: (r) => r.sale.cashierName, render: (r) => r.sale.cashierName },
      {
        key: "items",
        header: "Rx items",
        render: (r) => (
          <span className="text-xs text-pos-muted">
            {r.rxLines.map((l) => `${l.name} ×${l.quantity}`).join(", ")}
          </span>
        ),
      },
      {
        key: "value",
        header: "Total value",
        align: "right",
        sortable: true,
        sortValue: (r) => r.totalValue,
        render: (r) => <span className="font-semibold">{money(r.totalValue, data.settings.currencySymbol)}</span>,
      },
    );
    return cols;
  }, [scope, branchName, data.settings.currencySymbol]);

  const controlledColumns: DataTableColumn<ControlledRow>[] = useMemo(() => {
    const cols: DataTableColumn<ControlledRow>[] = [
      { key: "ref", header: "Reference", sortable: true },
      { key: "date", header: "Date", sortable: true, sortValue: (r) => r.createdAt, render: (r) => dateTime(r.createdAt) },
      { key: "product", header: "Product", sortable: true, render: (r) => r.productName },
      { key: "quantity", header: "Qty", align: "right", sortable: true },
      { key: "pharmacist", header: "Pharmacist", sortable: true },
    ];
    if (scope === "all") {
      cols.push({
        key: "branch",
        header: "Branch",
        sortable: true,
        sortValue: (r) => branchName.get(r.branchId) ?? "",
        render: (r) => branchName.get(r.branchId) ?? "—",
      });
    }
    return cols;
  }, [scope, branchName]);

  if (!ready) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-9 w-64" />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
        <Skeleton className="h-96" />
        <Skeleton className="h-72" />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Prescriptions"
        subtitle={scope === "all" ? "All branches — dispensing & controlled substance audit trail" : "Dispensing & controlled substance audit trail"}
      />

      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatTile label="Prescriptions in period" value={number(tiles.totalPrescriptions)} icon={ClipboardList} tone="brand" />
        <StatTile label="Unique Rx items dispensed" value={number(tiles.uniqueItems)} icon={Pill} tone="accent" />
        <StatTile label="% revenue from Rx" value={percent(tiles.rxSharePct).replace("+", "")} icon={Stethoscope} tone="ok" />
        <StatTile label="Controlled dispenses" value={number(tiles.controlledDispenses)} icon={ShieldAlert} tone="danger" />
      </div>

      <Card className="mb-6">
        <CardHeader title="Filters" />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Input
            containerClassName="sm:col-span-2"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search Rx reference, patient, pharmacist or item..."
            aria-label="Search prescriptions"
          />
          <Select value={dateRange} onChange={(e) => setDateRange(e.target.value as DateRange)} aria-label="Date range">
            <option value="today">Today</option>
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="all">All time</option>
          </Select>
        </div>
      </Card>

      <Card className="mb-6">
        <CardHeader title="Prescriptions dispensed" subtitle={`${filteredRxRows.length} records`} />
        <DataTable
          columns={rxColumns}
          rows={filteredRxRows}
          keyOf={(r) => r.id}
          onRowClick={(r) => setSelected(r)}
          pageSize={10}
        />
      </Card>

      <Card>
        <CardHeader
          title="Controlled substances register"
          subtitle="Every controlled-substance dispense — the audit trail a regulator would ask for"
        />
        <DataTable columns={controlledColumns} rows={controlledRows} keyOf={(r) => r.id} pageSize={10} />
      </Card>

      <RxDetailModal
        row={selected}
        branchName={selected ? branchName.get(selected.branchId) ?? "—" : "—"}
        currencySymbol={data.settings.currencySymbol}
        onClose={() => setSelected(null)}
      />
    </div>
  );
}

function RxDetailModal({
  row,
  branchName,
  currencySymbol,
  onClose,
}: {
  row: RxRow | null;
  branchName: string;
  currencySymbol: string;
  onClose: () => void;
}) {
  if (!row) return null;
  return (
    <Modal open={!!row} onClose={onClose} title={row.ref} subtitle={`${dateTime(row.sale.createdAt)} · ${branchName}`} size="md">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-xs text-pos-muted">Patient</p>
            <p className="font-medium text-pos-heading">{row.sale.customerName || "Walk-in Customer"}</p>
          </div>
          <div>
            <p className="text-xs text-pos-muted">Dispensing pharmacist</p>
            <p className="font-medium text-pos-heading">{row.sale.cashierName}</p>
          </div>
          <div>
            <p className="text-xs text-pos-muted">Receipt</p>
            <p className="font-medium text-pos-heading">{row.sale.receiptNo}</p>
          </div>
          <div>
            <p className="text-xs text-pos-muted">Total Rx value</p>
            <p className="font-medium text-pos-heading">{money(row.totalValue, currencySymbol)}</p>
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-pos-border">
          <table className="w-full text-sm">
            <thead className="bg-pos-bg text-xs uppercase tracking-wide text-pos-muted">
              <tr>
                <th className="px-3 py-2 text-left">Item</th>
                <th className="px-3 py-2 text-right">Qty</th>
                <th className="px-3 py-2 text-right">Value</th>
                <th className="px-3 py-2 text-center">Controlled</th>
              </tr>
            </thead>
            <tbody>
              {row.rxLines.map((l) => (
                <tr key={l.name} className="border-t border-pos-border">
                  <td className="px-3 py-2">
                    <p className="font-medium text-pos-heading">{l.name}</p>
                    <p className="text-xs text-pos-muted">{l.strength}</p>
                  </td>
                  <td className="px-3 py-2 text-right">{l.quantity}</td>
                  <td className="px-3 py-2 text-right font-semibold">{money(l.value, currencySymbol)}</td>
                  <td className="px-3 py-2 text-center">
                    {l.controlled ? <Badge tone="danger">Controlled</Badge> : <span className="text-pos-muted">—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Modal>
  );
}
