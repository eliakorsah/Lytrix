"use client";

import { useEffect, useState } from "react";
import {
  AlertTriangle,
  Boxes,
  Building2,
  Info,
  Receipt as ReceiptIcon,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import { usePos } from "@/lib/pos/store";
import { money } from "@/lib/pos/format";
import { can } from "@/lib/pos/permissions";
import {
  Badge,
  Button,
  Card,
  CardHeader,
  Input,
  Modal,
  PageHeader,
  Select,
  Skeleton,
  Textarea,
  useToast,
} from "@/components/pos/ui";
import { RequireCapability } from "@/components/pos/RequireCapability";

interface CurrencyOption {
  code: string;
  symbol: string;
  label: string;
}

const CURRENCIES: CurrencyOption[] = [
  { code: "GHS", symbol: "₵", label: "GHS — Ghanaian Cedi (₵)" },
  { code: "NGN", symbol: "₦", label: "NGN — Nigerian Naira (₦)" },
  { code: "USD", symbol: "$", label: "USD — US Dollar ($)" },
  { code: "GBP", symbol: "£", label: "GBP — British Pound (£)" },
  { code: "EUR", symbol: "€", label: "EUR — Euro (€)" },
  { code: "KES", symbol: "KSh", label: "KES — Kenyan Shilling (KSh)" },
];

const FEATURES = [
  "Multi-branch network with a consolidated Main Branch view",
  "Real-time-style POS terminal with cart, discounts & payment methods",
  "Per-batch inventory tracking with expiry & low-stock alerts",
  "Stock transfers between branches with a full approval workflow",
  "Staff & role management with per-role permissions",
  "Configurable business settings, including live currency switching",
];

function SettingsPageInner() {
  const { data, ready, updateSettings, resetDemo, currentUser } = usePos();
  const { push } = useToast();

  const canEdit = can(currentUser, "settings:edit");
  const canReset = can(currentUser, "demo:reset");

  const [businessName, setBusinessName] = useState("");
  const [currencyCode, setCurrencyCode] = useState("GHS");
  const [taxRatePct, setTaxRatePct] = useState("15");
  const [lowStockAlerts, setLowStockAlerts] = useState(true);
  const [expiryWarningDays, setExpiryWarningDays] = useState("90");
  const [receiptFooter, setReceiptFooter] = useState("");
  const [resetOpen, setResetOpen] = useState(false);

  useEffect(() => {
    if (!ready) return;
    setBusinessName(data.settings.businessName);
    setCurrencyCode(data.settings.currencyCode);
    setTaxRatePct(String(Math.round(data.settings.taxRate * 1000) / 10));
    setLowStockAlerts(data.settings.lowStockAlerts);
    setExpiryWarningDays(String(data.settings.expiryWarningDays));
    setReceiptFooter(data.settings.receiptFooter);
  }, [ready, data.settings]);

  if (!ready) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-9 w-64" />
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-56" />
        ))}
      </div>
    );
  }

  const currentCurrency = CURRENCIES.find((c) => c.code === currencyCode);

  const saveBusiness = () => {
    if (!canEdit) return;
    const symbol = CURRENCIES.find((c) => c.code === currencyCode)?.symbol ?? data.settings.currencySymbol;
    const taxRate = Math.max(0, Number(taxRatePct) || 0) / 100;
    updateSettings({
      businessName: businessName.trim() || data.settings.businessName,
      currencyCode,
      currencySymbol: symbol,
      taxRate,
    });
    push({
      title: "Business settings saved",
      description: `Currency set to ${currencyCode} (${symbol}) — figures update across the app.`,
      tone: "success",
    });
  };

  const saveInventory = () => {
    if (!canEdit) return;
    updateSettings({
      lowStockAlerts,
      expiryWarningDays: Math.max(1, Number(expiryWarningDays) || data.settings.expiryWarningDays),
    });
    push({ title: "Inventory settings saved", tone: "success" });
  };

  const saveReceipt = () => {
    if (!canEdit) return;
    updateSettings({ receiptFooter });
    push({ title: "Receipt settings saved", tone: "success" });
  };

  const handleReset = () => {
    if (!canReset) return;
    resetDemo();
    setResetOpen(false);
    push({
      title: "Demo data reset",
      description: "MediPlus Pharmacy has been restored to its seeded state.",
      tone: "success",
    });
  };

  return (
    <div>
      <PageHeader title="Settings" subtitle="Configure MediPlus Pharmacy's business, inventory & receipt defaults." />

      <div className="space-y-6">
        {/* Business */}
        <Card>
          <CardHeader
            title="Business"
            subtitle="Your business identity and pricing defaults."
            action={<Building2 size={18} className="text-pos-muted" />}
          />
          <div className="space-y-4">
            <Input
              label="Business name"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              disabled={!canEdit}
            />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Select
                label="Currency"
                value={currencyCode}
                onChange={(e) => setCurrencyCode(e.target.value)}
                hint="Changing this updates the currency symbol used across the entire app."
                disabled={!canEdit}
              >
                {CURRENCIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.label}
                  </option>
                ))}
              </Select>
              <Input
                label="Tax / VAT rate"
                type="number"
                min={0}
                max={100}
                step={0.5}
                value={taxRatePct}
                onChange={(e) => setTaxRatePct(e.target.value)}
                hint="Stored as a decimal, e.g. 15% → 0.15."
                disabled={!canEdit}
              />
            </div>
            <div className="flex items-center gap-2 rounded-xl bg-pos-brand-soft px-3.5 py-2.5 text-xs text-pos-brand-dark">
              <Sparkles size={14} className="shrink-0" />
              Try it: switch the currency and save — every figure in the demo, from stat tiles to
              receipts, updates instantly to {currentCurrency?.symbol ?? "…"}.
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <Button onClick={saveBusiness} disabled={!canEdit}>
              Save business settings
            </Button>
          </div>
        </Card>

        {/* Inventory */}
        <Card>
          <CardHeader
            title="Inventory"
            subtitle="Alerting thresholds used across branches."
            action={<Boxes size={18} className="text-pos-muted" />}
          />
          <div className="space-y-4">
            <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-pos-border p-3.5">
              <span>
                <span className="block text-sm font-medium text-pos-heading">Low-stock alerts</span>
                <span className="block text-xs text-pos-muted">
                  Flag products at or below their reorder level.
                </span>
              </span>
              <input
                type="checkbox"
                checked={lowStockAlerts}
                onChange={(e) => setLowStockAlerts(e.target.checked)}
                disabled={!canEdit}
                className="h-5 w-9 shrink-0 cursor-pointer appearance-none rounded-full bg-pos-border transition-colors checked:bg-pos-brand relative before:absolute before:left-0.5 before:top-0.5 before:h-4 before:w-4 before:rounded-full before:bg-white before:transition-transform checked:before:translate-x-4 disabled:cursor-not-allowed"
              />
            </label>
            <Input
              label="Expiry warning window (days)"
              type="number"
              min={1}
              value={expiryWarningDays}
              onChange={(e) => setExpiryWarningDays(e.target.value)}
              hint="Batches expiring within this many days are flagged across the app."
              disabled={!canEdit}
            />
          </div>
          <div className="mt-4 flex justify-end">
            <Button onClick={saveInventory} disabled={!canEdit}>
              Save inventory settings
            </Button>
          </div>
        </Card>

        {/* Receipt */}
        <Card>
          <CardHeader
            title="Receipt"
            subtitle="Footer message printed on every till receipt."
            action={<ReceiptIcon size={18} className="text-pos-muted" />}
          />
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            <Textarea
              label="Receipt footer"
              value={receiptFooter}
              onChange={(e) => setReceiptFooter(e.target.value)}
              placeholder="e.g. Thank you for choosing MediPlus. Get well soon!"
              disabled={!canEdit}
            />
            <div>
              <p className="mb-1.5 block text-sm font-medium text-pos-heading">Live preview</p>
              <div className="rounded-xl border border-dashed border-pos-border bg-pos-bg p-4 font-mono text-xs text-pos-heading">
                <p className="text-center font-semibold">{businessName || "MediPlus Pharmacy"}</p>
                <p className="mt-1 text-center text-pos-muted">Receipt #ACC-01-100234</p>
                <div className="my-2 border-t border-dashed border-pos-border" />
                <div className="flex justify-between">
                  <span>Panadol Extra x2</span>
                  <span>{money(22, currentCurrency?.symbol ?? data.settings.currencySymbol)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Amoxil x1</span>
                  <span>{money(28, currentCurrency?.symbol ?? data.settings.currencySymbol)}</span>
                </div>
                <div className="my-2 border-t border-dashed border-pos-border" />
                <div className="flex justify-between font-semibold">
                  <span>Total</span>
                  <span>{money(57.5, currentCurrency?.symbol ?? data.settings.currencySymbol)}</span>
                </div>
                <div className="my-2 border-t border-dashed border-pos-border" />
                <p className="text-center italic text-pos-muted">
                  {receiptFooter || "Thank you for your purchase!"}
                </p>
              </div>
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <Button onClick={saveReceipt} disabled={!canEdit}>
              Save receipt settings
            </Button>
          </div>
        </Card>

        {/* Demo controls */}
        {canReset ? (
          <Card>
            <CardHeader
              title="Demo controls"
              subtitle="Reset this demo back to its original seeded state."
              action={<RotateCcw size={18} className="text-pos-muted" />}
            />
            <div className="flex flex-col items-start justify-between gap-4 rounded-xl bg-pos-danger-soft p-4 sm:flex-row sm:items-center">
              <div className="flex items-start gap-2.5">
                <AlertTriangle size={16} className="mt-0.5 shrink-0 text-pos-danger" />
                <div>
                  <p className="text-sm font-medium text-pos-heading">Reset demo data</p>
                  <p className="text-xs text-pos-muted">
                    Restores every branch, product, sale, transfer and staff record to the original
                    seeded dataset. This cannot be undone.
                  </p>
                </div>
              </div>
              <Button variant="danger" onClick={() => setResetOpen(true)}>
                Reset demo data
              </Button>
            </div>
          </Card>
        ) : null}

        {/* About */}
        <Card>
          <CardHeader
            title="About this demo"
            subtitle="Built by Lytrix Consult."
            action={<Info size={18} className="text-pos-muted" />}
          />
          <p className="text-sm text-pos-muted">
            This is a fully interactive pharmacy point-of-sale demo built by{" "}
            <span className="font-medium text-pos-heading">Lytrix Consult</span> to showcase a
            multi-branch retail platform — every number is generated locally and stored in your
            browser, nothing leaves your device.
          </p>
          <div className="mt-4">
            <Badge tone="brand">Feature set</Badge>
            <ul className="mt-3 space-y-1.5">
              {FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-1.5 text-sm text-pos-heading">
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-pos-brand" />
                  {f}
                </li>
              ))}
            </ul>
          </div>
        </Card>
      </div>

      <Modal
        open={resetOpen}
        onClose={() => setResetOpen(false)}
        title="Reset demo data?"
        subtitle="This restores MediPlus Pharmacy to its original seeded state."
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setResetOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleReset}>
              Reset data
            </Button>
          </>
        }
      >
        <p className="text-sm text-pos-muted">
          All branches, staff, transfers, sales and settings you've changed during this session
          will be discarded and replaced with the original demo dataset. This cannot be undone.
        </p>
      </Modal>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <RequireCapability capability="view:settings">
      <SettingsPageInner />
    </RequireCapability>
  );
}
