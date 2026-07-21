"use client";

import { useMemo, useState } from "react";
import {
  Banknote,
  CreditCard,
  Download,
  Receipt,
  RotateCcw,
  ShoppingBag,
  Smartphone,
  ShieldCheck,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { usePos } from "@/lib/pos/store";
import { scopedSales } from "@/lib/pos/selectors";
import { dateTime, money, number } from "@/lib/pos/format";
import type { PaymentMethod, Sale } from "@/lib/pos/types";
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
  useToast,
} from "@/components/pos/ui";

type DateRange = "today" | "7d" | "30d" | "all";
type StatusFilter = "All" | "completed" | "refunded";
type PaymentFilter = "All" | PaymentMethod;

const PAYMENT_ICON: Record<PaymentMethod, typeof Banknote> = {
  Cash: Banknote,
  Card: CreditCard,
  "Mobile Money": Smartphone,
  Insurance: ShieldCheck,
};

function withinRange(iso: string, range: DateRange): boolean {
  if (range === "all") return true;
  const now = Date.now();
  const days = range === "today" ? 1 : range === "7d" ? 7 : 30;
  const start =
    range === "today"
      ? new Date().setHours(0, 0, 0, 0)
      : now - days * 864e5;
  return new Date(iso).getTime() >= start;
}

function toCsvValue(v: string | number) {
  const s = String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export default function SalesHistoryPage() {
  const { data, ready, scope } = usePos();
  const { push } = useToast();

  const [search, setSearch] = useState("");
  const [dateRange, setDateRange] = useState<DateRange>("30d");
  const [paymentFilter, setPaymentFilter] = useState<PaymentFilter>("All");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("All");
  const [branchFilter, setBranchFilter] = useState<string>("all");
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [refundedIds, setRefundedIds] = useState<Set<string>>(new Set());

  const branchName = useMemo(() => new Map(data.branches.map((b) => [b.id, b.name])), [data.branches]);

  const displayStatus = (sale: Sale) => (refundedIds.has(sale.id) ? "refunded" : sale.status);

  const filteredSales = useMemo(() => {
    if (!ready) return [];
    let list = scopedSales(data, scope);
    if (scope === "all" && branchFilter !== "all") list = list.filter((s) => s.branchId === branchFilter);
    list = list.filter((s) => withinRange(s.createdAt, dateRange));
    if (paymentFilter !== "All") list = list.filter((s) => s.paymentMethod === paymentFilter);
    if (statusFilter !== "All") list = list.filter((s) => displayStatus(s) === statusFilter);
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (s) =>
          s.receiptNo.toLowerCase().includes(q) ||
          (s.customerName ?? "").toLowerCase().includes(q) ||
          s.cashierName.toLowerCase().includes(q),
      );
    }
    return [...list].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, data, scope, branchFilter, dateRange, paymentFilter, statusFilter, search, refundedIds]);

  const summary = useMemo(() => {
    const revenue = filteredSales.reduce((sum, s) => sum + s.total, 0);
    const items = filteredSales.reduce((sum, s) => sum + s.lines.reduce((ls, l) => ls + l.quantity, 0), 0);
    const transactions = filteredSales.length;
    return {
      revenue,
      transactions,
      items,
      averageBasket: transactions ? revenue / transactions : 0,
    };
  }, [filteredSales]);

  const handleRefund = (saleId: string) => {
    setRefundedIds((prev) => new Set(prev).add(saleId));
    push({
      title: "Refund recorded",
      description: "Refunds are simulated in this demo — no stock or ledger change occurs.",
      tone: "info",
    });
  };

  const handleExport = () => {
    const header = ["Receipt No", "Date", "Branch", "Customer", "Items", "Payment", "Total", "Status"];
    const rows = filteredSales.map((s) => [
      s.receiptNo,
      dateTime(s.createdAt),
      branchName.get(s.branchId) ?? s.branchId,
      s.customerName ?? "Walk-in Customer",
      s.lines.reduce((sum, l) => sum + l.quantity, 0),
      s.paymentMethod,
      s.total.toFixed(2),
      displayStatus(s),
    ]);
    const csv = [header, ...rows].map((r) => r.map(toCsvValue).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sales-history-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    push({ title: "Export ready", description: `${filteredSales.length} sales exported to CSV.`, tone: "success" });
  };

  const columns: DataTableColumn<Sale>[] = useMemo(() => {
    const cols: DataTableColumn<Sale>[] = [
      { key: "receiptNo", header: "Receipt No", sortable: true, render: (s) => <span className="font-medium">{s.receiptNo}</span> },
      { key: "createdAt", header: "Date / time", sortable: true, render: (s) => dateTime(s.createdAt) },
    ];
    if (scope === "all") {
      cols.push({
        key: "branch",
        header: "Branch",
        sortable: true,
        sortValue: (s) => branchName.get(s.branchId) ?? "",
        render: (s) => branchName.get(s.branchId) ?? "—",
      });
    }
    cols.push(
      { key: "customerName", header: "Customer", sortable: true, render: (s) => s.customerName || "Walk-in Customer" },
      {
        key: "items",
        header: "Items",
        align: "right",
        sortValue: (s) => s.lines.reduce((sum, l) => sum + l.quantity, 0),
        render: (s) => number(s.lines.reduce((sum, l) => sum + l.quantity, 0)),
      },
      {
        key: "paymentMethod",
        header: "Payment",
        sortable: true,
        render: (s) => (
          <Badge tone="neutral">
            {s.paymentMethod}
          </Badge>
        ),
      },
      {
        key: "total",
        header: "Total",
        align: "right",
        sortable: true,
        sortValue: (s) => s.total,
        render: (s) => <span className="font-semibold">{money(s.total, data.settings.currencySymbol)}</span>,
      },
      {
        key: "status",
        header: "Status",
        align: "center",
        sortValue: (s) => displayStatus(s),
        render: (s) => (
          <Badge tone={displayStatus(s) === "refunded" ? "danger" : "ok"}>
            {displayStatus(s) === "refunded" ? "Refunded" : "Completed"}
          </Badge>
        ),
      },
    );
    return cols;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scope, branchName, data.settings.currencySymbol, refundedIds]);

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
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Sales history"
        subtitle={scope === "all" ? "All branches" : undefined}
        actions={
          <button
            type="button"
            onClick={handleExport}
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-white px-4 text-sm font-medium text-pos-heading shadow-card hover:bg-pos-bg"
          >
            <Download size={16} />
            Export CSV
          </button>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatTile label="Total revenue" value={money(summary.revenue, data.settings.currencySymbol)} icon={TrendingUp} tone="brand" />
        <StatTile label="Transactions" value={number(summary.transactions)} icon={Receipt} tone="accent" />
        <StatTile label="Items sold" value={number(summary.items)} icon={ShoppingBag} tone="ok" />
        <StatTile label="Average basket" value={money(summary.averageBasket, data.settings.currencySymbol)} icon={Wallet} tone="violet" />
      </div>

      <Card className="mb-6">
        <CardHeader title="Filters" />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <Input
            containerClassName="lg:col-span-2"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search receipt no, customer or cashier..."
            aria-label="Search sales"
          />
          <Select value={dateRange} onChange={(e) => setDateRange(e.target.value as DateRange)} aria-label="Date range">
            <option value="today">Today</option>
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="all">All time</option>
          </Select>
          <Select value={paymentFilter} onChange={(e) => setPaymentFilter(e.target.value as PaymentFilter)} aria-label="Payment method">
            <option value="All">All payment methods</option>
            <option value="Cash">Cash</option>
            <option value="Card">Card</option>
            <option value="Mobile Money">Mobile Money</option>
            <option value="Insurance">Insurance</option>
          </Select>
          <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as StatusFilter)} aria-label="Status">
            <option value="All">All statuses</option>
            <option value="completed">Completed</option>
            <option value="refunded">Refunded</option>
          </Select>
          {scope === "all" ? (
            <Select value={branchFilter} onChange={(e) => setBranchFilter(e.target.value)} aria-label="Branch">
              <option value="all">All branches</option>
              {data.branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </Select>
          ) : null}
        </div>
      </Card>

      <Card>
        <DataTable
          columns={columns}
          rows={filteredSales}
          keyOf={(s) => s.id}
          onRowClick={(s) => setSelectedSale(s)}
          pageSize={10}
        />
      </Card>

      <SaleDetailModal
        sale={selectedSale}
        branchName={selectedSale ? branchName.get(selectedSale.branchId) ?? "—" : "—"}
        currencySymbol={data.settings.currencySymbol}
        refunded={selectedSale ? refundedIds.has(selectedSale.id) : false}
        onRefund={handleRefund}
        onClose={() => setSelectedSale(null)}
      />
    </div>
  );
}

function SaleDetailModal({
  sale,
  branchName,
  currencySymbol,
  refunded,
  onRefund,
  onClose,
}: {
  sale: Sale | null;
  branchName: string;
  currencySymbol: string;
  refunded: boolean;
  onRefund: (id: string) => void;
  onClose: () => void;
}) {
  if (!sale) return null;
  const status = refunded ? "refunded" : sale.status;
  const PaymentIcon = PAYMENT_ICON[sale.paymentMethod];

  return (
    <Modal
      open={!!sale}
      onClose={onClose}
      title={sale.receiptNo}
      subtitle={`${dateTime(sale.createdAt)} · ${branchName}`}
      size="lg"
      footer={
        status === "completed" ? (
          <button
            type="button"
            onClick={() => onRefund(sale.id)}
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-pos-danger px-4 text-sm font-medium text-white hover:brightness-95"
          >
            <RotateCcw size={15} />
            Refund sale
          </button>
        ) : (
          <Badge tone="danger">Refunded</Badge>
        )
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
          <div>
            <p className="text-xs text-pos-muted">Customer</p>
            <p className="font-medium text-pos-heading">{sale.customerName || "Walk-in Customer"}</p>
          </div>
          <div>
            <p className="text-xs text-pos-muted">Cashier</p>
            <p className="font-medium text-pos-heading">{sale.cashierName}</p>
          </div>
          <div>
            <p className="text-xs text-pos-muted">Payment</p>
            <p className="flex items-center gap-1.5 font-medium text-pos-heading">
              <PaymentIcon size={14} /> {sale.paymentMethod}
            </p>
          </div>
          {sale.prescriptionRef ? (
            <div>
              <p className="text-xs text-pos-muted">Prescription ref</p>
              <p className="font-medium text-pos-heading">{sale.prescriptionRef}</p>
            </div>
          ) : null}
        </div>

        <div className="overflow-x-auto rounded-xl border border-pos-border">
          <table className="w-full text-sm">
            <thead className="bg-pos-bg text-xs uppercase tracking-wide text-pos-muted">
              <tr>
                <th className="px-3 py-2 text-left">Item</th>
                <th className="px-3 py-2 text-right">Qty</th>
                <th className="px-3 py-2 text-right">Unit price</th>
                <th className="px-3 py-2 text-right">Discount</th>
                <th className="px-3 py-2 text-right">Line total</th>
              </tr>
            </thead>
            <tbody>
              {sale.lines.map((line) => (
                <tr key={line.productId} className="border-t border-pos-border">
                  <td className="px-3 py-2">
                    <p className="font-medium text-pos-heading">{line.name}</p>
                    <p className="text-xs text-pos-muted">{line.strength}</p>
                  </td>
                  <td className="px-3 py-2 text-right">{line.quantity}</td>
                  <td className="px-3 py-2 text-right">{money(line.unitPrice, currencySymbol)}</td>
                  <td className="px-3 py-2 text-right">{line.discount > 0 ? `−${money(line.discount, currencySymbol)}` : "—"}</td>
                  <td className="px-3 py-2 text-right font-semibold">
                    {money(line.unitPrice * line.quantity - line.discount, currencySymbol)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="ml-auto max-w-xs space-y-1 text-sm">
          <div className="flex justify-between text-pos-muted">
            <span>Subtotal</span>
            <span>{money(sale.subtotal, currencySymbol)}</span>
          </div>
          <div className="flex justify-between text-pos-muted">
            <span>Discount</span>
            <span>−{money(sale.discount, currencySymbol)}</span>
          </div>
          <div className="flex justify-between text-pos-muted">
            <span>VAT</span>
            <span>{money(sale.tax, currencySymbol)}</span>
          </div>
          <div className="flex justify-between border-t border-pos-border pt-1.5 text-base font-bold text-pos-heading">
            <span>Total</span>
            <span>{money(sale.total, currencySymbol)}</span>
          </div>
          {sale.paymentMethod === "Cash" ? (
            <>
              <div className="flex justify-between text-pos-muted">
                <span>Tendered</span>
                <span>{money(sale.amountTendered, currencySymbol)}</span>
              </div>
              <div className="flex justify-between text-pos-muted">
                <span>Change</span>
                <span>{money(sale.change, currencySymbol)}</span>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </Modal>
  );
}
