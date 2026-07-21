"use client";

import { useState } from "react";

/** Shared 7 / 30 / 90 day period selector state for the dashboard & reports pages. */
export function usePeriod(initial = 30): [number, (next: number) => void] {
  const [period, setPeriod] = useState(initial);
  return [period, setPeriod];
}
