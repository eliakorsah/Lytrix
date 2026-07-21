"use client";

import { Printer, Receipt as ReceiptIcon, SquarePlus } from "lucide-react";
import type { Branch, Sale, Settings } from "@/lib/pos/types";
import { money, dateTime } from "@/lib/pos/format";
import { Modal, Button } from "@/components/pos/ui";

export interface ReceiptModalProps {
  open: boolean;
  sale: Sale | null;
  branch: Branch | null;
  settings: Settings;
  onClose: () => void;
  onNewSale: () => void;
}

export function ReceiptModal({ open, sale, branch, settings, onClose, onNewSale }: ReceiptModalProps) {
  if (!sale) return null;
  const symbol = settings.currencySymbol;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Sale complete"
      subtitle={sale.receiptNo}
      size="sm"
      footer={
        <div className="flex w-full flex-wrap items-center justify-end gap-2">
          <Button variant="secondary" icon={Printer} onClick={() => window.print()}>
            Print
          </Button>
          <Button icon={SquarePlus} onClick={onNewSale}>
            New sale
          </Button>
        </div>
      }
    >
      <div className="pos-receipt mx-auto max-w-xs font-mono text-xs text-pos-heading">
        <div className="flex flex-col items-center gap-1 pb-3 text-center">
          <div className="mb-1 flex h-9 w-9 items-center justify-center rounded-full bg-pos-brand-soft text-pos-brand-dark">
            <ReceiptIcon size={16} />
          </div>
          <p className="text-sm font-bold">{settings.businessName}</p>
          <p>{branch?.name ?? "—"}</p>
          <p>{branch?.address}</p>
          <p>{branch?.phone}</p>
        </div>

        <div className="border-t border-dashed border-pos-border py-2">
          <div className="flex justify-between">
            <span>Receipt</span>
            <span>{sale.receiptNo}</span>
          </div>
          <div className="flex justify-between">
            <span>Date</span>
            <span>{dateTime(sale.createdAt)}</span>
          </div>
          <div className="flex justify-between">
            <span>Cashier</span>
            <span>{sale.cashierName}</span>
          </div>
          <div className="flex justify-between">
            <span>Customer</span>
            <span>{sale.customerName || "Walk-in Customer"}</span>
          </div>
          {sale.prescriptionRef ? (
            <div className="flex justify-between">
              <span>Rx Ref</span>
              <span>{sale.prescriptionRef}</span>
            </div>
          ) : null}
        </div>

        <div className="border-t border-dashed border-pos-border py-2">
          {sale.lines.map((line) => (
            <div key={line.productId} className="mb-1.5">
              <div className="flex justify-between font-semibold">
                <span className="truncate">{line.name}</span>
                <span>{money(line.unitPrice * line.quantity - line.discount, symbol)}</span>
              </div>
              <div className="flex justify-between text-pos-muted">
                <span>
                  {line.quantity} × {money(line.unitPrice, symbol)}
                  {line.discount > 0 ? ` − ${money(line.discount, symbol)}` : ""}
                </span>
                <span>{line.strength}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="border-t border-dashed border-pos-border py-2">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>{money(sale.subtotal, symbol)}</span>
          </div>
          {sale.discount > 0 ? (
            <div className="flex justify-between">
              <span>Discount</span>
              <span>−{money(sale.discount, symbol)}</span>
            </div>
          ) : null}
          <div className="flex justify-between">
            <span>VAT ({(settings.taxRate * 100).toFixed(0)}%)</span>
            <span>{money(sale.tax, symbol)}</span>
          </div>
          <div className="mt-1 flex justify-between text-sm font-bold">
            <span>TOTAL</span>
            <span>{money(sale.total, symbol)}</span>
          </div>
        </div>

        <div className="border-t border-dashed border-pos-border py-2">
          <div className="flex justify-between">
            <span>Paid via</span>
            <span>{sale.paymentMethod}</span>
          </div>
          {sale.paymentMethod === "Cash" ? (
            <>
              <div className="flex justify-between">
                <span>Tendered</span>
                <span>{money(sale.amountTendered, symbol)}</span>
              </div>
              <div className="flex justify-between">
                <span>Change</span>
                <span>{money(sale.change, symbol)}</span>
              </div>
            </>
          ) : null}
        </div>

        {settings.receiptFooter ? (
          <p className="border-t border-dashed border-pos-border pt-2 text-center text-[11px] text-pos-muted">
            {settings.receiptFooter}
          </p>
        ) : null}
      </div>
    </Modal>
  );
}
