"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { usePos } from "@/lib/pos/store";
import { unitsOnHand } from "@/lib/pos/selectors";
import { number as fmtNumber } from "@/lib/pos/format";
import type { Transfer } from "@/lib/pos/types";
import { can } from "@/lib/pos/permissions";
import { Button, Input, Modal, Select, useToast } from "@/components/pos/ui";

export interface NewTransferModalProps {
  open: boolean;
  onClose: () => void;
  /** Pre-select the source branch, e.g. when an HQ user is scoped to one branch. */
  defaultFromBranchId?: string;
  /**
   * Lock the destination branch, e.g. a branch user requesting stock — their
   * own branch is always the destination and can't be changed.
   */
  lockedToBranchId?: string;
}

interface LineDraft {
  key: string;
  productId: string;
  quantity: number;
}

function makeLine(): LineDraft {
  return { key: Math.random().toString(36).slice(2, 9), productId: "", quantity: 1 };
}

export function NewTransferModal({
  open,
  onClose,
  defaultFromBranchId,
  lockedToBranchId,
}: NewTransferModalProps) {
  const { data, createTransfer, currentUser } = usePos();
  const { push } = useToast();

  const canRequest = can(currentUser, "transfer:request");

  const [fromBranchId, setFromBranchId] = useState("");
  const [toBranchId, setToBranchId] = useState("");
  const [lines, setLines] = useState<LineDraft[]>([makeLine()]);
  const [note, setNote] = useState("");
  const [errors, setErrors] = useState<{
    branches?: string;
    lines?: Record<string, string>;
  }>({});

  useEffect(() => {
    if (!open) return;
    setFromBranchId(
      lockedToBranchId
        ? (data.branches.find((b) => b.isMain)?.id ?? "")
        : (defaultFromBranchId ?? data.branches.find((b) => b.isMain)?.id ?? ""),
    );
    setToBranchId(lockedToBranchId ?? "");
    setLines([makeLine()]);
    setNote("");
    setErrors({});
  }, [open, defaultFromBranchId, lockedToBranchId, data.branches]);

  const productsAtSource = useMemo(() => {
    if (!fromBranchId) return [];
    return data.products
      .map((p) => ({ product: p, onHand: unitsOnHand(data, p.id, fromBranchId) }))
      .filter((x) => x.onHand > 0)
      .sort((a, b) => a.product.name.localeCompare(b.product.name));
  }, [data, fromBranchId]);

  const updateLine = (key: string, patch: Partial<LineDraft>) => {
    setLines((prev) => prev.map((l) => (l.key === key ? { ...l, ...patch } : l)));
  };

  const removeLine = (key: string) => {
    setLines((prev) => (prev.length > 1 ? prev.filter((l) => l.key !== key) : prev));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canRequest) return;
    const nextErrors: typeof errors = { lines: {} };

    const effectiveToBranchId = lockedToBranchId ?? toBranchId;

    if (!fromBranchId || !effectiveToBranchId) {
      nextErrors.branches = "Choose both a source and a destination branch.";
    } else if (fromBranchId === effectiveToBranchId) {
      nextErrors.branches = "Source and destination branches must be different.";
    }

    const seenProducts = new Set<string>();
    for (const line of lines) {
      if (!line.productId) {
        nextErrors.lines![line.key] = "Choose a product.";
        continue;
      }
      if (seenProducts.has(line.productId)) {
        nextErrors.lines![line.key] = "This product is already on the transfer.";
        continue;
      }
      seenProducts.add(line.productId);
      const available = unitsOnHand(data, line.productId, fromBranchId);
      if (line.quantity <= 0) {
        nextErrors.lines![line.key] = "Quantity must be at least 1.";
      } else if (line.quantity > available) {
        nextErrors.lines![line.key] = `Only ${available} on hand at the source branch.`;
      }
    }

    setErrors(nextErrors);
    if (nextErrors.branches || Object.keys(nextErrors.lines ?? {}).length > 0) return;

    const transferLines = lines.map((line) => {
      const product = data.products.find((p) => p.id === line.productId)!;
      const batch = data.stock
        .filter((b) => b.productId === line.productId && b.branchId === fromBranchId && b.quantity > 0)
        .sort((a, b) => a.expiryDate.localeCompare(b.expiryDate))[0];
      return {
        productId: product.id,
        name: product.name,
        quantity: line.quantity,
        batchNumber: batch?.batchNumber ?? "N/A",
      };
    });

    const transfer: Transfer = {
      id: `trf-${Math.random().toString(36).slice(2, 9)}`,
      reference: `TRF-${Math.floor(100000 + Math.random() * 900000)}`,
      fromBranchId,
      toBranchId: effectiveToBranchId,
      createdAt: new Date().toISOString(),
      status: "pending",
      requestedBy: currentUser?.name ?? "Unknown",
      note: note.trim() || undefined,
      lines: transferLines,
    };

    createTransfer(transfer);
    push({
      title: "Transfer requested",
      description: `${transfer.reference} is awaiting approval.`,
      tone: "success",
    });
    onClose();
  };

  const fromBranch = data.branches.find((b) => b.id === fromBranchId);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="New stock transfer"
      subtitle="Move stock from one branch to another."
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!canRequest}>
            Submit request
          </Button>
        </>
      }
    >
      {lockedToBranchId ? (
        <div className="mb-4 rounded-xl bg-pos-brand-soft px-3.5 py-2.5 text-xs text-pos-brand-dark">
          Transfer requests you raise are always delivered to your branch. They're approved and
          dispatched by the Main Branch.
        </div>
      ) : null}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Select
            label="From branch"
            value={fromBranchId}
            onChange={(e) => {
              setFromBranchId(e.target.value);
              setLines([makeLine()]);
            }}
          >
            <option value="">Select source branch</option>
            {data.branches
              .filter((b) => b.id !== lockedToBranchId)
              .map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} ({b.code})
                </option>
              ))}
          </Select>
          {lockedToBranchId ? (
            <Input
              label="To branch"
              value={
                data.branches.find((b) => b.id === lockedToBranchId)
                  ? `${data.branches.find((b) => b.id === lockedToBranchId)!.name} (${data.branches.find((b) => b.id === lockedToBranchId)!.code})`
                  : ""
              }
              disabled
              hint="Requests you raise always come to your branch."
            />
          ) : (
            <Select label="To branch" value={toBranchId} onChange={(e) => setToBranchId(e.target.value)}>
              <option value="">Select destination branch</option>
              {data.branches
                .filter((b) => b.id !== fromBranchId)
                .map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.code})
                  </option>
                ))}
            </Select>
          )}
        </div>
        {errors.branches ? <p className="text-xs text-pos-danger">{errors.branches}</p> : null}

        <div>
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-medium text-pos-heading">Products to transfer</p>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              icon={Plus}
              onClick={() => setLines((prev) => [...prev, makeLine()])}
              disabled={!fromBranchId}
            >
              Add line
            </Button>
          </div>

          {!fromBranchId ? (
            <p className="rounded-xl bg-pos-bg px-3.5 py-3 text-xs text-pos-muted">
              Choose a source branch to see what's available to transfer.
            </p>
          ) : (
            <div className="space-y-2.5">
              {lines.map((line) => {
                const available = line.productId
                  ? unitsOnHand(data, line.productId, fromBranchId)
                  : null;
                return (
                  <div
                    key={line.key}
                    className="rounded-xl border border-pos-border p-3 sm:flex sm:items-start sm:gap-3"
                  >
                    <div className="min-w-0 flex-1">
                      <Select
                        value={line.productId}
                        onChange={(e) => updateLine(line.key, { productId: e.target.value })}
                      >
                        <option value="">Select product</option>
                        {productsAtSource.map(({ product, onHand }) => (
                          <option key={product.id} value={product.id}>
                            {product.name} ({product.strength}) — {onHand} on hand
                          </option>
                        ))}
                      </Select>
                    </div>
                    <div className="mt-2 flex items-end gap-2 sm:mt-0 sm:w-40">
                      <Input
                        type="number"
                        min={1}
                        label="Qty"
                        containerClassName="flex-1"
                        value={line.quantity}
                        onChange={(e) =>
                          updateLine(line.key, { quantity: Number(e.target.value) || 0 })
                        }
                      />
                      <button
                        type="button"
                        onClick={() => removeLine(line.key)}
                        aria-label="Remove line"
                        className="mb-0.5 shrink-0 rounded-lg p-2 text-pos-muted hover:bg-pos-danger-soft hover:text-pos-danger"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                    {available !== null ? (
                      <p className="mt-1 w-full text-xs text-pos-muted sm:hidden">
                        {fmtNumber(available)} on hand at {fromBranch?.code}
                      </p>
                    ) : null}
                    {errors.lines?.[line.key] ? (
                      <p className="mt-1 w-full text-xs text-pos-danger">{errors.lines[line.key]}</p>
                    ) : null}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <Input
          label="Note (optional)"
          placeholder="e.g. Urgent — stock-out at counter"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      </form>
    </Modal>
  );
}
