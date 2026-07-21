"use client";

// Client-side "database" for the POS demo.
//
// Seeding happens after mount (never during render) so the server HTML and the
// first client render always agree — the seed depends on `new Date()`, which
// would otherwise differ between the two.

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { buildSeedData } from "./seed";
import { enforceScope } from "./permissions";
import type {
  Branch,
  BranchScope,
  Invoice,
  InvoicePayment,
  PosData,
  Sale,
  Settings,
  Staff,
  StockBatch,
  Transfer,
} from "./types";

// Bumped to v2 — the shape gained `customers` and `invoices`, so any dataset
// saved by the previous version must be re-seeded rather than merged.
const STORAGE_KEY = "lytrix-pos-demo:v2";
const SCOPE_KEY = "lytrix-pos-demo:scope";
const SESSION_KEY = "lytrix-pos-demo:session";

interface PosContextValue {
  data: PosData;
  /** False until the client has loaded/seeded — render skeletons while false. */
  ready: boolean;
  /**
   * Current branch filter. "all" is the Main Branch consolidated view.
   * Always already clamped to what `currentUser` is permitted to see.
   */
  scope: BranchScope;
  setScope: (scope: BranchScope) => void;
  /** The branch object for `scope`, or null when viewing all branches. */
  activeBranch: Branch | null;
  /** Signed-in staff member, or null when signed out. */
  currentUser: Staff | null;
  login: (staffId: string) => void;
  logout: () => void;
  createInvoice: (invoice: Invoice) => void;
  recordInvoicePayment: (invoiceId: string, payment: InvoicePayment) => void;
  cancelInvoice: (invoiceId: string) => void;
  recordSale: (sale: Sale) => void;
  addBranch: (branch: Branch) => void;
  updateBranch: (id: string, patch: Partial<Branch>) => void;
  adjustStock: (batchId: string, quantity: number) => void;
  addStockBatch: (batch: StockBatch) => void;
  createTransfer: (transfer: Transfer) => void;
  updateTransferStatus: (id: string, status: Transfer["status"]) => void;
  addStaff: (staff: Staff) => void;
  updateStaff: (id: string, patch: Partial<Staff>) => void;
  updateSettings: (patch: Partial<Settings>) => void;
  resetDemo: () => void;
}

const PosContext = createContext<PosContextValue | null>(null);

/** Empty shell rendered on the server and during the first client paint. */
const EMPTY: PosData = {
  branches: [],
  products: [],
  stock: [],
  suppliers: [],
  sales: [],
  transfers: [],
  staff: [],
  customers: [],
  invoices: [],
  settings: {
    businessName: "MediPlus Pharmacy",
    currencyCode: "GHS",
    currencySymbol: "₵",
    taxRate: 0.15,
    lowStockAlerts: true,
    expiryWarningDays: 90,
    receiptFooter: "",
  },
};

export function PosProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<PosData>(EMPTY);
  const [ready, setReady] = useState(false);
  const [scope, setScopeState] = useState<BranchScope>("all");
  const [userId, setUserId] = useState<string | null>(null);

  // Load from localStorage, or seed a fresh dataset on first visit.
  useEffect(() => {
    let loaded: PosData | null = null;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as PosData;
        // Guard against a partially-shaped payload from an older build.
        if (parsed && Array.isArray(parsed.branches) && Array.isArray(parsed.invoices)) {
          loaded = parsed;
        }
      }
    } catch {
      // Corrupt or unavailable storage — fall through to a fresh seed.
    }

    setData(loaded ?? buildSeedData(new Date()));

    try {
      const savedScope = window.localStorage.getItem(SCOPE_KEY);
      if (savedScope) setScopeState(savedScope as BranchScope);
      const savedUser = window.localStorage.getItem(SESSION_KEY);
      if (savedUser) setUserId(savedUser);
    } catch {
      /* ignore */
    }

    setReady(true);
  }, []);

  // Persist on every change, but only once seeding has finished.
  useEffect(() => {
    if (!ready) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      // Quota exceeded or private mode — the demo still works in memory.
    }
  }, [data, ready]);

  const currentUser = useMemo(
    () => (userId ? data.staff.find((s) => s.id === userId) ?? null : null),
    [userId, data.staff],
  );

  /**
   * The scope actually applied everywhere. A branch-level user is pinned to
   * their own branch regardless of what is stored, so a stale localStorage
   * value or a hand-crafted call can't leak another branch's data.
   */
  const effectiveScope = useMemo(
    () => enforceScope(currentUser, scope),
    [currentUser, scope],
  );

  const setScope = useCallback(
    (next: BranchScope) => {
      const allowed = enforceScope(currentUser, next);
      setScopeState(allowed);
      try {
        window.localStorage.setItem(SCOPE_KEY, allowed);
      } catch {
        /* ignore */
      }
    },
    [currentUser],
  );

  const login = useCallback(
    (staffId: string) => {
      const user = data.staff.find((s) => s.id === staffId);
      if (!user) return;
      setUserId(staffId);
      // Land the user on the widest scope their role allows.
      const next = enforceScope(user, "all");
      setScopeState(next);
      try {
        window.localStorage.setItem(SESSION_KEY, staffId);
        window.localStorage.setItem(SCOPE_KEY, next);
      } catch {
        /* ignore */
      }
    },
    [data.staff],
  );

  const logout = useCallback(() => {
    setUserId(null);
    try {
      window.localStorage.removeItem(SESSION_KEY);
    } catch {
      /* ignore */
    }
  }, []);

  const createInvoice = useCallback((invoice: Invoice) => {
    setData((prev) => ({ ...prev, invoices: [invoice, ...prev.invoices] }));
  }, []);

  const recordInvoicePayment = useCallback(
    (invoiceId: string, payment: InvoicePayment) => {
      setData((prev) => ({
        ...prev,
        invoices: prev.invoices.map((inv) => {
          if (inv.id !== invoiceId) return inv;
          const payments = [...inv.payments, payment];
          const paid = payments.reduce((sum, p) => sum + p.amount, 0);
          // Tolerate sub-cent rounding when deciding "fully settled".
          const settled = paid >= inv.total - 0.01;
          const overdue = new Date(inv.dueAt).getTime() < Date.now();
          const status: Invoice["status"] = settled
            ? "paid"
            : paid > 0
              ? "part-paid"
              : overdue
                ? "overdue"
                : "issued";
          return { ...inv, payments, status };
        }),
      }));
    },
    [],
  );

  const cancelInvoice = useCallback((invoiceId: string) => {
    setData((prev) => ({
      ...prev,
      invoices: prev.invoices.map((inv) =>
        inv.id === invoiceId ? { ...inv, status: "cancelled" } : inv,
      ),
    }));
  }, []);

  const recordSale = useCallback((sale: Sale) => {
    setData((prev) => {
      // Decrement the matching batch for each line, oldest-expiry first.
      const stock = [...prev.stock];
      for (const line of sale.lines) {
        const candidates = stock
          .map((b, i) => ({ b, i }))
          .filter(
            ({ b }) =>
              b.productId === line.productId &&
              b.branchId === sale.branchId &&
              b.quantity > 0,
          )
          .sort((x, y) => x.b.expiryDate.localeCompare(y.b.expiryDate));

        let remaining = line.quantity;
        for (const { b, i } of candidates) {
          if (remaining <= 0) break;
          const take = Math.min(b.quantity, remaining);
          stock[i] = { ...b, quantity: b.quantity - take };
          remaining -= take;
        }
      }
      return { ...prev, stock, sales: [sale, ...prev.sales] };
    });
  }, []);

  const addBranch = useCallback((branch: Branch) => {
    setData((prev) => ({ ...prev, branches: [...prev.branches, branch] }));
  }, []);

  const updateBranch = useCallback((id: string, patch: Partial<Branch>) => {
    setData((prev) => ({
      ...prev,
      branches: prev.branches.map((b) => (b.id === id ? { ...b, ...patch } : b)),
    }));
  }, []);

  const adjustStock = useCallback((batchId: string, quantity: number) => {
    setData((prev) => ({
      ...prev,
      stock: prev.stock.map((b) =>
        b.id === batchId ? { ...b, quantity: Math.max(0, quantity) } : b,
      ),
    }));
  }, []);

  const addStockBatch = useCallback((batch: StockBatch) => {
    setData((prev) => ({ ...prev, stock: [...prev.stock, batch] }));
  }, []);

  const createTransfer = useCallback((transfer: Transfer) => {
    setData((prev) => ({ ...prev, transfers: [transfer, ...prev.transfers] }));
  }, []);

  const updateTransferStatus = useCallback(
    (id: string, status: Transfer["status"]) => {
      setData((prev) => {
        const transfer = prev.transfers.find((t) => t.id === id);
        const transfers = prev.transfers.map((t) =>
          t.id === id ? { ...t, status } : t,
        );

        // Receiving a transfer actually moves the stock between branches.
        if (!transfer || status !== "received" || transfer.status === "received") {
          return { ...prev, transfers };
        }

        const stock = [...prev.stock];
        for (const line of transfer.lines) {
          const fromIdx = stock.findIndex(
            (b) =>
              b.productId === line.productId &&
              b.branchId === transfer.fromBranchId &&
              b.quantity > 0,
          );
          if (fromIdx >= 0) {
            const take = Math.min(stock[fromIdx].quantity, line.quantity);
            stock[fromIdx] = {
              ...stock[fromIdx],
              quantity: stock[fromIdx].quantity - take,
            };
          }

          const toIdx = stock.findIndex(
            (b) =>
              b.productId === line.productId &&
              b.branchId === transfer.toBranchId &&
              b.batchNumber === line.batchNumber,
          );
          if (toIdx >= 0) {
            stock[toIdx] = {
              ...stock[toIdx],
              quantity: stock[toIdx].quantity + line.quantity,
            };
          } else {
            stock.push({
              id: `btc-${Math.random().toString(36).slice(2, 9)}`,
              productId: line.productId,
              branchId: transfer.toBranchId,
              batchNumber: line.batchNumber,
              quantity: line.quantity,
              expiryDate: new Date(Date.now() + 400 * 864e5)
                .toISOString()
                .slice(0, 10),
              receivedAt: new Date().toISOString().slice(0, 10),
            });
          }
        }

        return { ...prev, transfers, stock };
      });
    },
    [],
  );

  const addStaff = useCallback((staff: Staff) => {
    setData((prev) => ({ ...prev, staff: [...prev.staff, staff] }));
  }, []);

  const updateStaff = useCallback((id: string, patch: Partial<Staff>) => {
    setData((prev) => ({
      ...prev,
      staff: prev.staff.map((s) => (s.id === id ? { ...s, ...patch } : s)),
    }));
  }, []);

  const updateSettings = useCallback((patch: Partial<Settings>) => {
    setData((prev) => ({ ...prev, settings: { ...prev.settings, ...patch } }));
  }, []);

  const resetDemo = useCallback(() => {
    const fresh = buildSeedData(new Date());
    setData(fresh);
    setScope("all");
  }, [setScope]);

  const activeBranch = useMemo(
    () =>
      effectiveScope === "all"
        ? null
        : data.branches.find((b) => b.id === effectiveScope) ?? null,
    [effectiveScope, data.branches],
  );

  const value = useMemo<PosContextValue>(
    () => ({
      data,
      ready,
      scope: effectiveScope,
      setScope,
      activeBranch,
      currentUser,
      login,
      logout,
      createInvoice,
      recordInvoicePayment,
      cancelInvoice,
      recordSale,
      addBranch,
      updateBranch,
      adjustStock,
      addStockBatch,
      createTransfer,
      updateTransferStatus,
      addStaff,
      updateStaff,
      updateSettings,
      resetDemo,
    }),
    [
      data,
      ready,
      effectiveScope,
      setScope,
      activeBranch,
      currentUser,
      login,
      logout,
      createInvoice,
      recordInvoicePayment,
      cancelInvoice,
      recordSale,
      addBranch,
      updateBranch,
      adjustStock,
      addStockBatch,
      createTransfer,
      updateTransferStatus,
      addStaff,
      updateStaff,
      updateSettings,
      resetDemo,
    ],
  );

  return <PosContext.Provider value={value}>{children}</PosContext.Provider>;
}

export function usePos() {
  const ctx = useContext(PosContext);
  if (!ctx) throw new Error("usePos must be used inside <PosProvider>");
  return ctx;
}
