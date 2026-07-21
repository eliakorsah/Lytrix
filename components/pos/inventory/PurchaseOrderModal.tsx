"use client";

import { useMemo, useState } from "react";
import { usePos } from "@/lib/pos/store";
import { money } from "@/lib/pos/format";
import type { Product, Supplier } from "@/lib/pos/types";
import { Button, Modal, useToast } from "@/components/pos/ui";

export interface POCandidate {
  product: Product;
  onHand: number;
  reorderLevel: number;
  suggestedQty: number;
}

export function PurchaseOrderModal({
  supplier,
  candidates,
  open,
  onClose,
}: {
  supplier: Supplier | null;
  candidates: POCandidate[];
  open: boolean;
  onClose: () => void;
}) {
  const { data } = usePos();
  const { push } = useToast();
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  // Seed selection state whenever the candidate list changes (i.e. modal reopened).
  const key = candidates.map((c) => c.product.id).join(",");
  const [seededFor, setSeededFor] = useState<string | null>(null);
  if (open && seededFor !== key) {
    const nextSelected: Record<string, boolean> = {};
    const nextQty: Record<string, number> = {};
    for (const c of candidates) {
      nextSelected[c.product.id] = true;
      nextQty[c.product.id] = c.suggestedQty;
    }
    setSelected(nextSelected);
    setQuantities(nextQty);
    setSeededFor(key);
  }

  const total = useMemo(
    () =>
      candidates.reduce((sum, c) => {
        if (!selected[c.product.id]) return sum;
        const qty = quantities[c.product.id] ?? c.suggestedQty;
        return sum + qty * c.product.costPrice;
      }, 0),
    [candidates, selected, quantities],
  );

  const selectedCount = candidates.filter((c) => selected[c.product.id]).length;

  const close = () => {
    setSeededFor(null);
    onClose();
  };

  const submit = () => {
    if (!supplier || selectedCount === 0) return;
    push({
      title: "Purchase order raised",
      description: `PO sent to ${supplier.name} for ${selectedCount} item${selectedCount === 1 ? "" : "s"}, totalling ${money(total, data.settings.currencySymbol)}. This is simulated for the demo.`,
      tone: "success",
    });
    close();
  };

  if (!supplier) return null;

  return (
    <Modal
      open={open}
      onClose={close}
      size="lg"
      title={`Create purchase order — ${supplier.name}`}
      subtitle={`Estimated lead time ${supplier.leadTimeDays} day${supplier.leadTimeDays === 1 ? "" : "s"}`}
      footer={
        <>
          <Button variant="secondary" onClick={close}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={selectedCount === 0}>
            Raise PO · {money(total, data.settings.currencySymbol)}
          </Button>
        </>
      }
    >
      {candidates.length === 0 ? (
        <p className="py-8 text-center text-sm text-pos-muted">
          Nothing from {supplier.name} is currently low on stock.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-pos-border">
          <table className="w-full min-w-[560px] border-collapse text-sm">
            <thead className="bg-pos-bg">
              <tr>
                <th className="w-8 px-3 py-2" />
                <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-pos-muted">
                  Product
                </th>
                <th className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wide text-pos-muted">
                  On hand
                </th>
                <th className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wide text-pos-muted">
                  Qty to order
                </th>
                <th className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wide text-pos-muted">
                  Line total
                </th>
              </tr>
            </thead>
            <tbody>
              {candidates.map((c) => {
                const isSelected = selected[c.product.id] ?? false;
                const qty = quantities[c.product.id] ?? c.suggestedQty;
                return (
                  <tr key={c.product.id} className="border-t border-pos-border/70">
                    <td className="px-3 py-2.5">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) =>
                          setSelected((prev) => ({ ...prev, [c.product.id]: e.target.checked }))
                        }
                        className="h-4 w-4 rounded border-pos-border text-pos-brand focus:ring-pos-brand/40"
                      />
                    </td>
                    <td className="px-3 py-2.5">
                      <p className="font-medium text-pos-heading">{c.product.name}</p>
                      <p className="text-xs text-pos-muted">
                        {c.product.strength} · reorder at {c.reorderLevel}
                      </p>
                    </td>
                    <td className="px-3 py-2.5 text-right text-pos-heading">{c.onHand}</td>
                    <td className="px-3 py-2.5 text-right">
                      <input
                        type="number"
                        min={1}
                        disabled={!isSelected}
                        value={qty}
                        onChange={(e) =>
                          setQuantities((prev) => ({
                            ...prev,
                            [c.product.id]: Math.max(1, Number(e.target.value) || 1),
                          }))
                        }
                        className="h-8 w-20 rounded-lg border border-pos-border bg-white px-2 text-right text-sm focus:outline-none focus:ring-2 focus:ring-pos-brand/40 disabled:bg-pos-bg disabled:text-pos-muted"
                      />
                    </td>
                    <td className="px-3 py-2.5 text-right text-pos-heading">
                      {money(qty * c.product.costPrice, data.settings.currencySymbol)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </Modal>
  );
}
