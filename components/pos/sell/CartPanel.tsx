"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  Banknote,
  CreditCard,
  Minus,
  Plus,
  Smartphone,
  ShieldCheck,
  Trash2,
  Users,
  Pause,
  PlayCircle,
  X,
} from "lucide-react";
import type { PaymentMethod, Staff } from "@/lib/pos/types";
import { money } from "@/lib/pos/format";
import { Badge, Button, EmptyState, Input, Select, cn } from "@/components/pos/ui";
import type { CartTotals } from "./cartMath";
import type { CartLine, HeldSale } from "./types";

const PAYMENT_METHODS: { value: PaymentMethod; label: string; icon: typeof Banknote }[] = [
  { value: "Cash", label: "Cash", icon: Banknote },
  { value: "Card", label: "Card", icon: CreditCard },
  { value: "Mobile Money", label: "Mobile Money", icon: Smartphone },
  { value: "Insurance", label: "Insurance", icon: ShieldCheck },
];

export interface CartPanelProps {
  cart: CartLine[];
  onQty: (productId: string, quantity: number) => void;
  onDiscount: (productId: string, discount: number) => void;
  onRemove: (productId: string) => void;
  customerName: string;
  setCustomerName: (v: string) => void;
  prescriptionRef: string;
  setPrescriptionRef: (v: string) => void;
  requiresRx: boolean;
  paymentMethod: PaymentMethod;
  setPaymentMethod: (v: PaymentMethod) => void;
  amountTendered: string;
  setAmountTendered: (v: string) => void;
  cashierId: string;
  setCashierId: (v: string) => void;
  staffOptions: Staff[];
  totals: CartTotals;
  currencySymbol: string;
  canCheckout: boolean;
  blockedReasons: string[];
  onCheckout: () => void;
  onHold: () => void;
  heldSales: HeldSale[];
  onResume: (id: string) => void;
  onDiscardHeld: (id: string) => void;
}

export function CartPanel({
  cart,
  onQty,
  onDiscount,
  onRemove,
  customerName,
  setCustomerName,
  prescriptionRef,
  setPrescriptionRef,
  requiresRx,
  paymentMethod,
  setPaymentMethod,
  amountTendered,
  setAmountTendered,
  cashierId,
  setCashierId,
  staffOptions,
  totals,
  currencySymbol,
  canCheckout,
  blockedReasons,
  onCheckout,
  onHold,
  heldSales,
  onResume,
  onDiscardHeld,
}: CartPanelProps) {
  const tendered = parseFloat(amountTendered) || 0;
  const change = Math.max(0, Math.round((tendered - totals.total) * 100) / 100);
  const denominations = [20, 50, 100, 200, 500];

  return (
    <div className="flex flex-col gap-4">
      {heldSales.length > 0 ? (
        <div className="rounded-2xl bg-pos-warn-soft p-3">
          <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-pos-warn">
            <Pause size={12} /> Held sales ({heldSales.length})
          </p>
          <div className="space-y-1.5">
            {heldSales.map((h) => (
              <div
                key={h.id}
                className="flex items-center justify-between gap-2 rounded-xl bg-white px-3 py-2 text-xs shadow-card"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium text-pos-heading">{h.label}</p>
                  <p className="text-pos-muted">{h.cart.length} item{h.cart.length === 1 ? "" : "s"}</p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    onClick={() => onResume(h.id)}
                    aria-label={`Resume ${h.label}`}
                    className="rounded-lg p-1.5 text-pos-brand hover:bg-pos-brand-soft"
                  >
                    <PlayCircle size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDiscardHeld(h.id)}
                    aria-label={`Discard ${h.label}`}
                    className="rounded-lg p-1.5 text-pos-danger hover:bg-pos-danger-soft"
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {/* Line items */}
      {cart.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Cart is empty"
          description="Search or scan a product to start a sale."
        />
      ) : (
        <div className="space-y-2.5">
          <AnimatePresence initial={false}>
            {cart.map((line) => (
              <motion.div
                key={line.productId}
                layout
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.15 }}
                className="rounded-xl border border-pos-border p-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-pos-heading">{line.name}</p>
                    <p className="truncate text-xs text-pos-muted">
                      {line.strength} · {money(line.unitPrice, currencySymbol)} each
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onRemove(line.productId)}
                    aria-label={`Remove ${line.name}`}
                    className="shrink-0 rounded-lg p-1.5 text-pos-muted hover:bg-pos-danger-soft hover:text-pos-danger"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>

                <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 rounded-lg bg-pos-bg p-1">
                    <button
                      type="button"
                      aria-label="Decrease quantity"
                      onClick={() => onQty(line.productId, line.quantity - 1)}
                      disabled={line.quantity <= 1}
                      className="flex h-7 w-7 items-center justify-center rounded-md bg-white text-pos-heading shadow-sm disabled:opacity-40"
                    >
                      <Minus size={13} />
                    </button>
                    <span className="w-6 text-center text-sm font-semibold text-pos-heading">
                      {line.quantity}
                    </span>
                    <button
                      type="button"
                      aria-label="Increase quantity"
                      onClick={() => onQty(line.productId, line.quantity + 1)}
                      disabled={line.quantity >= line.onHand}
                      className="flex h-7 w-7 items-center justify-center rounded-md bg-white text-pos-heading shadow-sm disabled:opacity-40"
                    >
                      <Plus size={13} />
                    </button>
                  </div>

                  <label className="flex items-center gap-1.5 text-xs text-pos-muted">
                    Discount
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      value={line.discount || ""}
                      onChange={(e) => {
                        const v = Math.max(0, Number(e.target.value) || 0);
                        onDiscount(line.productId, Math.min(v, line.unitPrice * line.quantity));
                      }}
                      placeholder="0.00"
                      className="w-16 rounded-md border border-pos-border px-2 py-1 text-right text-xs text-pos-heading focus:outline-none focus:ring-2 focus:ring-pos-brand/30"
                    />
                  </label>

                  <p className="ml-auto text-sm font-semibold text-pos-heading">
                    {money(line.unitPrice * line.quantity - line.discount, currencySymbol)}
                  </p>
                </div>
                {line.quantity >= line.onHand ? (
                  <p className="mt-1.5 text-[11px] text-pos-warn">Max available stock reached.</p>
                ) : null}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Totals */}
      <div className="space-y-1.5 border-t border-pos-border pt-3 text-sm">
        <div className="flex justify-between text-pos-muted">
          <span>Subtotal</span>
          <span>{money(totals.subtotal, currencySymbol)}</span>
        </div>
        <div className="flex justify-between text-pos-muted">
          <span>Discount</span>
          <span>−{money(totals.discount, currencySymbol)}</span>
        </div>
        <div className="flex justify-between text-pos-muted">
          <span>VAT</span>
          <span>{money(totals.tax, currencySymbol)}</span>
        </div>
        <div className="flex items-baseline justify-between border-t border-pos-border pt-2">
          <span className="text-base font-semibold text-pos-heading">Total</span>
          <span className="text-2xl font-bold tracking-tight text-pos-heading">
            {money(totals.total, currencySymbol)}
          </span>
        </div>
      </div>

      {/* Customer & prescription */}
      <div className="space-y-3 border-t border-pos-border pt-3">
        <Input
          label="Customer"
          value={customerName}
          onChange={(e) => setCustomerName(e.target.value)}
          placeholder="Walk-in Customer"
        />
        {requiresRx ? (
          <div>
            <Input
              label="Prescription reference"
              value={prescriptionRef}
              onChange={(e) => setPrescriptionRef(e.target.value)}
              placeholder="e.g. RX-48213"
              error={!prescriptionRef.trim() ? "Required — this cart contains prescription-only items." : undefined}
            />
          </div>
        ) : null}
        <Select label="Cashier / pharmacist" value={cashierId} onChange={(e) => setCashierId(e.target.value)}>
          <option value="">Select staff...</option>
          {staffOptions.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name} — {s.role}
            </option>
          ))}
        </Select>
      </div>

      {/* Payment */}
      <div className="space-y-3 border-t border-pos-border pt-3">
        <p className="text-sm font-medium text-pos-heading">Payment method</p>
        <div className="grid grid-cols-2 gap-2">
          {PAYMENT_METHODS.map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              type="button"
              onClick={() => setPaymentMethod(value)}
              className={cn(
                "flex items-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-medium transition-colors",
                paymentMethod === value
                  ? "border-pos-brand bg-pos-brand-soft text-pos-brand-dark"
                  : "border-pos-border text-pos-heading hover:bg-pos-bg",
              )}
            >
              <Icon size={15} />
              {label}
            </button>
          ))}
        </div>

        {paymentMethod === "Cash" ? (
          <div className="space-y-2">
            <Input
              label="Amount tendered"
              type="number"
              min={0}
              step="0.01"
              value={amountTendered}
              onChange={(e) => setAmountTendered(e.target.value)}
              placeholder={totals.total.toFixed(2)}
            />
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => setAmountTendered(totals.total.toFixed(2))}
                className="rounded-lg border border-pos-border px-2.5 py-1 text-xs font-medium text-pos-heading hover:bg-pos-bg"
              >
                Exact
              </button>
              {denominations.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setAmountTendered(String(d))}
                  className="rounded-lg border border-pos-border px-2.5 py-1 text-xs font-medium text-pos-heading hover:bg-pos-bg"
                >
                  {currencySymbol}{d}
                </button>
              ))}
            </div>
            <div
              className={cn(
                "flex items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-semibold",
                tendered >= totals.total ? "bg-pos-ok-soft text-pos-ok" : "bg-pos-danger-soft text-pos-danger",
              )}
            >
              <span>Change due</span>
              <span>{money(change, currencySymbol)}</span>
            </div>
          </div>
        ) : null}
      </div>

      {!canCheckout && blockedReasons.length > 0 ? (
        <ul className="space-y-1 rounded-xl bg-pos-danger-soft px-3.5 py-2.5 text-xs text-pos-danger">
          {blockedReasons.map((r) => (
            <li key={r}>• {r}</li>
          ))}
        </ul>
      ) : null}

      <div className="flex gap-2">
        <Button variant="secondary" icon={Pause} onClick={onHold} disabled={cart.length === 0} className="flex-1">
          Hold sale
        </Button>
        <Button onClick={onCheckout} disabled={!canCheckout} size="lg" className="flex-[2]">
          Complete sale
        </Button>
      </div>
    </div>
  );
}
