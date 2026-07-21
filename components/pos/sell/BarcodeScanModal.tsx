"use client";

import { useEffect, useRef, useState } from "react";
import { ScanBarcode } from "lucide-react";
import { Modal, Button, Input } from "@/components/pos/ui";

export interface BarcodeScanModalProps {
  open: boolean;
  onClose: () => void;
  /** Returns true when the barcode matched a product, so the modal can show feedback. */
  onScan: (barcode: string) => boolean;
  sampleBarcode?: string;
}

/**
 * Simulates a barcode scanner: a real device just "types" the barcode very
 * fast and sends Enter. We accept both — paste-and-Enter, or manual typing.
 */
export function BarcodeScanModal({ open, onClose, onScan, sampleBarcode }: BarcodeScanModalProps) {
  const [value, setValue] = useState("");
  const [status, setStatus] = useState<"idle" | "hit" | "miss">("idle");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setValue("");
      setStatus("idle");
      const t = window.setTimeout(() => inputRef.current?.focus(), 50);
      return () => window.clearTimeout(t);
    }
  }, [open]);

  const submit = (raw: string) => {
    const code = raw.trim();
    if (!code) return;
    const matched = onScan(code);
    setStatus(matched ? "hit" : "miss");
    setValue("");
    window.setTimeout(() => inputRef.current?.focus(), 10);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Scan barcode"
      subtitle="Type or paste a barcode to simulate a scanner, then press Enter."
      size="sm"
      footer={
        <Button variant="secondary" onClick={onClose}>
          Done
        </Button>
      }
    >
      <div className="flex flex-col items-center gap-4 py-2">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-pos-brand-soft text-pos-brand-dark">
          <ScanBarcode size={26} />
        </div>
        <Input
          ref={inputRef}
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setStatus("idle");
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              submit(value);
            }
          }}
          placeholder="e.g. 601000000"
          aria-label="Barcode"
          className="text-center font-mono tracking-widest"
        />
        {status === "hit" ? (
          <p className="text-sm font-medium text-pos-ok">Added to cart.</p>
        ) : status === "miss" ? (
          <p className="text-sm font-medium text-pos-danger">No product matches that barcode.</p>
        ) : sampleBarcode ? (
          <p className="text-xs text-pos-muted">
            Try <span className="font-mono">{sampleBarcode}</span>
          </p>
        ) : null}
      </div>
    </Modal>
  );
}
