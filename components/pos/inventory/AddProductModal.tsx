"use client";

import { FormEvent, useState } from "react";
import { usePos } from "@/lib/pos/store";
import type { DrugCategory, Product } from "@/lib/pos/types";
import { Button, Input, Modal, Select, useToast } from "@/components/pos/ui";

const CATEGORIES: DrugCategory[] = [
  "Antibiotics",
  "Analgesics",
  "Antimalarials",
  "Cardiovascular",
  "Diabetes",
  "Vitamins & Supplements",
  "Cold & Flu",
  "Dermatology",
  "Gastrointestinal",
  "First Aid",
  "Baby & Mother",
  "Medical Devices",
];

const FORMS: Product["form"][] = [
  "Tablet",
  "Capsule",
  "Syrup",
  "Injection",
  "Cream",
  "Drops",
  "Inhaler",
  "Device",
];

interface FormState {
  name: string;
  genericName: string;
  brand: string;
  category: DrugCategory;
  form: Product["form"];
  strength: string;
  packSize: string;
  barcode: string;
  costPrice: string;
  sellPrice: string;
  reorderLevel: string;
  supplierId: string;
  prescriptionOnly: boolean;
  controlled: boolean;
}

const EMPTY_FORM: FormState = {
  name: "",
  genericName: "",
  brand: "",
  category: "Analgesics",
  form: "Tablet",
  strength: "",
  packSize: "",
  barcode: "",
  costPrice: "",
  sellPrice: "",
  reorderLevel: "",
  supplierId: "",
  prescriptionOnly: false,
  controlled: false,
};

export function AddProductModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { data } = usePos();
  const { push } = useToast();
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const close = () => {
    setForm(EMPTY_FORM);
    setErrors({});
    onClose();
  };

  const validate = (): boolean => {
    const next: Partial<Record<keyof FormState, string>> = {};
    if (!form.name.trim()) next.name = "Product name is required.";
    if (!form.genericName.trim()) next.genericName = "Generic name is required.";
    if (!form.brand.trim()) next.brand = "Brand is required.";
    if (!form.strength.trim()) next.strength = "Strength is required.";
    if (!form.packSize.trim()) next.packSize = "Pack size is required.";
    if (!form.barcode.trim()) next.barcode = "Barcode is required.";
    if (!form.supplierId) next.supplierId = "Select a supplier.";

    const cost = Number(form.costPrice);
    if (!form.costPrice || !Number.isFinite(cost) || cost <= 0) {
      next.costPrice = "Enter a valid cost price.";
    }
    const sell = Number(form.sellPrice);
    if (!form.sellPrice || !Number.isFinite(sell) || sell <= 0) {
      next.sellPrice = "Enter a valid sell price.";
    }
    if (!next.costPrice && !next.sellPrice && sell < cost) {
      next.sellPrice = "Sell price should be at least the cost price.";
    }
    const reorder = Number(form.reorderLevel);
    if (!form.reorderLevel || !Number.isFinite(reorder) || reorder < 0) {
      next.reorderLevel = "Enter a valid reorder level.";
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    push({
      title: "Product created",
      description: `${form.name} (${form.strength}) would be added to the catalogue. This demo doesn't persist new products.`,
      tone: "success",
    });
    close();
  };

  return (
    <Modal
      open={open}
      onClose={close}
      size="lg"
      title="Add product"
      subtitle="Create a new catalogue entry — shared across all branches."
      footer={
        <>
          <Button variant="secondary" onClick={close}>
            Cancel
          </Button>
          <Button form="add-product-form" type="submit">
            Create product
          </Button>
        </>
      }
    >
      <form id="add-product-form" onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Product name"
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            error={errors.name}
            placeholder="Amoxil"
          />
          <Input
            label="Generic name"
            value={form.genericName}
            onChange={(e) => set("genericName", e.target.value)}
            error={errors.genericName}
            placeholder="Amoxicillin"
          />
          <Input
            label="Brand"
            value={form.brand}
            onChange={(e) => set("brand", e.target.value)}
            error={errors.brand}
            placeholder="GSK"
          />
          <Select
            label="Category"
            value={form.category}
            onChange={(e) => set("category", e.target.value as DrugCategory)}
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
          <Select
            label="Form"
            value={form.form}
            onChange={(e) => set("form", e.target.value as Product["form"])}
          >
            {FORMS.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </Select>
          <Input
            label="Strength"
            value={form.strength}
            onChange={(e) => set("strength", e.target.value)}
            error={errors.strength}
            placeholder="500mg"
          />
          <Input
            label="Pack size"
            value={form.packSize}
            onChange={(e) => set("packSize", e.target.value)}
            error={errors.packSize}
            placeholder="30 tablets"
          />
          <Input
            label="Barcode"
            value={form.barcode}
            onChange={(e) => set("barcode", e.target.value)}
            error={errors.barcode}
            placeholder="6001234567890"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Input
            label="Cost price"
            type="number"
            min={0}
            step="0.01"
            value={form.costPrice}
            onChange={(e) => set("costPrice", e.target.value)}
            error={errors.costPrice}
          />
          <Input
            label="Sell price"
            type="number"
            min={0}
            step="0.01"
            value={form.sellPrice}
            onChange={(e) => set("sellPrice", e.target.value)}
            error={errors.sellPrice}
          />
          <Input
            label="Reorder level"
            type="number"
            min={0}
            value={form.reorderLevel}
            onChange={(e) => set("reorderLevel", e.target.value)}
            error={errors.reorderLevel}
            hint="Units per branch"
          />
        </div>

        <Select
          label="Supplier"
          value={form.supplierId}
          onChange={(e) => set("supplierId", e.target.value)}
          error={errors.supplierId}
        >
          <option value="">Select a supplier…</option>
          {data.suppliers.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </Select>

        <div className="flex flex-wrap gap-6">
          <label className="flex items-center gap-2 text-sm text-pos-heading">
            <input
              type="checkbox"
              checked={form.prescriptionOnly}
              onChange={(e) => set("prescriptionOnly", e.target.checked)}
              className="h-4 w-4 rounded border-pos-border text-pos-brand focus:ring-pos-brand/40"
            />
            Prescription only (Rx)
          </label>
          <label className="flex items-center gap-2 text-sm text-pos-heading">
            <input
              type="checkbox"
              checked={form.controlled}
              onChange={(e) => set("controlled", e.target.checked)}
              className="h-4 w-4 rounded border-pos-border text-pos-brand focus:ring-pos-brand/40"
            />
            Controlled substance
          </label>
        </div>
      </form>
    </Modal>
  );
}
