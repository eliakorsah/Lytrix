"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, CreditCard, Users, Wallet } from "lucide-react";
import { usePos } from "@/lib/pos/store";
import { inScope } from "@/lib/pos/selectors";
import { money, number } from "@/lib/pos/format";
import type { Customer } from "@/lib/pos/types";
import {
  Badge,
  Card,
  DataTable,
  type DataTableColumn,
  PageHeader,
  Skeleton,
} from "@/components/pos/ui";
import { RequireCapability } from "@/components/pos/RequireCapability";
import { balanceOf, CUSTOMER_TYPE_TONE } from "@/components/pos/invoices/invoiceHelpers";
import { UtilisationBar } from "@/components/pos/invoices/UtilisationBar";
import { CustomerDetailModal } from "@/components/pos/invoices/CustomerDetailModal";

export default function CustomersPage() {
  const { data, ready, scope } = usePos();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const scopedInvoices = useMemo(
    () => data.invoices.filter((inv) => inScope(inv.branchId, scope)),
    [data.invoices, scope],
  );

  const outstandingByCustomer = useMemo(() => {
    const map = new Map<string, number>();
    for (const inv of scopedInvoices) {
      if (inv.status === "cancelled") continue;
      map.set(inv.customerId, (map.get(inv.customerId) ?? 0) + balanceOf(inv));
    }
    return map;
  }, [scopedInvoices]);

  const summary = useMemo(() => {
    const totalAccounts = data.customers.length;
    const totalCreditExtended = data.customers.reduce((sum, c) => sum + c.creditLimit, 0);
    const totalOutstanding = [...outstandingByCustomer.values()].reduce((sum, v) => sum + v, 0);
    const overLimit = data.customers.filter(
      (c) => (outstandingByCustomer.get(c.id) ?? 0) > c.creditLimit,
    ).length;
    return { totalAccounts, totalCreditExtended, totalOutstanding, overLimit };
  }, [data.customers, outstandingByCustomer]);

  const selectedCustomer = useMemo(
    () => data.customers.find((c) => c.id === selectedId) ?? null,
    [data.customers, selectedId],
  );
  const selectedCustomerInvoices = useMemo(
    () => (selectedCustomer ? scopedInvoices.filter((inv) => inv.customerId === selectedCustomer.id) : []),
    [scopedInvoices, selectedCustomer],
  );

  const columns: DataTableColumn<Customer>[] = useMemo(
    () => [
      {
        key: "name",
        header: "Name",
        sortable: true,
        render: (c) => (
          <div className="flex items-center gap-2">
            <span className="font-medium">{c.name}</span>
            <Badge tone={CUSTOMER_TYPE_TONE[c.type]} className="shrink-0">
              {c.type}
            </Badge>
          </div>
        ),
      },
      { key: "contact", header: "Contact", sortable: true, render: (c) => c.contact },
      { key: "phone", header: "Phone", render: (c) => c.phone },
      {
        key: "terms",
        header: "Terms",
        align: "right",
        sortValue: (c) => c.paymentTermsDays,
        render: (c) => `${c.paymentTermsDays}d`,
      },
      {
        key: "creditLimit",
        header: "Credit limit",
        align: "right",
        sortable: true,
        sortValue: (c) => c.creditLimit,
        render: (c) => money(c.creditLimit, data.settings.currencySymbol),
      },
      {
        key: "outstanding",
        header: "Outstanding",
        align: "right",
        sortValue: (c) => outstandingByCustomer.get(c.id) ?? 0,
        render: (c) => money(outstandingByCustomer.get(c.id) ?? 0, data.settings.currencySymbol),
      },
      {
        key: "utilisation",
        header: "Utilisation",
        className: "min-w-[10rem]",
        sortValue: (c) => (c.creditLimit > 0 ? (outstandingByCustomer.get(c.id) ?? 0) / c.creditLimit : 0),
        render: (c) => (
          <UtilisationBar ratio={c.creditLimit > 0 ? (outstandingByCustomer.get(c.id) ?? 0) / c.creditLimit : 0} />
        ),
      },
    ],
    [data.settings.currencySymbol, outstandingByCustomer],
  );

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
    <RequireCapability capability="view:invoices">
      <div>
        <PageHeader
          title="Credit accounts"
          subtitle={scope === "all" ? "Insurers, corporates and individual credit customers — all branches" : "Insurers, corporates and individual credit customers"}
        />

        <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="rounded-2xl bg-pos-surface p-5 shadow-card">
            <div className="w-fit rounded-xl bg-pos-brand-soft p-2.5 text-pos-brand-dark">
              <Users size={18} />
            </div>
            <p className="mt-4 text-2xl font-semibold tracking-tight text-pos-heading">
              {number(summary.totalAccounts)}
            </p>
            <p className="mt-1 text-sm text-pos-muted">Total accounts</p>
          </div>
          <div className="rounded-2xl bg-pos-surface p-5 shadow-card">
            <div className="w-fit rounded-xl bg-pos-accent-soft p-2.5 text-pos-accent">
              <CreditCard size={18} />
            </div>
            <p className="mt-4 text-2xl font-semibold tracking-tight text-pos-heading">
              {money(summary.totalCreditExtended, data.settings.currencySymbol)}
            </p>
            <p className="mt-1 text-sm text-pos-muted">Total credit extended</p>
          </div>
          <div className="rounded-2xl bg-pos-surface p-5 shadow-card">
            <div className="w-fit rounded-xl bg-pos-warn-soft p-2.5 text-pos-warn">
              <Wallet size={18} />
            </div>
            <p className="mt-4 text-2xl font-semibold tracking-tight text-pos-heading">
              {money(summary.totalOutstanding, data.settings.currencySymbol)}
            </p>
            <p className="mt-1 text-sm text-pos-muted">Total outstanding</p>
          </div>
          <div className="rounded-2xl bg-pos-surface p-5 shadow-card">
            <div className="w-fit rounded-xl bg-pos-danger-soft p-2.5 text-pos-danger">
              <AlertTriangle size={18} />
            </div>
            <p className="mt-4 text-2xl font-semibold tracking-tight text-pos-heading">{summary.overLimit}</p>
            <p className="mt-1 text-sm text-pos-muted">Over credit limit</p>
          </div>
        </div>

        <Card>
          <DataTable
            columns={columns}
            rows={data.customers}
            keyOf={(c) => c.id}
            onRowClick={(c) => setSelectedId(c.id)}
            pageSize={10}
          />
        </Card>

        <CustomerDetailModal
          customer={selectedCustomer}
          invoices={selectedCustomerInvoices}
          currencySymbol={data.settings.currencySymbol}
          onClose={() => setSelectedId(null)}
        />
      </div>
    </RequireCapability>
  );
}
