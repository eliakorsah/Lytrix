// Domain model for the pharmacy POS demo.
// Everything is plain data so it can be seeded, serialised to localStorage,
// and reset without touching a backend.

export type BranchId = string;

export interface Branch {
  id: BranchId;
  name: string;
  code: string; // short label used on receipts & transfer slips, e.g. "ACC-01"
  isMain: boolean; // the Main Branch sees consolidated data across all branches
  address: string;
  city: string;
  phone: string;
  manager: string;
  openedAt: string; // ISO date
  active: boolean;
}

export type DrugCategory =
  | "Antibiotics"
  | "Analgesics"
  | "Antimalarials"
  | "Cardiovascular"
  | "Diabetes"
  | "Vitamins & Supplements"
  | "Cold & Flu"
  | "Dermatology"
  | "Gastrointestinal"
  | "First Aid"
  | "Baby & Mother"
  | "Medical Devices";

/** A product definition — shared across every branch. */
export interface Product {
  id: string;
  name: string;
  genericName: string;
  brand: string;
  category: DrugCategory;
  form: "Tablet" | "Capsule" | "Syrup" | "Injection" | "Cream" | "Drops" | "Inhaler" | "Device";
  strength: string; // "500mg", "125mg/5ml"
  packSize: string; // "30 tablets", "100ml bottle"
  barcode: string;
  /** Prescription-only medicine — the till must capture a prescription. */
  prescriptionOnly: boolean;
  /** Controlled substance — extra audit trail in a real deployment. */
  controlled: boolean;
  costPrice: number;
  sellPrice: number;
  reorderLevel: number; // per-branch threshold that triggers a low-stock alert
  supplierId: string;
}

/** Stock is tracked per branch, per batch — batches carry expiry. */
export interface StockBatch {
  id: string;
  productId: string;
  branchId: BranchId;
  batchNumber: string;
  quantity: number;
  expiryDate: string; // ISO date
  receivedAt: string; // ISO date
}

export interface Supplier {
  id: string;
  name: string;
  contact: string;
  phone: string;
  email: string;
  leadTimeDays: number;
}

export interface SaleLine {
  productId: string;
  name: string;
  strength: string;
  quantity: number;
  unitPrice: number;
  discount: number; // absolute amount off this line
  batchNumber: string;
}

export type PaymentMethod = "Cash" | "Card" | "Mobile Money" | "Insurance";

export interface Sale {
  id: string;
  receiptNo: string;
  branchId: BranchId;
  createdAt: string; // ISO datetime
  lines: SaleLine[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  paymentMethod: PaymentMethod;
  amountTendered: number;
  change: number;
  cashierId: string;
  cashierName: string;
  customerName?: string;
  prescriptionRef?: string;
  status: "completed" | "refunded";
}

export type TransferStatus = "pending" | "in-transit" | "received" | "cancelled";

/** Stock moving between branches — requested by one, approved by Main. */
export interface Transfer {
  id: string;
  reference: string;
  fromBranchId: BranchId;
  toBranchId: BranchId;
  createdAt: string;
  status: TransferStatus;
  requestedBy: string;
  note?: string;
  lines: {
    productId: string;
    name: string;
    quantity: number;
    batchNumber: string;
  }[];
}

export type StaffRole = "Administrator" | "Branch Manager" | "Pharmacist" | "Cashier";

export interface Staff {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: StaffRole;
  branchId: BranchId; // Administrators are attached to the main branch
  active: boolean;
  lastActive: string; // ISO datetime
}

/** A billable account — an insurer, a corporate client, or a credit customer. */
export interface Customer {
  id: string;
  name: string;
  type: "Individual" | "Corporate" | "Insurance";
  contact: string;
  phone: string;
  email: string;
  /** Maximum outstanding balance allowed before new credit is refused. */
  creditLimit: number;
  /** Days from invoice date until payment is due. */
  paymentTermsDays: number;
  active: boolean;
}

export interface InvoiceLine {
  productId: string;
  name: string;
  strength: string;
  quantity: number;
  unitPrice: number;
  discount: number;
}

export interface InvoicePayment {
  id: string;
  amount: number;
  method: PaymentMethod;
  reference?: string;
  paidAt: string; // ISO datetime
  recordedBy: string;
}

export type InvoiceStatus = "draft" | "issued" | "part-paid" | "paid" | "overdue" | "cancelled";

/**
 * A credit bill. Distinct from a `Sale`: a Sale is settled at the till, an
 * Invoice is issued now and collected later.
 */
export interface Invoice {
  id: string;
  invoiceNo: string;
  branchId: BranchId;
  customerId: string;
  customerName: string;
  issuedAt: string; // ISO date
  dueAt: string; // ISO date
  lines: InvoiceLine[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  payments: InvoicePayment[];
  status: InvoiceStatus;
  issuedById: string;
  issuedByName: string;
  note?: string;
}

export interface Settings {
  businessName: string;
  currencyCode: string;
  currencySymbol: string;
  taxRate: number; // 0.15 = 15%
  lowStockAlerts: boolean;
  expiryWarningDays: number; // flag batches expiring within N days
  receiptFooter: string;
}

/** The whole demo database — one serialisable object. */
export interface PosData {
  branches: Branch[];
  products: Product[];
  stock: StockBatch[];
  suppliers: Supplier[];
  sales: Sale[];
  transfers: Transfer[];
  staff: Staff[];
  customers: Customer[];
  invoices: Invoice[];
  settings: Settings;
}

/**
 * Scope of the current view. "all" is the Main Branch consolidated view —
 * every figure on screen aggregates across branches.
 */
export type BranchScope = BranchId | "all";
