// Local types for the till (Sell) page only. Kept separate from lib/pos/types.ts
// because a cart line is a work-in-progress version of a SaleLine (it also
// tracks the max quantity available so the UI can never oversell).

import type { PaymentMethod, Product } from "@/lib/pos/types";

export interface CartLine {
  productId: string;
  name: string;
  strength: string;
  form: Product["form"];
  packSize: string;
  unitPrice: number;
  quantity: number;
  discount: number; // absolute amount off this line
  batchNumber: string;
  onHand: number; // units on hand for this product at the active branch, at the moment it was added
  prescriptionOnly: boolean;
  controlled: boolean;
}

export interface HeldSale {
  id: string;
  label: string;
  heldAt: string;
  cart: CartLine[];
  customerName: string;
  prescriptionRef: string;
  paymentMethod: PaymentMethod;
  cashierId: string;
}
