"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Plus, Trash2 } from "lucide-react";
import type { Branch, Customer, Invoice, InvoiceLine, PosData, Staff } from "@/lib/pos/types";
import type { BranchScope } from "@/lib/pos/types";
import { money } from "@/lib/pos/format";
import { Button, Input, Modal, Select, useToast } from "@/components/pos/ui";
import { customerOutstanding } from "./invoiceHelpers";

export interface NewInvoiceModalProps {
  open: boolean;
  data: PosData;
  scope: BranchScope;
  currentUser: Staff;
  onClose: () => void;
  onCreate: (invoice: Invoice) => void;
}

const round2 = (x: number) => Math.round(x * 100) / 100;
const todayIso = () => new Date().toISOString().slice(0, 10);
const addDaysIso = (iso: string, days: number) => {
  const d = new Date(iso);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
};

interface DraftLine {
  key: string;
  productId: string;
  quantity: string;
  unitPrice: string;
  discount: string;
}

function nextInvoiceNo(invoices: Invoice[], branch: Branch): string {
  const prefix = `INV-${branch.code}-`;
  let max = 1000;
  for (const inv of invoices) {
    if (inv.invoiceNo.startsWith(prefix)) {
      const suffix = Number(inv.invoiceNo.slice(prefix.length));
      if (Number.isFinite(suffix) && suffix > max) max = suffix;
    }
  }
  return `${prefix}${max + 1}`;
}

export function NewInvoiceModal({ open, data, scope, currentUser, onClose, onCreate }: NewInvoiceModalProps) {
  const { push } = useToast();

  const [customerId, setCustomerId] = useState("");
  const [branchId, setBranchId] = useState<string>(scope === "all" ? "" : scope);
  const [issuedAt, setIssuedAt] = useState(todayIso());
  const [dueAt, setDueAt] = useState(todayIso());
  const [dueAtTouched, setDueAtTouched] = useState(false);
  const [note, setNote] = useState("");
  const [lines, setLines] = useState<DraftLine[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const activeCustomers = useMemo(() => data.customers.filter((c) => c.active), [data.customers]);
  const customer: Customer | undefined = useMemo(
    () => data.customers.find((c) => c.id === customerId),
    [data.customers, customerId],
  );

  useEffect(() => {
    if (!open) return;
    setCustomerId("");
    setBranchId(scope === "all" ? "" : scope);
    const iso = todayIso();
    setIssuedAt(iso);
    setDueAt(iso);
    setDueAtTouched(false);
    setNote("");
    setLines([]);
    setErrors({});
  }, [open, scope]);

  // Auto-compute the due date from the customer's payment terms, unless the
  // user has already edited it by hand for this invoice.
  useEffect(() => {
    if (!customer || dueAtTouched) return;
    setDueAt(addDaysIso(issuedAt, customer.paymentTermsDays));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customer?.id, issuedAt]);

  const addLine = () => {
    const firstProduct = data.products[0];
    setLines((prev) => [
      ...prev,
      {
        key: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        productId: firstProduct?.id ?? "",
        quantity: "1",
        unitPrice: firstProduct ? String(firstProduct.sellPrice) : "0",
        discount: "0",
      },
    ]);
  };

  const removeLine = (key: string) => setLines((prev) => prev.filter((l) => l.key !== key));

  const updateLine = (key: string, patch: Partial<DraftLine>) =>
    setLines((prev) => prev.map((l) => (l.key === key ? { ...l, ...patch } : l)));

  const onProductChange = (key: string, productId: string) => {
    const product = data.products.find((p) => p.id === productId);
    updateLine(key, { productId, unitPrice: product ? String(product.sellPrice) : "0" });
  };

  const totals = useMemo(() => {
    let subtotal = 0;
    let discount = 0;
    for (const l of lines) {
      const qty = Number(l.quantity) || 0;
      const price = Number(l.unitPrice) || 0;
      const disc = Number(l.discount) || 0;
      subtotal += qty * price;
      discount += disc;
    }
    subtotal = round2(subtotal);
    discount = round2(discount);
    const tax = round2((subtotal - discount) * data.settings.taxRate);
    const total = round2(subtotal - discount + tax);
    return { subtotal, discount, tax, total };
  }, [lines, data.settings.taxRate]);

  const projectedOutstanding = customer ? customerOutstanding(customer.id, data.invoices) + totals.total : 0;
  const overLimit = !!customer && projectedOutstanding > customer.creditLimit;

  const validate = (): Record<string, string> => {
    const errs: Record<string, string> = {};
    if (!customerId) errs.customer = "Choose a customer.";
    if (scope === "all" && !branchId) errs.branch = "Choose a branch.";
    if (!issuedAt) errs.issuedAt = "Choose an issue date.";
    if (!dueAt) errs.dueAt = "Choose a due date.";
    if (issuedAt && dueAt && dueAt < issuedAt) errs.dueAt = "Due date can't be before the issue date.";
    if (lines.length === 0) errs.lines = "Add at least one line item.";
    for (const l of lines) {
      const qty = Number(l.quantity);
      const price = Number(l.unitPrice);
      const disc = Number(l.discount) || 0;
      if (!l.productId) errs.lines = "Every line needs a product.";
      if (!qty || qty <= 0) errs.lines = "Quantity must be greater than zero on every line.";
      if (Number.isNaN(price) || price < 0) errs.lines = "Unit price can't be negative.";
      if (disc < 0 || disc > qty * price) errs.lines = "Discount can't exceed the line total.";
    }
    return errs;
  };

  const handleSubmit = () => {
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    const branch = data.branches.find((b) => b.id === (scope === "all" ? branchId : scope));
    if (!branch || !customer) return;

    const invoiceLines: InvoiceLine[] = lines.map((l) => {
      const product = data.products.find((p) => p.id === l.productId);
      return {
        productId: l.productId,
        name: product?.name ?? "Unknown product",
        strength: product?.strength ?? "",
        quantity: Number(l.quantity),
        unitPrice: Number(l.unitPrice),
        discount: round2(Number(l.discount) || 0),
      };
    });

    const invoice: Invoice = {
      id: `inv-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
      invoiceNo: nextInvoiceNo(data.invoices, branch),
      branchId: branch.id,
      customerId: customer.id,
      customerName: customer.name,
      issuedAt,
      dueAt,
      lines: invoiceLines,
      subtotal: totals.subtotal,
      discount: totals.discount,
      tax: totals.tax,
      total: totals.total,
      payments: [],
      status: "issued",
      issuedById: currentUser.id,
      issuedByName: currentUser.name,
      note: note.trim() || undefined,
    };

    onCreate(invoice);
    push({
      title: "Invoice created",
      description: `${invoice.invoiceNo} issued to ${invoice.customerName} for ${money(invoice.total, data.settings.currencySymbol)}.`,
      tone: "success",
    });
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="New invoice"
      subtitle="Bill a customer on credit"
      size="xl"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>Create invoice</Button>
        </>
      }
    >
      <div className="space-y-5">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Select
            label="Customer"
            value={customerId}
            onChange={(e) => {
              setCustomerId(e.target.value);
              setDueAtTouched(false);
            }}
            error={errors.customer}
          >
            <option value="">Select a customer…</option>
            {activeCustomers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.type})
              </option>
            ))}
          </Select>

          {scope === "all" ? (
            <Select
              label="Branch"
              value={branchId}
              onChange={(e) => setBranchId(e.target.value)}
              error={errors.branch}
            >
              <option value="">Select a branch…</option>
              {data.branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </Select>
          ) : (
            <Input
              label="Branch"
              value={data.branches.find((b) => b.id === scope)?.name ?? ""}
              disabled
            />
          )}
        </div>

        {customer ? (
          <div className="rounded-xl bg-pos-bg px-3.5 py-3 text-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <span className="text-pos-muted">Credit limit </span>
                <span className="font-semibold text-pos-heading">
                  {money(customer.creditLimit, data.settings.currencySymbol)}
                </span>
              </div>
              <div>
                <span className="text-pos-muted">Current outstanding </span>
                <span className="font-semibold text-pos-heading">
                  {money(customerOutstanding(customer.id, data.invoices), data.settings.currencySymbol)}
                </span>
              </div>
              <div>
                <span className="text-pos-muted">Terms </span>
                <span className="font-semibold text-pos-heading">{customer.paymentTermsDays} days</span>
              </div>
            </div>
            {overLimit ? (
              <p className="mt-2 flex items-start gap-1.5 rounded-lg bg-pos-danger-soft px-2.5 py-2 text-xs font-medium text-pos-danger">
                <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                This invoice would push {customer.name} to{" "}
                {money(projectedOutstanding, data.settings.currencySymbol)}, over their{" "}
                {money(customer.creditLimit, data.settings.currencySymbol)} limit.
              </p>
            ) : null}
          </div>
        ) : null}

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Input
            label="Issue date"
            type="date"
            value={issuedAt}
            onChange={(e) => setIssuedAt(e.target.value)}
            error={errors.issuedAt}
          />
          <Input
            label="Due date"
            type="date"
            value={dueAt}
            onChange={(e) => {
              setDueAt(e.target.value);
              setDueAtTouched(true);
            }}
            error={errors.dueAt}
            hint={customer ? `Auto-set from ${customer.paymentTermsDays}-day terms — editable` : undefined}
          />
          <Input label="Note (optional)" value={note} onChange={(e) => setNote(e.target.value)} />
        </div>

        {/* Line items */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-semibold text-pos-heading">Line items</p>
            <Button size="sm" variant="secondary" icon={Plus} onClick={addLine}>
              Add line
            </Button>
          </div>
          {errors.lines ? <p className="mb-2 text-xs text-pos-danger">{errors.lines}</p> : null}

          {lines.length === 0 ? (
            <div className="rounded-xl border border-dashed border-pos-border px-4 py-6 text-center text-sm text-pos-muted">
              No line items yet — add a product to bill.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-pos-border">
              <table className="w-full text-sm">
                <thead className="bg-pos-bg text-xs uppercase tracking-wide text-pos-muted">
                  <tr>
                    <th className="px-2 py-2 text-left">Product</th>
                    <th className="px-2 py-2 text-right">Qty</th>
                    <th className="px-2 py-2 text-right">Unit price</th>
                    <th className="px-2 py-2 text-right">Discount</th>
                    <th className="px-2 py-2 text-right">Line total</th>
                    <th className="px-2 py-2" />
                  </tr>
                </thead>
                <tbody>
                  {lines.map((l) => {
                    const qty = Number(l.quantity) || 0;
                    const price = Number(l.unitPrice) || 0;
                    const disc = Number(l.discount) || 0;
                    const lineTotal = round2(qty * price - disc);
                    return (
                      <tr key={l.key} className="border-t border-pos-border align-top">
                        <td className="px-2 py-2">
                          <select
                            value={l.productId}
                            onChange={(e) => onProductChange(l.key, e.target.value)}
                            className="w-full min-w-[10rem] rounded-lg border border-pos-border bg-white px-2 py-1.5 text-sm"
                          >
                            {data.products.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.name} ({p.strength})
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-2 py-2">
                          <input
                            type="number"
                            min={1}
                            value={l.quantity}
                            onChange={(e) => updateLine(l.key, { quantity: e.target.value })}
                            className="w-20 rounded-lg border border-pos-border bg-white px-2 py-1.5 text-right text-sm"
                          />
                        </td>
                        <td className="px-2 py-2">
                          <input
                            type="number"
                            min={0}
                            step="0.01"
                            value={l.unitPrice}
                            onChange={(e) => updateLine(l.key, { unitPrice: e.target.value })}
                            className="w-24 rounded-lg border border-pos-border bg-white px-2 py-1.5 text-right text-sm"
                          />
                        </td>
                        <td className="px-2 py-2">
                          <input
                            type="number"
                            min={0}
                            step="0.01"
                            value={l.discount}
                            onChange={(e) => updateLine(l.key, { discount: e.target.value })}
                            className="w-20 rounded-lg border border-pos-border bg-white px-2 py-1.5 text-right text-sm"
                          />
                        </td>
                        <td className="px-2 py-2 text-right font-semibold text-pos-heading">
                          {money(lineTotal, data.settings.currencySymbol)}
                        </td>
                        <td className="px-2 py-2 text-right">
                          <button
                            type="button"
                            onClick={() => removeLine(l.key)}
                            aria-label="Remove line"
                            className="rounded-lg p-1.5 text-pos-muted hover:bg-pos-danger-soft hover:text-pos-danger"
                          >
                            <Trash2 size={15} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Totals */}
        <div className="ml-auto max-w-xs space-y-1 text-sm">
          <div className="flex justify-between text-pos-muted">
            <span>Subtotal</span>
            <span>{money(totals.subtotal, data.settings.currencySymbol)}</span>
          </div>
          <div className="flex justify-between text-pos-muted">
            <span>Discount</span>
            <span>−{money(totals.discount, data.settings.currencySymbol)}</span>
          </div>
          <div className="flex justify-between text-pos-muted">
            <span>VAT ({(data.settings.taxRate * 100).toFixed(0)}%)</span>
            <span>{money(totals.tax, data.settings.currencySymbol)}</span>
          </div>
          <div className="flex justify-between border-t border-pos-border pt-1.5 text-base font-bold text-pos-heading">
            <span>Total</span>
            <span>{money(totals.total, data.settings.currencySymbol)}</span>
          </div>
        </div>
      </div>
    </Modal>
  );
}
