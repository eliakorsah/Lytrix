// Shared calculations & display maps for the invoicing / credit billing module.
// Kept alongside the invoice components rather than in lib/pos (which is a
// read-only contract for this task).

import type { Customer, Invoice, InvoiceStatus } from "@/lib/pos/types";
import type { Tone } from "@/components/pos/ui";

const round2 = (x: number) => Math.round(x * 100) / 100;

/** Outstanding balance on an invoice: total minus everything paid so far. */
export function balanceOf(invoice: Invoice): number {
  const paid = invoice.payments.reduce((sum, p) => sum + p.amount, 0);
  return Math.max(0, round2(invoice.total - paid));
}

export function paidOf(invoice: Invoice): number {
  return round2(invoice.payments.reduce((sum, p) => sum + p.amount, 0));
}

/** True when an invoice can still receive a payment. */
export function isOpenInvoice(invoice: Invoice): boolean {
  return invoice.status !== "cancelled" && invoice.status !== "paid" && balanceOf(invoice) > 0;
}

export const INVOICE_STATUS_LABEL: Record<InvoiceStatus, string> = {
  draft: "Draft",
  issued: "Issued",
  "part-paid": "Part paid",
  paid: "Paid",
  overdue: "Overdue",
  cancelled: "Cancelled",
};

export const INVOICE_STATUS_TONE: Record<InvoiceStatus, Tone | "neutral"> = {
  draft: "neutral",
  issued: "accent",
  "part-paid": "warn",
  paid: "ok",
  overdue: "danger",
  cancelled: "neutral",
};

export const CUSTOMER_TYPE_TONE: Record<Customer["type"], Tone | "neutral"> = {
  Individual: "neutral",
  Corporate: "accent",
  Insurance: "violet",
};

/** Days between due date and now — positive means past due. */
export function daysPastDue(invoice: Invoice, now = Date.now()): number {
  const due = new Date(invoice.dueAt).getTime();
  return Math.floor((now - due) / 864e5);
}

export type AgeingBucket = "current" | "1-30" | "31-60" | "60+";

/** Which ageing bucket an *open* invoice falls into, or null if it's settled/cancelled. */
export function ageingBucketOf(invoice: Invoice, now = Date.now()): AgeingBucket | null {
  if (!isOpenInvoice(invoice)) return null;
  const days = daysPastDue(invoice, now);
  if (days <= 0) return "current";
  if (days <= 30) return "1-30";
  if (days <= 60) return "31-60";
  return "60+";
}

/** Outstanding balance of a single customer across the given invoices. */
export function customerOutstanding(customerId: string, invoices: Invoice[]): number {
  return round2(
    invoices
      .filter((inv) => inv.customerId === customerId && inv.status !== "cancelled")
      .reduce((sum, inv) => sum + balanceOf(inv), 0),
  );
}

export const paymentMethods = ["Cash", "Card", "Mobile Money", "Insurance"] as const;
