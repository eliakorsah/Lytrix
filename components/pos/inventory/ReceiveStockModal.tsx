"use client";

import { FormEvent, useEffect, useState } from "react";
import { usePos } from "@/lib/pos/store";
import { Button, Input, Modal, Select, useToast } from "@/components/pos/ui";

interface FormState {
  productId: string;
  branchId: string;
  batchNumber: string;
  quantity: string;
  expiryDate: string;
}

const emptyForm = (defaultBranch: string): FormState => ({
  productId: "",
  branchId: defaultBranch,
  batchNumber: "",
  quantity: "",
  expiryDate: "",
});

function genId() {
  return `btc-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

export function ReceiveStockModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { data, scope, addStockBatch } = usePos();
  const { push } = useToast();
  const defaultBranch = scope === "all" ? "" : scope;
  const [form, setForm] = useState<FormState>(emptyForm(defaultBranch));
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});

  // Keep the branch default in sync with the active scope whenever the modal (re)opens.
  useEffect(() => {
    if (open) setForm(emptyForm(scope === "all" ? "" : scope));
  }, [open, scope]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const close = () => {
    setForm(emptyForm(defaultBranch));
    setErrors({});
    onClose();
  };

  const validate = (): boolean => {
    const next: Partial<Record<keyof FormState, string>> = {};
    if (!form.productId) next.productId = "Select a product.";
    if (!form.branchId) next.branchId = "Select a branch.";
    if (!form.batchNumber.trim()) next.batchNumber = "Batch number is required.";
    const qty = Number(form.quantity);
    if (!form.quantity || !Number.isFinite(qty) || qty <= 0) {
      next.quantity = "Enter a valid quantity.";
    }
    if (!form.expiryDate) next.expiryDate = "Expiry date is required.";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const product = data.products.find((p) => p.id === form.productId);
    const branch = data.branches.find((b) => b.id === form.branchId);

    addStockBatch({
      id: genId(),
      productId: form.productId,
      branchId: form.branchId,
      batchNumber: form.batchNumber.trim(),
      quantity: Math.round(Number(form.quantity)),
      expiryDate: form.expiryDate,
      receivedAt: new Date().toISOString().slice(0, 10),
    });

    push({
      title: "Stock received",
      description: `${form.quantity} units of ${product?.name ?? "product"} added to ${branch?.name ?? "branch"} (batch ${form.batchNumber}).`,
      tone: "success",
    });
    close();
  };

  return (
    <Modal
      open={open}
      onClose={close}
      size="md"
      title="Receive stock"
      subtitle="Log a new batch arriving at a branch."
      footer={
        <>
          <Button variant="secondary" onClick={close}>
            Cancel
          </Button>
          <Button form="receive-stock-form" type="submit">
            Receive stock
          </Button>
        </>
      }
    >
      <form id="receive-stock-form" onSubmit={handleSubmit} className="space-y-4">
        <Select
          label="Product"
          value={form.productId}
          onChange={(e) => set("productId", e.target.value)}
          error={errors.productId}
        >
          <option value="">Select a product…</option>
          {data.products.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} — {p.strength}
            </option>
          ))}
        </Select>

        <Select
          label="Branch"
          value={form.branchId}
          onChange={(e) => set("branchId", e.target.value)}
          error={errors.branchId}
          hint={scope !== "all" ? "Defaults to the branch you're currently viewing." : undefined}
        >
          <option value="">Select a branch…</option>
          {data.branches.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </Select>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Batch number"
            value={form.batchNumber}
            onChange={(e) => set("batchNumber", e.target.value)}
            error={errors.batchNumber}
            placeholder="B-2026-0142"
          />
          <Input
            label="Quantity"
            type="number"
            min={1}
            value={form.quantity}
            onChange={(e) => set("quantity", e.target.value)}
            error={errors.quantity}
          />
        </div>

        <Input
          label="Expiry date"
          type="date"
          value={form.expiryDate}
          onChange={(e) => set("expiryDate", e.target.value)}
          error={errors.expiryDate}
        />
      </form>
    </Modal>
  );
}
