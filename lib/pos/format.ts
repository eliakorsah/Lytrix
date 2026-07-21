// Shared formatters. Every currency figure in the POS demo goes through these
// so switching the currency in Settings updates the whole app.

export function money(
  amount: number,
  symbol = "₵",
  opts: { compact?: boolean; decimals?: number } = {},
) {
  const { compact = false, decimals = 2 } = opts;

  if (compact && Math.abs(amount) >= 1000) {
    const units = [
      { limit: 1e9, suffix: "B" },
      { limit: 1e6, suffix: "M" },
      { limit: 1e3, suffix: "K" },
    ];
    for (const { limit, suffix } of units) {
      if (Math.abs(amount) >= limit) {
        const v = amount / limit;
        return `${symbol}${v.toFixed(v < 10 ? 1 : 0)}${suffix}`;
      }
    }
  }

  return `${symbol}${amount.toLocaleString("en-GB", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`;
}

export const number = (value: number) => value.toLocaleString("en-GB");

export const percent = (value: number, decimals = 1) =>
  `${value >= 0 ? "+" : ""}${value.toFixed(decimals)}%`;

export function shortDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function dateTime(iso: string) {
  return new Date(iso).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function timeAgo(iso: string) {
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return shortDate(iso);
}

/** "expires in 42 days" / "expired 6 days ago" */
export function expiryLabel(daysLeft: number) {
  if (daysLeft < 0) return `Expired ${Math.abs(daysLeft)}d ago`;
  if (daysLeft === 0) return "Expires today";
  return `${daysLeft}d left`;
}

export const initials = (name: string) =>
  name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
