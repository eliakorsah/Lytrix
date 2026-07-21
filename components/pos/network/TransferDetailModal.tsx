"use client";

import { ArrowRight, CheckCircle2, PackageCheck, XCircle } from "lucide-react";
import { usePos } from "@/lib/pos/store";
import { dateTime, number as fmtNumber } from "@/lib/pos/format";
import type { Transfer } from "@/lib/pos/types";
import { can } from "@/lib/pos/permissions";
import { Badge, Button, Modal, useToast, type Tone } from "@/components/pos/ui";

export const TRANSFER_STATUS_TONE: Record<Transfer["status"], Tone | "neutral"> = {
  pending: "warn",
  "in-transit": "accent",
  received: "ok",
  cancelled: "neutral",
};

export const TRANSFER_STATUS_LABEL: Record<Transfer["status"], string> = {
  pending: "Pending",
  "in-transit": "In-transit",
  received: "Received",
  cancelled: "Cancelled",
};

export function TransferDetailModal({
  open,
  onClose,
  transfer,
}: {
  open: boolean;
  onClose: () => void;
  transfer: Transfer | null;
}) {
  const { data, updateTransferStatus, currentUser } = usePos();
  const { push } = useToast();

  if (!transfer) return null;

  const fromBranch = data.branches.find((b) => b.id === transfer.fromBranchId);
  const toBranch = data.branches.find((b) => b.id === transfer.toBranchId);
  const totalUnits = transfer.lines.reduce((sum, l) => sum + l.quantity, 0);

  // HQ runs the full state machine. Branch users only ever receive stock
  // that's already in transit to their own branch — they never approve or
  // cancel, even a request they raised themselves.
  const isApprover = can(currentUser, "transfer:approve");
  const isDestinationBranch = currentUser?.branchId === transfer.toBranchId;
  const canReceive = isApprover || isDestinationBranch;

  const approve = () => {
    if (!isApprover) return;
    updateTransferStatus(transfer.id, "in-transit");
    push({ title: "Transfer approved", description: `${transfer.reference} is now in-transit.`, tone: "success" });
    onClose();
  };
  const cancel = () => {
    if (!isApprover) return;
    updateTransferStatus(transfer.id, "cancelled");
    push({ title: "Transfer cancelled", description: `${transfer.reference} was cancelled.`, tone: "warn" });
    onClose();
  };
  const markReceived = () => {
    if (!canReceive) return;
    updateTransferStatus(transfer.id, "received");
    push({
      title: "Transfer received",
      description: `Stock has been moved into ${toBranch?.name ?? "the destination branch"}.`,
      tone: "success",
    });
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={transfer.reference}
      subtitle={dateTime(transfer.createdAt)}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
          {transfer.status === "pending" && isApprover ? (
            <>
              <Button variant="danger" icon={XCircle} onClick={cancel}>
                Cancel transfer
              </Button>
              <Button icon={CheckCircle2} onClick={approve}>
                Approve
              </Button>
            </>
          ) : null}
          {transfer.status === "in-transit" && canReceive ? (
            <Button icon={PackageCheck} onClick={markReceived}>
              Mark received
            </Button>
          ) : null}
        </>
      }
    >
      <div className="space-y-5">
        {!isApprover && transfer.status === "pending" ? (
          <div className="rounded-xl bg-pos-warn-soft px-3.5 py-2.5 text-xs text-pos-warn">
            Awaiting approval from the Main Branch — you'll be able to receive it once it's dispatched.
          </div>
        ) : null}
        <div className="flex items-center justify-between rounded-xl bg-pos-bg p-4">
          <div className="min-w-0 text-center">
            <p className="text-xs text-pos-muted">From</p>
            <p className="truncate text-sm font-semibold text-pos-heading">{fromBranch?.code ?? "—"}</p>
            <p className="truncate text-xs text-pos-muted">{fromBranch?.name}</p>
          </div>
          <ArrowRight size={18} className="shrink-0 text-pos-muted" />
          <div className="min-w-0 text-center">
            <p className="text-xs text-pos-muted">To</p>
            <p className="truncate text-sm font-semibold text-pos-heading">{toBranch?.code ?? "—"}</p>
            <p className="truncate text-xs text-pos-muted">{toBranch?.name}</p>
          </div>
          <Badge tone={TRANSFER_STATUS_TONE[transfer.status]}>
            {TRANSFER_STATUS_LABEL[transfer.status]}
          </Badge>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
          <div>
            <p className="text-xs text-pos-muted">Requested by</p>
            <p className="font-medium text-pos-heading">{transfer.requestedBy}</p>
          </div>
          <div>
            <p className="text-xs text-pos-muted">Line items</p>
            <p className="font-medium text-pos-heading">{transfer.lines.length}</p>
          </div>
          <div>
            <p className="text-xs text-pos-muted">Total units</p>
            <p className="font-medium text-pos-heading">{fmtNumber(totalUnits)}</p>
          </div>
          <div>
            <p className="text-xs text-pos-muted">Status</p>
            <p className="font-medium text-pos-heading">{TRANSFER_STATUS_LABEL[transfer.status]}</p>
          </div>
        </div>

        {transfer.note ? (
          <div className="rounded-xl bg-pos-warn-soft px-3.5 py-2.5 text-sm text-pos-warn">
            {transfer.note}
          </div>
        ) : null}

        <div>
          <p className="mb-2 text-sm font-medium text-pos-heading">Line items</p>
          <div className="overflow-hidden rounded-xl border border-pos-border">
            <table className="w-full text-sm">
              <thead className="bg-pos-bg">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-pos-muted">
                    Product
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-pos-muted">
                    Batch
                  </th>
                  <th className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wide text-pos-muted">
                    Quantity
                  </th>
                </tr>
              </thead>
              <tbody>
                {transfer.lines.map((line, i) => (
                  <tr key={`${line.productId}-${i}`} className="border-t border-pos-border">
                    <td className="px-3 py-2 text-pos-heading">{line.name}</td>
                    <td className="px-3 py-2 text-pos-muted">{line.batchNumber}</td>
                    <td className="px-3 py-2 text-right text-pos-heading">{fmtNumber(line.quantity)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* State machine explainer */}
        <div className="flex items-center gap-2 text-xs text-pos-muted">
          <StepDot active={true} label="Pending" />
          <StepLine />
          <StepDot
            active={transfer.status === "in-transit" || transfer.status === "received"}
            label="In-transit"
          />
          <StepLine />
          <StepDot active={transfer.status === "received"} label="Received" />
          {transfer.status === "cancelled" ? (
            <>
              <StepLine />
              <StepDot active tone="danger" label="Cancelled" />
            </>
          ) : null}
        </div>
      </div>
    </Modal>
  );
}

function StepDot({ active, label, tone }: { active: boolean; label: string; tone?: "danger" }) {
  return (
    <span className="flex items-center gap-1.5">
      <span
        className={`h-2 w-2 rounded-full ${
          tone === "danger"
            ? "bg-pos-danger"
            : active
              ? "bg-pos-brand"
              : "bg-pos-border"
        }`}
      />
      <span className={active ? "font-medium text-pos-heading" : ""}>{label}</span>
    </span>
  );
}

function StepLine() {
  return <span className="h-px w-4 bg-pos-border" />;
}
