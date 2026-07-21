"use client";

import { motion } from "framer-motion";
import { Ban, ShieldAlert, Stethoscope } from "lucide-react";
import type { Product } from "@/lib/pos/types";
import { money } from "@/lib/pos/format";
import { Badge, cn } from "@/components/pos/ui";

export interface ProductCardProps {
  product: Product;
  onHand: number;
  inCart: number;
  currencySymbol: string;
  onAdd: (product: Product) => void;
}

export function ProductCard({ product, onHand, inCart, currencySymbol, onAdd }: ProductCardProps) {
  const outOfStock = onHand <= 0;
  const low = !outOfStock && onHand <= 10;

  return (
    <motion.button
      type="button"
      whileTap={outOfStock ? undefined : { scale: 0.96 }}
      disabled={outOfStock}
      onClick={() => onAdd(product)}
      className={cn(
        "flex h-full flex-col items-start rounded-2xl bg-pos-surface p-3.5 text-left shadow-card transition-shadow",
        outOfStock ? "cursor-not-allowed opacity-50" : "hover:shadow-card-hover",
      )}
    >
      <div className="mb-2 flex w-full flex-wrap items-center gap-1">
        {product.prescriptionOnly ? (
          <Badge tone="accent" className="!px-1.5 !py-0.5 !text-[10px]">
            <Stethoscope size={10} /> Rx
          </Badge>
        ) : null}
        {product.controlled ? (
          <Badge tone="danger" className="!px-1.5 !py-0.5 !text-[10px]">
            <ShieldAlert size={10} /> Controlled
          </Badge>
        ) : null}
        {inCart > 0 ? (
          <span className="ml-auto flex h-5 min-w-[20px] items-center justify-center rounded-full bg-pos-brand px-1.5 text-[10px] font-bold text-white">
            {inCart}
          </span>
        ) : null}
      </div>

      <p className="line-clamp-2 text-sm font-semibold leading-snug text-pos-heading">{product.name}</p>
      <p className="mt-0.5 truncate text-xs text-pos-muted">
        {product.strength} · {product.form}
      </p>
      <p className="truncate text-[11px] text-pos-muted/80">{product.packSize}</p>

      <div className="mt-auto flex w-full items-end justify-between pt-3">
        <p className="text-sm font-bold text-pos-heading">{money(product.sellPrice, currencySymbol)}</p>
        {outOfStock ? (
          <Badge tone="danger" className="!text-[10px]">
            <Ban size={10} /> Out of stock
          </Badge>
        ) : (
          <Badge tone={low ? "warn" : "ok"} className="!text-[10px]">
            {onHand} left
          </Badge>
        )}
      </div>
    </motion.button>
  );
}
