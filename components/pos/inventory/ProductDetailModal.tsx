"use client";

import { useMemo, useState } from "react";
import { PackageX, TriangleAlert } from "lucide-react";
import { usePos } from "@/lib/pos/store";
import { scopedStock } from "@/lib/pos/selectors";
import { money, shortDate, expiryLabel } from "@/lib/pos/format";
import type { Product, StockBatch } from "@/lib/pos/types";
import {
  Badge,
  Button,
  Modal,
  Select,
  Input,
  useToast,
  cn,
  type Tone,
} from "@/components/pos/ui";
import { ProductSparkline } from "./ProductSparkline";

const ADJUST_REASONS = ["Damaged", "Expired", "Recount", "Theft", "Correction"] as const;

function stockStatus(onHand: number, reorderLevel: number): { label: string; tone: Tone } {
  if (onHand <= 0) return { label: "Out of stock", tone: "danger" };
  if (onHand <= reorderLevel) return { label: "Low", tone: "warn" };
  return { label: "In stock", tone: "ok" };
}

function expiryTone(daysLeft: number, warnDays: number): Tone {
  if (daysLeft < 0) return "danger";
  if (daysLeft <= warnDays) return "warn";
  return "ok";
}

function BatchRow({
  batch,
  branchName,
  showBranch,
  warnDays,
}: {
  batch: StockBatch;
  branchName: string;
  showBranch: boolean;
  warnDays: number;
}) {
  const { adjustStock } = usePos();
  const { push } = useToast();
  const [editing, setEditing] = useState(false);
  const [qty, setQty] = useState(String(batch.quantity));
  const [reason, setReason] = useState<(typeof ADJUST_REASONS)[number]>("Recount");

  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const daysLeft = Math.round((new Date(batch.expiryDate).getTime() - now.getTime()) / 864e5);
  const tone = expiryTone(daysLeft, warnDays);

  const save = () => {
    const parsed = Number(qty);
    if (!Number.isFinite(parsed) || parsed < 0) return;
    adjustStock(batch.id, Math.round(parsed));
    setEditing(false);
    push({
      title: "Stock adjusted",
      description: `Batch ${batch.batchNumber} set to ${Math.round(parsed)} units — reason: ${reason}.`,
      tone: "success",
    });
  };

  return (
    <tr className="border-b border-pos-border/70 last:border-b-0">
      <td className="px-3 py-2.5 text-pos-heading">{batch.batchNumber}</td>
      {showBranch ? <td className="px-3 py-2.5 text-pos-muted">{branchName}</td> : null}
      <td className="px-3 py-2.5 text-right text-pos-heading">
        {editing ? (
          <Input
            value={qty}
            onChange={(e) => setQty(e.target.value)}
            type="number"
            min={0}
            className="h-8 w-24 text-right"
          />
        ) : (
          batch.quantity
        )}
      </td>
      <td className="px-3 py-2.5 text-pos-muted">{shortDate(batch.receivedAt)}</td>
      <td className="px-3 py-2.5">
        <Badge tone={tone}>{expiryLabel(daysLeft)}</Badge>
      </td>
      <td className="px-3 py-2.5 text-right">
        {editing ? (
          <div className="flex items-center justify-end gap-1.5">
            <Select
              value={reason}
              onChange={(e) => setReason(e.target.value as (typeof ADJUST_REASONS)[number])}
              className="h-8 w-32 text-xs"
            >
              {ADJUST_REASONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </Select>
            <Button size="sm" onClick={save}>
              Save
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>
              Cancel
            </Button>
          </div>
        ) : (
          <Button size="sm" variant="secondary" onClick={() => setEditing(true)}>
            Adjust
          </Button>
        )}
      </td>
    </tr>
  );
}

export function ProductDetailModal({
  product,
  onClose,
}: {
  product: Product | null;
  onClose: () => void;
}) {
  const { data, scope } = usePos();
  const open = product !== null;

  const supplier = useMemo(
    () => (product ? data.suppliers.find((s) => s.id === product.supplierId) ?? null : null),
    [data.suppliers, product],
  );

  const branchRows = useMemo(() => {
    if (!product || scope !== "all") return [];
    return data.branches.map((branch) => {
      const batches = data.stock.filter(
        (b) => b.branchId === branch.id && b.productId === product.id,
      );
      const onHand = batches.reduce((sum, b) => sum + b.quantity, 0);
      const status = stockStatus(onHand, product.reorderLevel);
      return {
        branch,
        onHand,
        batchCount: batches.filter((b) => b.quantity > 0).length,
        status,
        value: onHand * product.sellPrice,
      };
    });
  }, [data.branches, data.stock, product, scope]);

  const batches = useMemo(() => {
    if (!product) return [];
    return scopedStock(data, scope)
      .filter((b) => b.productId === product.id)
      .sort((a, b) => a.expiryDate.localeCompare(b.expiryDate));
  }, [data, scope, product]);

  const branchNameById = useMemo(
    () => new Map(data.branches.map((b) => [b.id, b.name])),
    [data.branches],
  );

  const onHandInScope = batches.reduce((sum, b) => sum + b.quantity, 0);
  const margin = product && product.sellPrice > 0
    ? ((product.sellPrice - product.costPrice) / product.sellPrice) * 100
    : 0;

  if (!product) return null;

  const status = stockStatus(onHandInScope, product.reorderLevel);

  return (
    <Modal open={open} onClose={onClose} size="xl" title={product.name} subtitle={product.genericName}>
      <div className="space-y-6">
        {/* Header badges */}
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="neutral">{product.category}</Badge>
          <Badge tone="neutral">
            {product.form} · {product.strength}
          </Badge>
          <Badge tone="neutral">{product.brand}</Badge>
          {product.prescriptionOnly ? <Badge tone="accent">Rx only</Badge> : null}
          {product.controlled ? <Badge tone="violet">Controlled</Badge> : null}
          <Badge tone={status.tone}>{status.label}</Badge>
        </div>

        {/* Pricing */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-xl bg-pos-bg p-3">
            <p className="text-xs text-pos-muted">Cost price</p>
            <p className="mt-0.5 text-sm font-semibold text-pos-heading">
              {money(product.costPrice, data.settings.currencySymbol)}
            </p>
          </div>
          <div className="rounded-xl bg-pos-bg p-3">
            <p className="text-xs text-pos-muted">Sell price</p>
            <p className="mt-0.5 text-sm font-semibold text-pos-heading">
              {money(product.sellPrice, data.settings.currencySymbol)}
            </p>
          </div>
          <div className="rounded-xl bg-pos-bg p-3">
            <p className="text-xs text-pos-muted">Margin</p>
            <p className="mt-0.5 text-sm font-semibold text-pos-heading">{margin.toFixed(1)}%</p>
          </div>
          <div className="rounded-xl bg-pos-bg p-3">
            <p className="text-xs text-pos-muted">Supplier</p>
            <p className="mt-0.5 truncate text-sm font-semibold text-pos-heading">
              {supplier?.name ?? "Unassigned"}
            </p>
          </div>
        </div>

        {/* Sparkline */}
        <div className="rounded-xl border border-pos-border p-3">
          <ProductSparkline data={data} scope={scope} productId={product.id} />
        </div>

        {/* Per-branch breakdown — only in the consolidated view */}
        {scope === "all" ? (
          <div>
            <p className="mb-2 text-sm font-semibold text-pos-heading">Stock across branches</p>
            <div className="overflow-x-auto rounded-xl border border-pos-border">
              <table className="w-full min-w-[520px] border-collapse text-sm">
                <thead className="bg-pos-bg">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-pos-muted">
                      Branch
                    </th>
                    <th className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wide text-pos-muted">
                      On hand
                    </th>
                    <th className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wide text-pos-muted">
                      Batches
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-pos-muted">
                      Status
                    </th>
                    <th className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wide text-pos-muted">
                      Value
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {branchRows.map((row) => (
                    <tr key={row.branch.id} className="border-t border-pos-border/70">
                      <td className="px-3 py-2.5 text-pos-heading">
                        {row.branch.name}
                        {row.branch.isMain ? (
                          <span className="ml-1.5 text-xs text-pos-muted">(Main)</span>
                        ) : null}
                      </td>
                      <td className="px-3 py-2.5 text-right text-pos-heading">{row.onHand}</td>
                      <td className="px-3 py-2.5 text-right text-pos-muted">{row.batchCount}</td>
                      <td className="px-3 py-2.5">
                        <Badge tone={row.status.tone}>{row.status.label}</Badge>
                      </td>
                      <td className="px-3 py-2.5 text-right text-pos-heading">
                        {money(row.value, data.settings.currencySymbol)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}

        {/* Batches */}
        <div>
          <p className="mb-2 text-sm font-semibold text-pos-heading">
            Batches {scope === "all" ? "(all branches)" : ""}
          </p>
          {batches.length === 0 ? (
            <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-pos-border py-8 text-center">
              <PackageX size={20} className="text-pos-muted" />
              <p className="text-sm text-pos-muted">No batches recorded in this scope.</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-pos-border">
              <table className="w-full min-w-[640px] border-collapse text-sm">
                <thead className="bg-pos-bg">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-pos-muted">
                      Batch
                    </th>
                    {scope === "all" ? (
                      <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-pos-muted">
                        Branch
                      </th>
                    ) : null}
                    <th className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wide text-pos-muted">
                      Qty
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-pos-muted">
                      Received
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-pos-muted">
                      Expiry
                    </th>
                    <th className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wide text-pos-muted">
                      Adjust
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {batches.map((batch) => (
                    <BatchRow
                      key={batch.id}
                      batch={batch}
                      branchName={branchNameById.get(batch.branchId) ?? ""}
                      showBranch={scope === "all"}
                      warnDays={data.settings.expiryWarningDays}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {status.tone !== "ok" ? (
          <div
            className={cn(
              "flex items-start gap-2.5 rounded-xl p-3 text-sm",
              status.tone === "danger" ? "bg-pos-danger-soft text-pos-danger" : "bg-pos-warn-soft text-pos-warn",
            )}
          >
            <TriangleAlert size={16} className="mt-0.5 shrink-0" />
            <p>
              {status.tone === "danger"
                ? "This product is out of stock in the current scope — consider receiving stock or raising a purchase order."
                : `Stock is at or below the reorder level of ${product.reorderLevel} units.`}
            </p>
          </div>
        ) : null}
      </div>
    </Modal>
  );
}
