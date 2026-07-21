"use client";

import { useState } from "react";
import { Ban, Printer, Wallet } from "lucide-react";
import type { Branch, Invoice, Settings } from "@/lib/pos/types";
import { money, shortDate, dateTime } from "@/lib/pos/format";
import { Badge, Button, Modal } from "@/components/pos/ui";
import {
  INVOICE_STATUS_LABEL,
  INVOICE_STATUS_TONE,
  balanceOf,
  daysPastDue,
  isOpenInvoice,
  paidOf,
} from "./invoiceHelpers";

export interface InvoiceDetailModalProps {
  invoice: Invoice | null;
  branch: Branch | null;
  settings: Settings;
  canRecordPayment: boolean;
  canCancel: boolean;
  onClose: () => void;
  onRecordPayment: (invoice: Invoice) => void;
  onCancel: (invoice: Invoice) => void;
}

export function InvoiceDetailModal({
  invoice,
  branch,
  settings,
  canRecordPayment,
  canCancel,
  onClose,
  onRecordPayment,
  onCancel,
}: InvoiceDetailModalProps) {
  const [confirmingCancel, setConfirmingCancel] = useState(false);

  if (!invoice) return null;
  const symbol = settings.currencySymbol;
  const balance = balanceOf(invoice);
  const paid = paidOf(invoice);
  const overdue = invoice.status !== "paid" && invoice.status !== "cancelled" && daysPastDue(invoice) > 0;
  const hasPayments = invoice.payments.length > 0;

  const handleCancel = () => {
    if (!confirmingCancel) {
      setConfirmingCancel(true);
      return;
    }
    onCancel(invoice);
    setConfirmingCancel(false);
  };

  return (
    <Modal
      open={!!invoice}
      onClose={() => {
        setConfirmingCancel(false);
        onClose();
      }}
      title={invoice.invoiceNo}
      subtitle={`Issued ${shortDate(invoice.issuedAt)} · Due ${shortDate(invoice.dueAt)}`}
      size="lg"
      footer={
        <div className="flex w-full flex-wrap items-center justify-end gap-2">
          {canCancel && isOpenInvoice(invoice) && !hasPayments ? (
            <Button
              variant={confirmingCancel ? "danger" : "secondary"}
              icon={Ban}
              onClick={handleCancel}
              onBlur={() => setConfirmingCancel(false)}
            >
              {confirmingCancel ? "Confirm cancel" : "Cancel invoice"}
            </Button>
          ) : null}
          <Button variant="secondary" icon={Printer} onClick={() => window.print()}>
            Print
          </Button>
          {canRecordPayment && isOpenInvoice(invoice) ? (
            <Button icon={Wallet} onClick={() => onRecordPayment(invoice)}>
              Record payment
            </Button>
          ) : null}
        </div>
      }
    >
      <div className="pos-receipt space-y-5 text-sm text-pos-heading">
        {/* Letterhead */}
        <div className="flex flex-col justify-between gap-3 border-b border-pos-border pb-4 sm:flex-row sm:items-start">
          <div>
            <p className="text-base font-bold">{settings.businessName}</p>
            <p className="text-pos-muted">{branch?.name ?? "—"}</p>
            <p className="text-pos-muted">{branch?.address}</p>
            <p className="text-pos-muted">{branch?.phone}</p>
          </div>
          <div className="text-left sm:text-right">
            <p className="text-xs uppercase tracking-wide text-pos-muted">Invoice</p>
            <p className="text-lg font-bold">{invoice.invoiceNo}</p>
            <Badge tone={INVOICE_STATUS_TONE[invoice.status]} className="mt-1">
              {INVOICE_STATUS_LABEL[invoice.status]}
            </Badge>
          </div>
        </div>

        {/* Customer / dates */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="col-span-2">
            <p className="text-xs text-pos-muted">Billed to</p>
            <p className="font-medium text-pos-heading">{invoice.customerName}</p>
          </div>
          <div>
            <p className="text-xs text-pos-muted">Issued</p>
            <p className="font-medium text-pos-heading">{shortDate(invoice.issuedAt)}</p>
          </div>
          <div>
            <p className="text-xs text-pos-muted">Due</p>
            <p className={overdue ? "font-medium text-pos-danger" : "font-medium text-pos-heading"}>
              {shortDate(invoice.dueAt)}
              {overdue ? ` (${daysPastDue(invoice)}d overdue)` : ""}
            </p>
          </div>
          {invoice.issuedByName ? (
            <div>
              <p className="text-xs text-pos-muted">Issued by</p>
              <p className="font-medium text-pos-heading">{invoice.issuedByName}</p>
            </div>
          ) : null}
        </div>

        {invoice.note ? (
          <p className="rounded-lg bg-pos-bg px-3 py-2 text-xs text-pos-muted">{invoice.note}</p>
        ) : null}

        {/* Lines */}
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
              {invoice.lines.map((line) => (
                <tr key={line.productId} className="border-t border-pos-border">
                  <td className="px-3 py-2">
                    <p className="font-medium text-pos-heading">{line.name}</p>
                    <p className="text-xs text-pos-muted">{line.strength}</p>
                  </td>
                  <td className="px-3 py-2 text-right">{line.quantity}</td>
                  <td className="px-3 py-2 text-right">{money(line.unitPrice, symbol)}</td>
                  <td className="px-3 py-2 text-right">
                    {line.discount > 0 ? `−${money(line.discount, symbol)}` : "—"}
                  </td>
                  <td className="px-3 py-2 text-right font-semibold">
                    {money(line.unitPrice * line.quantity - line.discount, symbol)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="ml-auto max-w-xs space-y-1">
          <div className="flex justify-between text-pos-muted">
            <span>Subtotal</span>
            <span>{money(invoice.subtotal, symbol)}</span>
          </div>
          <div className="flex justify-between text-pos-muted">
            <span>Discount</span>
            <span>−{money(invoice.discount, symbol)}</span>
          </div>
          <div className="flex justify-between text-pos-muted">
            <span>VAT</span>
            <span>{money(invoice.tax, symbol)}</span>
          </div>
          <div className="flex justify-between border-t border-pos-border pt-1.5 text-base font-bold text-pos-heading">
            <span>Total</span>
            <span>{money(invoice.total, symbol)}</span>
          </div>
          <div className="flex justify-between text-pos-muted">
            <span>Paid</span>
            <span>{money(paid, symbol)}</span>
          </div>
          <div
            className={
              balance > 0
                ? "flex justify-between rounded-lg bg-pos-danger-soft px-3 py-2 text-base font-bold text-pos-danger"
                : "flex justify-between rounded-lg bg-pos-ok-soft px-3 py-2 text-base font-bold text-pos-ok"
            }
          >
            <span>Balance due</span>
            <span>{money(balance, symbol)}</span>
          </div>
        </div>

        {/* Payment history */}
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-pos-muted">
            Payment history
          </p>
          {invoice.payments.length === 0 ? (
            <p className="rounded-lg bg-pos-bg px-3 py-3 text-xs text-pos-muted">
              No payments recorded yet.
            </p>
          ) : (
            <div className="space-y-2">
              {invoice.payments.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between rounded-lg border border-pos-border px-3 py-2"
                >
                  <div>
                    <p className="font-medium text-pos-heading">
                      {money(p.amount, symbol)}
                      <span className="ml-2 text-xs font-normal text-pos-muted">{p.method}</span>
                    </p>
                    <p className="text-xs text-pos-muted">
                      {dateTime(p.paidAt)} · recorded by {p.recordedBy}
                      {p.reference ? ` · ref ${p.reference}` : ""}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
