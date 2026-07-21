"use client";

import { useMemo, useState } from "react";
import { Mail, Phone, ShoppingCart, User } from "lucide-react";
import { usePos } from "@/lib/pos/store";
import { scopedStock } from "@/lib/pos/selectors";
import { money } from "@/lib/pos/format";
import type { Supplier } from "@/lib/pos/types";
import { Badge, Button, Modal } from "@/components/pos/ui";
import { PurchaseOrderModal, type POCandidate } from "./PurchaseOrderModal";

export function SupplierDetailModal({
  supplier,
  onClose,
}: {
  supplier: Supplier | null;
  onClose: () => void;
}) {
  const { data, scope } = usePos();
  const [poOpen, setPoOpen] = useState(false);
  const open = supplier !== null;

  const products = useMemo(() => {
    if (!supplier) return [];
    const batches = scopedStock(data, scope);
    const onHandById = new Map<string, number>();
    for (const b of batches) {
      onHandById.set(b.productId, (onHandById.get(b.productId) ?? 0) + b.quantity);
    }
    return data.products
      .filter((p) => p.supplierId === supplier.id)
      .map((p) => ({ product: p, onHand: onHandById.get(p.id) ?? 0 }))
      .sort((a, b) => a.product.name.localeCompare(b.product.name));
  }, [supplier, data, scope]);

  const candidates: POCandidate[] = useMemo(
    () =>
      products
        .filter((row) => row.onHand <= row.product.reorderLevel)
        .map((row) => {
          const target = Math.max(row.product.reorderLevel * 3, row.product.reorderLevel + 10);
          return {
            product: row.product,
            onHand: row.onHand,
            reorderLevel: row.product.reorderLevel,
            suggestedQty: Math.max(target - row.onHand, row.product.reorderLevel || 10),
          };
        }),
    [products],
  );

  if (!supplier) return null;

  return (
    <>
      <Modal
        open={open}
        onClose={onClose}
        size="lg"
        title={supplier.name}
        subtitle={`${products.length} product${products.length === 1 ? "" : "s"} supplied`}
        footer={
          <>
            <Button variant="secondary" onClick={onClose}>
              Close
            </Button>
            <Button icon={ShoppingCart} onClick={() => setPoOpen(true)} disabled={candidates.length === 0}>
              Create purchase order
            </Button>
          </>
        }
      >
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="flex items-center gap-2.5 rounded-xl bg-pos-bg p-3">
              <User size={16} className="shrink-0 text-pos-muted" />
              <div className="min-w-0">
                <p className="text-xs text-pos-muted">Contact</p>
                <p className="truncate text-sm font-medium text-pos-heading">{supplier.contact}</p>
              </div>
            </div>
            <div className="flex items-center gap-2.5 rounded-xl bg-pos-bg p-3">
              <Phone size={16} className="shrink-0 text-pos-muted" />
              <div className="min-w-0">
                <p className="text-xs text-pos-muted">Phone</p>
                <p className="truncate text-sm font-medium text-pos-heading">{supplier.phone}</p>
              </div>
            </div>
            <div className="flex items-center gap-2.5 rounded-xl bg-pos-bg p-3">
              <Mail size={16} className="shrink-0 text-pos-muted" />
              <div className="min-w-0">
                <p className="text-xs text-pos-muted">Email</p>
                <p className="truncate text-sm font-medium text-pos-heading">{supplier.email}</p>
              </div>
            </div>
          </div>

          <div>
            <p className="mb-2 text-sm font-semibold text-pos-heading">Products supplied</p>
            {products.length === 0 ? (
              <p className="text-sm text-pos-muted">No products are linked to this supplier.</p>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-pos-border">
                <table className="w-full min-w-[520px] border-collapse text-sm">
                  <thead className="bg-pos-bg">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-pos-muted">
                        Product
                      </th>
                      <th className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wide text-pos-muted">
                        On hand
                      </th>
                      <th className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wide text-pos-muted">
                        Cost
                      </th>
                      <th className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wide text-pos-muted">
                        Reorder at
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-pos-muted">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map(({ product, onHand }) => {
                      const low = onHand <= product.reorderLevel;
                      return (
                        <tr key={product.id} className="border-t border-pos-border/70">
                          <td className="px-3 py-2.5">
                            <p className="font-medium text-pos-heading">{product.name}</p>
                            <p className="text-xs text-pos-muted">{product.strength}</p>
                          </td>
                          <td className="px-3 py-2.5 text-right text-pos-heading">{onHand}</td>
                          <td className="px-3 py-2.5 text-right text-pos-heading">
                            {money(product.costPrice, data.settings.currencySymbol)}
                          </td>
                          <td className="px-3 py-2.5 text-right text-pos-muted">{product.reorderLevel}</td>
                          <td className="px-3 py-2.5">
                            <Badge tone={onHand <= 0 ? "danger" : low ? "warn" : "ok"}>
                              {onHand <= 0 ? "Out of stock" : low ? "Low" : "In stock"}
                            </Badge>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </Modal>

      <PurchaseOrderModal
        supplier={supplier}
        candidates={candidates}
        open={poOpen}
        onClose={() => setPoOpen(false)}
      />
    </>
  );
}
