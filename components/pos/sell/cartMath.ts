import type { CartLine } from "./types";

/** Round to 2dp the same way everywhere, so totals never drift from float noise. */
export const round2 = (value: number) => Math.round(value * 100) / 100;

export interface CartTotals {
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
}

export function computeTotals(cart: CartLine[], taxRate: number): CartTotals {
  const subtotal = round2(cart.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0));
  const discount = round2(cart.reduce((sum, l) => sum + l.discount, 0));
  const taxable = Math.max(0, subtotal - discount);
  const tax = round2(taxable * taxRate);
  const total = round2(taxable + tax);
  return { subtotal, discount, tax, total };
}

export const itemCount = (cart: CartLine[]) => cart.reduce((sum, l) => sum + l.quantity, 0);
