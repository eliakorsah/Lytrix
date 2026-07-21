"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  Clock3,
  FileText,
  Plus,
  Users,
  Wallet,
} from "lucide-react";
import { usePos } from "@/lib/pos/store";
import { inScope } from "@/lib/pos/selectors";
import { money, number, shortDate } from "@/lib/pos/format";
import { can } from "@/lib/pos/permissions";
import type { Invoice, InvoiceStatus } from "@/lib/pos/types";
import {
  Badge,
  Button,
  Card,
  CardHeader,
  DataTable,
  type DataTableColumn,
  Input,
  PageHeader,
  Select,
  Skeleton,
  cn,
} from "@/components/pos/ui";
import { RequireCapability } from "@/components/pos/RequireCapability";
import {
  ageingBucketOf,
  balanceOf,
  CUSTOMER_TYPE_TONE,
  daysPastDue,
  INVOICE_STATUS_LABEL,
  INVOICE_STATUS_TONE,
  isOpenInvoice,
  paidOf,
} from "@/components/pos/invoices/invoiceHelpers";
import { AgeingStrip, type AgeingSegment } from "@/components/pos/invoices/AgeingStrip";
import { InvoiceDetailModal } from "@/components/pos/invoices/InvoiceDetailModal";
import { RecordPaymentModal } from "@/components/pos/invoices/RecordPaymentModal";
import { NewInvoiceModal } from "@/components/pos/invoices/NewInvoiceModal";

type TabKey = "all" | InvoiceStatus;

const TABS: { key: TabKey; label: string }[] = [
  { key: "all", label: "All" },
  { key: "issued", label: "Issued" },
  { key: "part-paid", label: "Part paid" },
  { key: "overdue", label: "Overdue" },
  { key: "paid", label: "Paid" },
  { key: "cancelled", label: "Cancelled" },
];

const AGEING_DEF: { key: "current" | "1-30" | "31-60" | "60+"; label: string; barClass: string; dotClass: string }[] = [
  { key: "current", label: "Current", barClass: "bg-pos-ok", dotClass: "bg-pos-ok" },
  { key: "1-30", label: "1–30 days", barClass: "bg-pos-warn", dotClass: "bg-pos-warn" },
  { key: "31-60", label: "31–60 days", barClass: "bg-orange-500", dotClass: "bg-orange-500" },
  { key: "60+", label: "60+ days", barClass: "bg-pos-danger", dotClass: "bg-pos-danger" },
];

function isThisMonth(iso: string, now = new Date()) {
  const d = new Date(iso);
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
}

export default function InvoicesPage() {
  const { data, ready, scope, currentUser, createInvoice, recordInvoicePayment, cancelInvoice } = usePos();

  const [search, setSearch] = useState("");
  const [customerFilter, setCustomerFilter] = useState("all");
  const [branchFilter, setBranchFilter] = useState("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [tab, setTab] = useState<TabKey>("all");

  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);
  const [paymentInvoiceId, setPaymentInvoiceId] = useState<string | null>(null);
  const [newInvoiceOpen, setNewInvoiceOpen] = useState(false);

  const branchName = useMemo(() => new Map(data.branches.map((b) => [b.id, b.name])), [data.branches]);

  const scopedInvoices = useMemo(
    () => data.invoices.filter((inv) => inScope(inv.branchId, scope)),
    [data.invoices, scope],
  );

  const filteredExceptStatus = useMemo(() => {
    let list = scopedInvoices;
    if (scope === "all" && branchFilter !== "all") list = list.filter((inv) => inv.branchId === branchFilter);
    if (customerFilter !== "all") list = list.filter((inv) => inv.customerId === customerFilter);
    if (fromDate) list = list.filter((inv) => inv.issuedAt >= fromDate);
    if (toDate) list = list.filter((inv) => inv.issuedAt <= toDate);
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (inv) => inv.invoiceNo.toLowerCase().includes(q) || inv.customerName.toLowerCase().includes(q),
      );
    }
    return list;
  }, [scopedInvoices, scope, branchFilter, customerFilter, fromDate, toDate, search]);

  const counts = useMemo(() => {
    const c: Record<TabKey, number> = {
      all: filteredExceptStatus.length,
      draft: 0,
      issued: 0,
      "part-paid": 0,
      overdue: 0,
      paid: 0,
      cancelled: 0,
    };
    for (const inv of filteredExceptStatus) c[inv.status] += 1;
    return c;
  }, [filteredExceptStatus]);

  const rows = useMemo(() => {
    const list = tab === "all" ? filteredExceptStatus : filteredExceptStatus.filter((inv) => inv.status === tab);
    return [...list].sort((a, b) => b.issuedAt.localeCompare(a.issuedAt));
  }, [filteredExceptStatus, tab]);

  const receivables = useMemo(() => {
    const open = scopedInvoices.filter((inv) => inv.status !== "cancelled");
    const totalOutstanding = open.reduce((sum, inv) => sum + balanceOf(inv), 0);
    const overdueAmount = open
      .filter((inv) => isOpenInvoice(inv) && daysPastDue(inv) > 0)
      .reduce((sum, inv) => sum + balanceOf(inv), 0);
    const collectedThisMonth = scopedInvoices.reduce(
      (sum, inv) => sum + inv.payments.filter((p) => isThisMonth(p.paidAt)).reduce((s, p) => s + p.amount, 0),
      0,
    );
    const awaitingPayment = scopedInvoices.filter((inv) => isOpenInvoice(inv)).length;
    return { totalOutstanding, overdueAmount, collectedThisMonth, awaitingPayment };
  }, [scopedInvoices]);

  const ageingSegments: AgeingSegment[] = useMemo(() => {
    const buckets = new Map<string, { count: number; amount: number }>();
    for (const def of AGEING_DEF) buckets.set(def.key, { count: 0, amount: 0 });
    for (const inv of scopedInvoices) {
      const bucket = ageingBucketOf(inv);
      if (!bucket) continue;
      const entry = buckets.get(bucket)!;
      entry.count += 1;
      entry.amount += balanceOf(inv);
    }
    return AGEING_DEF.map((def) => ({
      key: def.key,
      label: def.label,
      barClass: def.barClass,
      dotClass: def.dotClass,
      ...buckets.get(def.key)!,
    }));
  }, [scopedInvoices]);

  const selectedInvoice: Invoice | null = useMemo(
    () => data.invoices.find((inv) => inv.id === selectedInvoiceId) ?? null,
    [data.invoices, selectedInvoiceId],
  );
  const paymentInvoice: Invoice | null = useMemo(
    () => data.invoices.find((inv) => inv.id === paymentInvoiceId) ?? null,
    [data.invoices, paymentInvoiceId],
  );

  const columns: DataTableColumn<Invoice>[] = useMemo(() => {
    const cols: DataTableColumn<Invoice>[] = [
      {
        key: "invoiceNo",
        header: "Invoice No",
        sortable: true,
        render: (inv) => <span className="font-medium">{inv.invoiceNo}</span>,
      },
      {
        key: "customer",
        header: "Customer",
        sortable: true,
        sortValue: (inv) => inv.customerName,
        render: (inv) => {
          const customer = data.customers.find((c) => c.id === inv.customerId);
          return (
            <div className="flex items-center gap-2">
              <span>{inv.customerName}</span>
              {customer ? (
                <Badge tone={CUSTOMER_TYPE_TONE[customer.type]} className="shrink-0">
                  {customer.type}
                </Badge>
              ) : null}
            </div>
          );
        },
      },
    ];
    if (scope === "all") {
      cols.push({
        key: "branch",
        header: "Branch",
        sortable: true,
        sortValue: (inv) => branchName.get(inv.branchId) ?? "",
        render: (inv) => branchName.get(inv.branchId) ?? "—",
      });
    }
    cols.push(
      { key: "issuedAt", header: "Issued", sortable: true, render: (inv) => shortDate(inv.issuedAt) },
      {
        key: "dueAt",
        header: "Due",
        sortable: true,
        render: (inv) => {
          const overdue = isOpenInvoice(inv) && daysPastDue(inv) > 0;
          return (
            <span className={overdue ? "font-medium text-pos-danger" : undefined}>{shortDate(inv.dueAt)}</span>
          );
        },
      },
      {
        key: "total",
        header: "Total",
        align: "right",
        sortable: true,
        sortValue: (inv) => inv.total,
        render: (inv) => money(inv.total, data.settings.currencySymbol),
      },
      {
        key: "paid",
        header: "Paid",
        align: "right",
        sortValue: (inv) => paidOf(inv),
        render: (inv) => money(paidOf(inv), data.settings.currencySymbol),
      },
      {
        key: "balance",
        header: "Balance",
        align: "right",
        sortValue: (inv) => balanceOf(inv),
        render: (inv) => (
          <span className="font-semibold">{money(balanceOf(inv), data.settings.currencySymbol)}</span>
        ),
      },
      {
        key: "status",
        header: "Status",
        align: "center",
        sortValue: (inv) => inv.status,
        render: (inv) => <Badge tone={INVOICE_STATUS_TONE[inv.status]}>{INVOICE_STATUS_LABEL[inv.status]}</Badge>,
      },
    );
    return cols;
  }, [scope, branchName, data.customers, data.settings.currencySymbol]);

  if (!ready || !currentUser) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-9 w-64" />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
        <Skeleton className="h-40" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <RequireCapability capability="view:invoices">
      <div>
        <PageHeader
          title="Invoices"
          subtitle={scope === "all" ? "Credit billing across every branch" : "Credit billing for this branch"}
          actions={
            <>
              <Link href="/demo/pos/customers">
                <Button variant="secondary" icon={Users}>
                  Manage credit accounts
                </Button>
              </Link>
              {can(currentUser, "invoice:create") ? (
                <Button icon={Plus} onClick={() => setNewInvoiceOpen(true)}>
                  New invoice
                </Button>
              ) : null}
            </>
          }
        />

        <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="rounded-2xl bg-pos-surface p-5 shadow-card">
            <div className="w-fit rounded-xl bg-pos-brand-soft p-2.5 text-pos-brand-dark">
              <Wallet size={18} />
            </div>
            <p className="mt-4 text-2xl font-semibold tracking-tight text-pos-heading">
              {money(receivables.totalOutstanding, data.settings.currencySymbol)}
            </p>
            <p className="mt-1 text-sm text-pos-muted">Total outstanding</p>
          </div>
          <div className="rounded-2xl bg-pos-surface p-5 shadow-card">
            <div className="w-fit rounded-xl bg-pos-danger-soft p-2.5 text-pos-danger">
              <AlertTriangle size={18} />
            </div>
            <p className="mt-4 text-2xl font-semibold tracking-tight text-pos-heading">
              {money(receivables.overdueAmount, data.settings.currencySymbol)}
            </p>
            <p className="mt-1 text-sm text-pos-muted">Overdue amount</p>
          </div>
          <div className="rounded-2xl bg-pos-surface p-5 shadow-card">
            <div className="w-fit rounded-xl bg-pos-ok-soft p-2.5 text-pos-ok">
              <FileText size={18} />
            </div>
            <p className="mt-4 text-2xl font-semibold tracking-tight text-pos-heading">
              {money(receivables.collectedThisMonth, data.settings.currencySymbol)}
            </p>
            <p className="mt-1 text-sm text-pos-muted">Collected this month</p>
          </div>
          <div className="rounded-2xl bg-pos-surface p-5 shadow-card">
            <div className="w-fit rounded-xl bg-pos-accent-soft p-2.5 text-pos-accent">
              <Clock3 size={18} />
            </div>
            <p className="mt-4 text-2xl font-semibold tracking-tight text-pos-heading">
              {number(receivables.awaitingPayment)}
            </p>
            <p className="mt-1 text-sm text-pos-muted">Awaiting payment</p>
          </div>
        </div>

        <Card className="mb-6">
          <CardHeader title="Receivables ageing" subtitle="Outstanding balance by days past due" />
          <AgeingStrip segments={ageingSegments} currencySymbol={data.settings.currencySymbol} />
        </Card>

        <Card className="mt-6">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap gap-1.5">
              {TABS.map((t) => (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setTab(t.key)}
                  className={cn(
                    "rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                    tab === t.key ? "bg-pos-brand text-white" : "bg-pos-bg text-pos-muted hover:text-pos-heading",
                  )}
                >
                  {t.label} ({counts[t.key]})
                </button>
              ))}
            </div>
          </div>

          <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <Input
              containerClassName="lg:col-span-2"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search invoice no or customer..."
              aria-label="Search invoices"
            />
            <Select value={customerFilter} onChange={(e) => setCustomerFilter(e.target.value)} aria-label="Customer">
              <option value="all">All customers</option>
              {data.customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
            <Input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              aria-label="From date"
            />
            <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} aria-label="To date" />
            {scope === "all" ? (
              <Select
                value={branchFilter}
                onChange={(e) => setBranchFilter(e.target.value)}
                aria-label="Branch"
                containerClassName="lg:col-span-5"
              >
                <option value="all">All branches</option>
                {data.branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </Select>
            ) : null}
          </div>

          <DataTable
            columns={columns}
            rows={rows}
            keyOf={(inv) => inv.id}
            onRowClick={(inv) => setSelectedInvoiceId(inv.id)}
            pageSize={10}
          />
        </Card>

        <InvoiceDetailModal
          invoice={selectedInvoice}
          branch={selectedInvoice ? data.branches.find((b) => b.id === selectedInvoice.branchId) ?? null : null}
          settings={data.settings}
          canRecordPayment={can(currentUser, "invoice:recordPayment")}
          canCancel={can(currentUser, "invoice:cancel")}
          onClose={() => setSelectedInvoiceId(null)}
          onRecordPayment={(inv) => {
            setSelectedInvoiceId(null);
            setPaymentInvoiceId(inv.id);
          }}
          onCancel={(inv) => {
            cancelInvoice(inv.id);
            setSelectedInvoiceId(null);
          }}
        />

        <RecordPaymentModal
          open={!!paymentInvoice}
          invoice={paymentInvoice}
          currencySymbol={data.settings.currencySymbol}
          recordedBy={currentUser.name}
          onClose={() => setPaymentInvoiceId(null)}
          onSubmit={(invoiceId, payment) => recordInvoicePayment(invoiceId, payment)}
        />

        <NewInvoiceModal
          open={newInvoiceOpen}
          data={data}
          scope={scope}
          currentUser={currentUser}
          onClose={() => setNewInvoiceOpen(false)}
          onCreate={(invoice) => createInvoice(invoice)}
        />
      </div>
    </RequireCapability>
  );
}
