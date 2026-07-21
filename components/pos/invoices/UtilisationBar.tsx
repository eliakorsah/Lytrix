"use client";

import { cn } from "@/components/pos/ui";

export interface UtilisationBarProps {
  /** outstanding ÷ creditLimit, e.g. 0.42 for 42%. */
  ratio: number;
  className?: string;
}

/** Turns warn near the limit and danger once it's breached. */
export function UtilisationBar({ ratio, className }: UtilisationBarProps) {
  const pct = Math.max(0, ratio) * 100;
  const clampedWidth = Math.min(100, pct);
  const tone = ratio >= 1 ? "danger" : ratio >= 0.8 ? "warn" : "ok";
  const barClass =
    tone === "danger" ? "bg-pos-danger" : tone === "warn" ? "bg-pos-warn" : "bg-pos-ok";
  const textClass =
    tone === "danger" ? "text-pos-danger" : tone === "warn" ? "text-pos-warn" : "text-pos-muted";

  return (
    <div className={cn("w-full", className)}>
      <div className="h-2 w-full overflow-hidden rounded-full bg-pos-bg">
        <div className={cn("h-full rounded-full transition-all", barClass)} style={{ width: `${clampedWidth}%` }} />
      </div>
      <p className={cn("mt-1 text-right text-xs font-medium", textClass)}>{pct.toFixed(0)}% of limit used</p>
    </div>
  );
}
