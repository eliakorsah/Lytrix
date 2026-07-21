"use client";

import { Mail, Phone, User } from "lucide-react";
import type { Customer, Invoice } from "@/lib/pos/types";
import { money, shortDate } from "@/lib/pos/format";
import { Badge, Modal } from "@/components/pos/ui";
import {
  balanceOf,
  CUSTOMER_TYPE_TONE,
  INVOICE_STATUS_LABEL,
  INVOICE_STATUS_TONE,
  paidOf,
} from "./invoiceHelpers";
import { UtilisationBar } from "./UtilisationBar";

export interface CustomerDetailModalProps {
  customer: Customer | null;
  invoices: Invoice[];
  currencySymbol: string;
  onClose: () => void;
}

export function CustomerDetailModal({ customer, invoices, currencySymbol, onClose }: CustomerDetailModalProps) {
  if (!customer) return null;

  const outstanding = invoices
    .filter((inv) => inv.status !== "cancelled")
    .reduce((sum, inv) => sum + balanceOf(inv), 0);
  const utilisation = customer.creditLimit > 0 ? outstanding / customer.creditLimit : 0;
  const totalBilled = invoices.reduce((sum, inv) => sum + inv.total, 0);
  const totalPaid = invoices.reduce((sum, inv) => sum + paidOf(inv), 0);

  const sorted = [...invoices].sort((a, b) => b.issuedAt.localeCompare(a.issuedAt));

  return (
    <Modal
      open={!!customer}
      onClose={onClose}
      title={customer.name}
      subtitle={`${customer.type} account`}
      size="lg"
    >
      <div className="space-y-5 text-sm">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-xl bg-pos-bg px-3.5 py-3">
            <p className="flex items-center gap-1.5 text-xs text-pos-muted">
              <User size={13} /> Contact
            </p>
            <p className="mt-1 font-medium text-pos-heading">{customer.contact}</p>
          </div>
          <div className="rounded-xl bg-pos-bg px-3.5 py-3">
            <p className="flex items-center gap-1.5 text-xs text-pos-muted">
              <Phone size={13} /> Phone
            </p>
            <p className="mt-1 font-medium text-pos-heading">{customer.phone}</p>
          </div>
          <div className="rounded-xl bg-pos-bg px-3.5 py-3">
            <p className="flex items-center gap-1.5 text-xs text-pos-muted">
              <Mail size={13} /> Email
            </p>
            <p className="mt-1 truncate font-medium text-pos-heading">{customer.email}</p>
          </div>
        </div>

        <div className="rounded-xl border border-pos-border p-4">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-xs text-pos-muted">
            <span>
              Credit terms: <strong className="text-pos-heading">{customer.paymentTermsDays} days</strong>
            </span>
            <span>
              Limit: <strong className="text-pos-heading">{money(customer.creditLimit, currencySymbol)}</strong>
            </span>
            <span>
              Outstanding: <strong className="text-pos-heading">{money(outstanding, currencySymbol)}</strong>
            </span>
          </div>
          <UtilisationBar ratio={utilisation} />
        </div>

        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-pos-muted">
            Invoice history ({sorted.length})
          </p>
          {sorted.length === 0 ? (
            <p className="rounded-lg bg-pos-bg px-3 py-3 text-xs text-pos-muted">No invoices for this account yet.</p>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-pos-border">
              <table className="w-full text-sm">
                <thead className="bg-pos-bg text-xs uppercase tracking-wide text-pos-muted">
                  <tr>
                    <th className="px-3 py-2 text-left">Invoice</th>
                    <th className="px-3 py-2 text-left">Issued</th>
                    <th className="px-3 py-2 text-left">Due</th>
                    <th className="px-3 py-2 text-right">Total</th>
                    <th className="px-3 py-2 text-right">Balance</th>
                    <th className="px-3 py-2 text-center">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((inv) => (
                    <tr key={inv.id} className="border-t border-pos-border">
                      <td className="px-3 py-2 font-medium text-pos-heading">{inv.invoiceNo}</td>
                      <td className="px-3 py-2 text-pos-muted">{shortDate(inv.issuedAt)}</td>
                      <td className="px-3 py-2 text-pos-muted">{shortDate(inv.dueAt)}</td>
                      <td className="px-3 py-2 text-right">{money(inv.total, currencySymbol)}</td>
                      <td className="px-3 py-2 text-right font-semibold">
                        {money(balanceOf(inv), currencySymbol)}
                      </td>
                      <td className="px-3 py-2 text-center">
                        <Badge tone={INVOICE_STATUS_TONE[inv.status]}>{INVOICE_STATUS_LABEL[inv.status]}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t border-pos-border bg-pos-bg font-semibold text-pos-heading">
                    <td className="px-3 py-2" colSpan={3}>
                      Totals
                    </td>
                    <td className="px-3 py-2 text-right">{money(totalBilled, currencySymbol)}</td>
                    <td className="px-3 py-2 text-right">{money(outstanding, currencySymbol)}</td>
                    <td className="px-3 py-2 text-center text-xs font-normal text-pos-muted">
                      {money(totalPaid, currencySymbol)} paid
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>

        <div className="text-xs text-pos-muted">
          <Badge tone={CUSTOMER_TYPE_TONE[customer.type]}>{customer.type}</Badge>{" "}
          {customer.active ? "Active account" : "Inactive account"}
        </div>
      </div>
    </Modal>
  );
}
