"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ScanBarcode, Search, ShoppingCart, X } from "lucide-react";
import { usePos } from "@/lib/pos/store";
import { unitsOnHand } from "@/lib/pos/selectors";
import { money } from "@/lib/pos/format";
import type { PaymentMethod, Product, Sale } from "@/lib/pos/types";
import {
  Badge,
  Card,
  Input,
  Modal,
  PageHeader,
  Skeleton,
  cn,
  useToast,
} from "@/components/pos/ui";
import { BranchPicker } from "@/components/pos/sell/BranchPicker";
import { ProductCard } from "@/components/pos/sell/ProductCard";
import { CartPanel } from "@/components/pos/sell/CartPanel";
import { BarcodeScanModal } from "@/components/pos/sell/BarcodeScanModal";
import { ReceiptModal } from "@/components/pos/sell/ReceiptModal";
import { computeTotals, itemCount, round2 } from "@/components/pos/sell/cartMath";
import type { CartLine, HeldSale } from "@/components/pos/sell/types";

function nextReceiptNumber(sales: Sale[], branchCode: string): number {
  const nums = sales
    .filter((s) => s.receiptNo.startsWith(`${branchCode}-`))
    .map((s) => parseInt(s.receiptNo.split("-").pop() ?? "0", 10))
    .filter((n) => !Number.isNaN(n));
  return (nums.length ? Math.max(...nums) : 100000) + 1;
}

const DEFAULT_CUSTOMER = "Walk-in Customer";

export default function SellPage() {
  const { data, ready, scope, activeBranch, recordSale } = usePos();
  const { push } = useToast();

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>("All");
  const [cart, setCart] = useState<CartLine[]>([]);
  const [scanOpen, setScanOpen] = useState(false);
  const [cartSheetOpen, setCartSheetOpen] = useState(false);

  const [customerName, setCustomerName] = useState(DEFAULT_CUSTOMER);
  const [prescriptionRef, setPrescriptionRef] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("Cash");
  const [amountTendered, setAmountTendered] = useState("");
  const [cashierId, setCashierId] = useState("");

  const [heldSales, setHeldSales] = useState<HeldSale[]>([]);
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [lastSale, setLastSale] = useState<Sale | null>(null);

  const searchRef = useRef<HTMLInputElement>(null);
  const prevBranchId = useRef<string | null>(null);

  const resetTicket = () => {
    setCart([]);
    setCustomerName(DEFAULT_CUSTOMER);
    setPrescriptionRef("");
    setPaymentMethod("Cash");
    setAmountTendered("");
    setCashierId("");
  };

  // Selling requires one branch — a cart built for another branch's stock is
  // meaningless, so switching branches clears the in-progress ticket.
  useEffect(() => {
    if (!activeBranch) {
      prevBranchId.current = null;
      return;
    }
    if (prevBranchId.current && prevBranchId.current !== activeBranch.id) {
      resetTicket();
      setHeldSales([]);
      push({
        title: "Branch changed",
        description: "Cart and held sales were cleared for the new branch.",
        tone: "info",
      });
    }
    prevBranchId.current = activeBranch.id;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeBranch?.id]);

  const branchId = activeBranch?.id ?? null;

  const branchProducts = useMemo(() => {
    if (!ready || !branchId) return [];
    const carriedIds = new Set(data.stock.filter((b) => b.branchId === branchId).map((b) => b.productId));
    return data.products.filter((p) => carriedIds.has(p.id));
  }, [ready, branchId, data.stock, data.products]);

  const categories = useMemo(() => {
    return Array.from(new Set(branchProducts.map((p) => p.category))).sort();
  }, [branchProducts]);

  const onHandById = useMemo(() => {
    if (!branchId) return new Map<string, number>();
    const map = new Map<string, number>();
    for (const p of branchProducts) map.set(p.id, unitsOnHand(data, p.id, branchId));
    return map;
  }, [branchProducts, branchId, data]);

  const filteredProducts = useMemo(() => {
    let list = branchProducts;
    if (category !== "All") list = list.filter((p) => p.category === category);
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.genericName.toLowerCase().includes(q) ||
          p.brand.toLowerCase().includes(q) ||
          p.barcode.includes(q),
      );
    }
    return list;
  }, [branchProducts, category, search]);

  const cartById = useMemo(() => new Map(cart.map((l) => [l.productId, l])), [cart]);

  const findBatchNumber = (productId: string) => {
    if (!branchId) return "—";
    const batches = data.stock
      .filter((b) => b.branchId === branchId && b.productId === productId && b.quantity > 0)
      .sort((a, b) => a.expiryDate.localeCompare(b.expiryDate));
    return batches[0]?.batchNumber ?? "—";
  };

  const addProduct = (product: Product): boolean => {
    if (!branchId) return false;
    const onHand = onHandById.get(product.id) ?? unitsOnHand(data, product.id, branchId);
    if (onHand <= 0) {
      push({ title: "Out of stock", description: `${product.name} has no stock at this branch.`, tone: "warn" });
      return false;
    }
    setCart((prev) => {
      const existing = prev.find((l) => l.productId === product.id);
      if (existing) {
        if (existing.quantity >= onHand) {
          push({ title: "Stock limit reached", description: `Only ${onHand} units available.`, tone: "warn" });
          return prev;
        }
        return prev.map((l) => (l.productId === product.id ? { ...l, quantity: l.quantity + 1 } : l));
      }
      const line: CartLine = {
        productId: product.id,
        name: product.name,
        strength: product.strength,
        form: product.form,
        packSize: product.packSize,
        unitPrice: product.sellPrice,
        quantity: 1,
        discount: 0,
        batchNumber: findBatchNumber(product.id),
        onHand,
        prescriptionOnly: product.prescriptionOnly,
        controlled: product.controlled,
      };
      return [...prev, line];
    });
    return true;
  };

  const setLineQty = (productId: string, quantity: number) => {
    setCart((prev) =>
      prev
        .map((l) => (l.productId === productId ? { ...l, quantity: Math.max(1, Math.min(quantity, l.onHand)) } : l))
        .filter((l) => l.quantity > 0),
    );
  };

  const setLineDiscount = (productId: string, discount: number) => {
    setCart((prev) => prev.map((l) => (l.productId === productId ? { ...l, discount } : l)));
  };

  const removeLine = (productId: string) => {
    setCart((prev) => prev.filter((l) => l.productId !== productId));
  };

  const handleScan = (barcode: string): boolean => {
    const product = data.products.find((p) => p.barcode === barcode.trim());
    if (!product) return false;
    if (!branchProducts.some((p) => p.id === product.id)) {
      push({ title: "Not stocked here", description: `${product.name} isn't carried at this branch.`, tone: "warn" });
      return true;
    }
    addProduct(product);
    return true;
  };

  // Keyboard niceties: "/" focuses search, Esc clears it, Enter on a single
  // filtered result adds it straight to the cart.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const typing = target && ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName);
      if (e.key === "/" && !typing) {
        e.preventDefault();
        searchRef.current?.focus();
      }
      if (e.key === "Escape" && target === searchRef.current) {
        setSearch("");
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const requiresRx = cart.some((l) => l.prescriptionOnly);
  const totals = useMemo(() => computeTotals(cart, data.settings.taxRate), [cart, data.settings.taxRate]);
  const tendered = parseFloat(amountTendered) || 0;

  const staffOptions = useMemo(() => {
    if (!branchId) return [];
    return data.staff.filter(
      (s) => s.branchId === branchId && s.active && (s.role === "Cashier" || s.role === "Pharmacist"),
    );
  }, [data.staff, branchId]);

  const blockedReasons: string[] = [];
  if (cart.length === 0) blockedReasons.push("Cart is empty.");
  if (requiresRx && !prescriptionRef.trim()) blockedReasons.push("Prescription reference is required for Rx items.");
  if (!cashierId) blockedReasons.push("Select a cashier or pharmacist.");
  if (paymentMethod === "Cash" && tendered < totals.total) blockedReasons.push("Amount tendered is less than the total.");
  const canCheckout = blockedReasons.length === 0;

  const handleCheckout = () => {
    if (!canCheckout || !activeBranch) return;
    const cashier = staffOptions.find((s) => s.id === cashierId);
    if (!cashier) return;

    const sale: Sale = {
      id: `sale-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      receiptNo: `${activeBranch.code}-${nextReceiptNumber(data.sales, activeBranch.code)}`,
      branchId: activeBranch.id,
      createdAt: new Date().toISOString(),
      lines: cart.map((l) => ({
        productId: l.productId,
        name: l.name,
        strength: l.strength,
        quantity: l.quantity,
        unitPrice: l.unitPrice,
        discount: l.discount,
        batchNumber: l.batchNumber,
      })),
      subtotal: totals.subtotal,
      discount: totals.discount,
      tax: totals.tax,
      total: totals.total,
      paymentMethod,
      amountTendered: paymentMethod === "Cash" ? tendered : totals.total,
      change: paymentMethod === "Cash" ? round2(Math.max(0, tendered - totals.total)) : 0,
      cashierId: cashier.id,
      cashierName: cashier.name,
      customerName: customerName.trim() || DEFAULT_CUSTOMER,
      prescriptionRef: requiresRx ? prescriptionRef.trim() : undefined,
      status: "completed",
    };

    recordSale(sale);
    setLastSale(sale);
    setReceiptOpen(true);
    setCartSheetOpen(false);
    push({
      title: "Sale completed",
      description: `${sale.receiptNo} · ${money(sale.total, data.settings.currencySymbol)}`,
      tone: "success",
    });
  };

  const handleNewSale = () => {
    resetTicket();
    setReceiptOpen(false);
    setLastSale(null);
    window.setTimeout(() => searchRef.current?.focus(), 10);
  };

  const handleHold = () => {
    if (cart.length === 0) return;
    const held: HeldSale = {
      id: `held-${Date.now()}`,
      label: `${customerName.trim() || DEFAULT_CUSTOMER} · ${itemCount(cart)} item${itemCount(cart) === 1 ? "" : "s"}`,
      heldAt: new Date().toISOString(),
      cart,
      customerName,
      prescriptionRef,
      paymentMethod,
      cashierId,
    };
    setHeldSales((prev) => [...prev, held]);
    resetTicket();
    push({ title: "Sale held", description: "Resume it any time from the cart panel.", tone: "info" });
  };

  const handleResume = (id: string) => {
    const held = heldSales.find((h) => h.id === id);
    if (!held) return;
    setCart(held.cart);
    setCustomerName(held.customerName);
    setPrescriptionRef(held.prescriptionRef);
    setPaymentMethod(held.paymentMethod);
    setCashierId(held.cashierId);
    setHeldSales((prev) => prev.filter((h) => h.id !== id));
    setCartSheetOpen(true);
  };

  const handleDiscardHeld = (id: string) => {
    setHeldSales((prev) => prev.filter((h) => h.id !== id));
  };

  if (!ready) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-9 w-64" />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_400px]">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-40" />
            ))}
          </div>
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  if (scope === "all" || !activeBranch) {
    return <BranchPicker />;
  }

  const cartPanel = (
    <CartPanel
      cart={cart}
      onQty={setLineQty}
      onDiscount={setLineDiscount}
      onRemove={removeLine}
      customerName={customerName}
      setCustomerName={setCustomerName}
      prescriptionRef={prescriptionRef}
      setPrescriptionRef={setPrescriptionRef}
      requiresRx={requiresRx}
      paymentMethod={paymentMethod}
      setPaymentMethod={setPaymentMethod}
      amountTendered={amountTendered}
      setAmountTendered={setAmountTendered}
      cashierId={cashierId}
      setCashierId={setCashierId}
      staffOptions={staffOptions}
      totals={totals}
      currencySymbol={data.settings.currencySymbol}
      canCheckout={canCheckout}
      blockedReasons={blockedReasons}
      onCheckout={handleCheckout}
      onHold={handleHold}
      heldSales={heldSales}
      onResume={handleResume}
      onDiscardHeld={handleDiscardHeld}
    />
  );

  return (
    <div className="pb-20 lg:pb-0">
      <PageHeader
        title="Sell"
        subtitle={`${activeBranch.name} · ${activeBranch.code}`}
        actions={
          <button
            type="button"
            onClick={() => setScanOpen(true)}
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-white px-4 text-sm font-medium text-pos-heading shadow-card hover:bg-pos-bg"
          >
            <ScanBarcode size={16} />
            Scan barcode
          </button>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_400px] lg:items-start">
        {/* Catalogue */}
        <div className="min-w-0 space-y-4">
          <div className="flex items-center gap-2 rounded-2xl bg-pos-surface p-2 shadow-card">
            <Search size={18} className="ml-2 shrink-0 text-pos-muted" />
            <input
              ref={searchRef}
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && filteredProducts.length === 1) {
                  addProduct(filteredProducts[0]);
                }
                if (e.key === "Escape") setSearch("");
              }}
              placeholder="Search by name, generic name, brand or barcode... (press / to focus)"
              aria-label="Search products"
              className="w-full bg-transparent px-1 py-2 text-sm text-pos-heading placeholder:text-pos-muted focus:outline-none"
            />
            {search ? (
              <button
                type="button"
                onClick={() => setSearch("")}
                aria-label="Clear search"
                className="mr-1 shrink-0 rounded-lg p-1.5 text-pos-muted hover:bg-pos-bg"
              >
                <X size={16} />
              </button>
            ) : null}
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1">
            {["All", ...categories].map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCategory(c)}
                className={cn(
                  "shrink-0 rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors",
                  category === c
                    ? "bg-pos-brand text-white"
                    : "bg-white text-pos-heading shadow-card hover:bg-pos-bg",
                )}
              >
                {c}
              </button>
            ))}
          </div>

          {filteredProducts.length === 0 ? (
            <Card>
              <p className="py-8 text-center text-sm text-pos-muted">
                No products match {search ? `"${search}"` : "this filter"}.
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onHand={onHandById.get(product.id) ?? 0}
                  inCart={cartById.get(product.id)?.quantity ?? 0}
                  currencySymbol={data.settings.currencySymbol}
                  onAdd={addProduct}
                />
              ))}
            </div>
          )}
        </div>

        {/* Cart — desktop sticky sidebar */}
        <div className="hidden lg:block lg:sticky lg:top-20">
          <Card>{cartPanel}</Card>
        </div>
      </div>

      {/* Mobile fixed bottom bar */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-pos-border bg-white/95 p-3 backdrop-blur lg:hidden">
        <button
          type="button"
          onClick={() => setCartSheetOpen(true)}
          className="flex w-full items-center justify-between rounded-xl bg-pos-brand px-4 py-3 text-white shadow-pop"
        >
          <span className="flex items-center gap-2 text-sm font-semibold">
            <ShoppingCart size={17} />
            {itemCount(cart)} item{itemCount(cart) === 1 ? "" : "s"}
            {heldSales.length > 0 ? (
              <Badge tone="warn" className="!bg-white/25 !text-white">
                {heldSales.length} held
              </Badge>
            ) : null}
          </span>
          <span className="text-base font-bold">{money(totals.total, data.settings.currencySymbol)}</span>
        </button>
      </div>

      {/* Mobile cart sheet */}
      <Modal open={cartSheetOpen} onClose={() => setCartSheetOpen(false)} title="Your cart" size="md">
        {cartPanel}
      </Modal>

      <BarcodeScanModal
        open={scanOpen}
        onClose={() => setScanOpen(false)}
        onScan={handleScan}
        sampleBarcode={branchProducts[0]?.barcode}
      />

      <ReceiptModal
        open={receiptOpen}
        sale={lastSale}
        branch={activeBranch}
        settings={data.settings}
        onClose={() => setReceiptOpen(false)}
        onNewSale={handleNewSale}
      />
    </div>
  );
}
