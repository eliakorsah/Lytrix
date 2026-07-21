"use client";

import { useEffect, useState } from "react";
import type { Invoice, InvoicePayment, PaymentMethod } from "@/lib/pos/types";
import { money } from "@/lib/pos/format";
import { Button, Input, Modal, Select, useToast } from "@/components/pos/ui";
import { balanceOf, paymentMethods } from "./invoiceHelpers";

export interface RecordPaymentModalProps {
  open: boolean;
  invoice: Invoice | null;
  currencySymbol: string;
  recordedBy: string;
  onClose: () => void;
  onSubmit: (invoiceId: string, payment: InvoicePayment) => void;
}

const round2 = (x: number) => Math.round(x * 100) / 100;

export function RecordPaymentModal({
  open,
  invoice,
  currencySymbol,
  recordedBy,
  onClose,
  onSubmit,
}: RecordPaymentModalProps) {
  const { push } = useToast();
  const balance = invoice ? balanceOf(invoice) : 0;

  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<PaymentMethod>("Cash");
  const [reference, setReference] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && invoice) {
      setAmount(balance > 0 ? balance.toFixed(2) : "");
      setMethod("Cash");
      setReference("");
      setDate(new Date().toISOString().slice(0, 10));
      setError(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, invoice?.id]);

  if (!invoice) return null;

  const amountNum = Number(amount);
  const validate = () => {
    if (!amount.trim() || Number.isNaN(amountNum)) return "Enter a payment amount.";
    if (amountNum <= 0) return "Amount must be greater than zero.";
    if (round2(amountNum) > balance + 0.01) {
      return `Amount cannot exceed the outstanding balance of ${money(balance, currencySymbol)}.`;
    }
    if (!date) return "Choose a payment date.";
    return null;
  };

  const handleSubmit = () => {
    const err = validate();
    if (err) {
      setError(err);
      return;
    }
    const payment: InvoicePayment = {
      id: `pay-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
      amount: round2(amountNum),
      method,
      reference: reference.trim() || undefined,
      paidAt: new Date(date).toISOString(),
      recordedBy,
    };
    onSubmit(invoice.id, payment);
    push({
      title: "Payment recorded",
      description: `${money(payment.amount, currencySymbol)} applied to ${invoice.invoiceNo}.`,
      tone: "success",
    });
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Record payment"
      subtitle={`${invoice.invoiceNo} · ${invoice.customerName}`}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>Record payment</Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="rounded-xl bg-pos-bg px-3.5 py-2.5 text-sm">
          <div className="flex justify-between text-pos-muted">
            <span>Outstanding balance</span>
            <span className="font-semibold text-pos-heading">{money(balance, currencySymbol)}</span>
          </div>
        </div>

        <Input
          label="Amount"
          type="number"
          min={0}
          step="0.01"
          value={amount}
          onChange={(e) => {
            setAmount(e.target.value);
            setError(null);
          }}
          error={error ?? undefined}
        />

        <Select
          label="Method"
          value={method}
          onChange={(e) => setMethod(e.target.value as PaymentMethod)}
        >
          {paymentMethods.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </Select>

        <Input
          label="Reference (optional)"
          value={reference}
          onChange={(e) => setReference(e.target.value)}
          placeholder="e.g. transaction / cheque no."
        />

        <Input label="Date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      </div>
    </Modal>
  );
}
