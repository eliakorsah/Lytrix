"use client";

import {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import {
  AlertCircle,
  ArrowDown,
  ArrowUp,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
  Info,
  Loader2,
  X,
  type LucideIcon,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/* cn                                                                  */
/* ------------------------------------------------------------------ */

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/* ------------------------------------------------------------------ */
/* Tones                                                               */
/* ------------------------------------------------------------------ */

export type Tone = "brand" | "accent" | "warn" | "danger" | "ok" | "violet";

const TONE_SOLID: Record<Tone, string> = {
  brand: "bg-pos-brand",
  accent: "bg-pos-accent",
  warn: "bg-pos-warn",
  danger: "bg-pos-danger",
  ok: "bg-pos-ok",
  violet: "bg-violet-500",
};

const TONE_SOFT_BG: Record<Tone, string> = {
  brand: "bg-pos-brand-soft",
  accent: "bg-pos-accent-soft",
  warn: "bg-pos-warn-soft",
  danger: "bg-pos-danger-soft",
  ok: "bg-pos-ok-soft",
  violet: "bg-violet-50",
};

const TONE_SOFT_TEXT: Record<Tone, string> = {
  brand: "text-pos-brand-dark",
  accent: "text-pos-accent",
  warn: "text-pos-warn",
  danger: "text-pos-danger",
  ok: "text-pos-ok",
  violet: "text-violet-600",
};

const TONE_GRADIENT: Record<Tone, string> = {
  brand: "bg-[linear-gradient(135deg,#0FA98C_0%,#0B8A72_100%)]",
  accent: "bg-[linear-gradient(135deg,#5B7CFF_0%,#3350D9_100%)]",
  warn: "bg-[linear-gradient(135deg,#FBB03B_0%,#F59E0B_100%)]",
  danger: "bg-[linear-gradient(135deg,#FF6B7A_0%,#E23A4E_100%)]",
  ok: "bg-[linear-gradient(135deg,#34D399_0%,#0EA36F_100%)]",
  violet: "bg-[linear-gradient(135deg,#A78BFA_0%,#7C3AED_100%)]",
};

/* ------------------------------------------------------------------ */
/* Card                                                                */
/* ------------------------------------------------------------------ */

export interface CardProps {
  className?: string;
  children?: ReactNode;
  padded?: boolean;
}

export function Card({ className, children, padded = true }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl bg-pos-surface shadow-card",
        padded && "p-4 sm:p-6",
        className,
      )}
    >
      {children}
    </div>
  );
}

export interface CardHeaderProps {
  title: ReactNode;
  subtitle?: ReactNode;
  action?: ReactNode;
  className?: string;
}

export function CardHeader({ title, subtitle, action, className }: CardHeaderProps) {
  return (
    <div className={cn("mb-4 flex items-start justify-between gap-3", className)}>
      <div className="min-w-0">
        <h3 className="truncate text-base font-semibold text-pos-heading">{title}</h3>
        {subtitle ? (
          <p className="mt-0.5 truncate text-sm text-pos-muted">{subtitle}</p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* StatTile                                                            */
/* ------------------------------------------------------------------ */

export interface StatTileProps {
  label: string;
  value: ReactNode;
  delta?: number;
  icon: LucideIcon;
  tone: Tone;
  variant?: "plain" | "gradient";
  className?: string;
}

export function StatTile({
  label,
  value,
  delta,
  icon: Icon,
  tone,
  variant = "plain",
  className,
}: StatTileProps) {
  const hasDelta = typeof delta === "number" && !Number.isNaN(delta);
  const up = hasDelta && (delta as number) >= 0;

  if (variant === "gradient") {
    return (
      <div
        className={cn(
          "relative overflow-hidden rounded-2xl p-5 text-white shadow-card",
          TONE_GRADIENT[tone],
          className,
        )}
      >
        <div className="pointer-events-none absolute -right-6 -top-6 h-28 w-28 rounded-full bg-white/10" />
        <div className="pointer-events-none absolute -bottom-8 right-8 h-20 w-20 rounded-full bg-white/10" />
        <div className="relative flex items-start justify-between">
          <div className="rounded-xl bg-white/20 p-2.5">
            <Icon size={18} className="text-white" />
          </div>
          {hasDelta ? (
            <span
              className={cn(
                "inline-flex items-center gap-0.5 rounded-full bg-white/20 px-2 py-0.5 text-xs font-medium",
              )}
            >
              {up ? <ArrowUp size={11} /> : <ArrowDown size={11} />}
              {Math.abs(delta as number).toFixed(1)}%
            </span>
          ) : null}
        </div>
        <p className="relative mt-4 text-2xl font-semibold tracking-tight">{value}</p>
        <p className="relative mt-1 text-sm text-white/80">{label}</p>
      </div>
    );
  }

  return (
    <div className={cn("rounded-2xl bg-pos-surface p-5 shadow-card", className)}>
      <div className="flex items-start justify-between">
        <div className={cn("rounded-xl p-2.5", TONE_SOFT_BG[tone])}>
          <Icon size={18} className={TONE_SOFT_TEXT[tone]} />
        </div>
        {hasDelta ? (
          <span
            className={cn(
              "inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-medium",
              up ? "bg-pos-ok-soft text-pos-ok" : "bg-pos-danger-soft text-pos-danger",
            )}
          >
            {up ? <ArrowUp size={11} /> : <ArrowDown size={11} />}
            {Math.abs(delta as number).toFixed(1)}%
          </span>
        ) : null}
      </div>
      <p className="mt-4 text-2xl font-semibold tracking-tight text-pos-heading">{value}</p>
      <p className="mt-1 text-sm text-pos-muted">{label}</p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Badge                                                                */
/* ------------------------------------------------------------------ */

export interface BadgeProps {
  tone: Tone | "neutral";
  children: ReactNode;
  className?: string;
}

export function Badge({ tone, children, className }: BadgeProps) {
  if (tone === "neutral") {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 rounded-full bg-pos-bg px-2.5 py-1 text-xs font-medium text-pos-muted ring-1 ring-inset ring-pos-border",
          className,
        )}
      >
        {children}
      </span>
    );
  }
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium",
        TONE_SOFT_BG[tone],
        TONE_SOFT_TEXT[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Button                                                               */
/* ------------------------------------------------------------------ */

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  icon?: LucideIcon;
  loading?: boolean;
}

const BUTTON_VARIANT: Record<NonNullable<ButtonProps["variant"]>, string> = {
  primary: "bg-pos-brand text-white hover:bg-pos-brand-dark shadow-sm",
  secondary:
    "bg-white text-pos-heading ring-1 ring-inset ring-pos-border hover:bg-pos-bg",
  ghost: "bg-transparent text-pos-heading hover:bg-pos-bg",
  danger: "bg-pos-danger text-white hover:brightness-95 shadow-sm",
};

const BUTTON_SIZE: Record<NonNullable<ButtonProps["size"]>, string> = {
  sm: "h-8 px-3 text-xs gap-1.5",
  md: "h-10 px-4 text-sm gap-2",
  lg: "h-12 px-6 text-base gap-2",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "primary", size = "md", icon: Icon, loading, className, children, disabled, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        "inline-flex select-none items-center justify-center rounded-xl font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pos-brand focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        BUTTON_VARIANT[variant],
        BUTTON_SIZE[size],
        className,
      )}
      {...rest}
    >
      {loading ? (
        <Loader2 size={16} className="animate-spin" />
      ) : Icon ? (
        <Icon size={16} />
      ) : null}
      {children}
    </button>
  );
});

/* ------------------------------------------------------------------ */
/* Form controls                                                       */
/* ------------------------------------------------------------------ */

const fieldBase =
  "w-full rounded-xl border border-pos-border bg-white px-3.5 py-2.5 text-sm text-pos-heading placeholder:text-pos-muted/70 transition-shadow focus:outline-none focus:ring-2 focus:ring-pos-brand/40 focus:border-pos-brand disabled:cursor-not-allowed disabled:bg-pos-bg disabled:text-pos-muted";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
  containerClassName?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, hint, error, className, containerClassName, id, ...rest },
  ref,
) {
  const autoId = useId();
  const inputId = id ?? autoId;
  return (
    <div className={cn("w-full", containerClassName)}>
      {label ? (
        <label htmlFor={inputId} className="mb-1.5 block text-sm font-medium text-pos-heading">
          {label}
        </label>
      ) : null}
      <input
        id={inputId}
        ref={ref}
        className={cn(fieldBase, error && "border-pos-danger focus:ring-pos-danger/40", className)}
        {...rest}
      />
      {error ? (
        <p className="mt-1.5 text-xs text-pos-danger">{error}</p>
      ) : hint ? (
        <p className="mt-1.5 text-xs text-pos-muted">{hint}</p>
      ) : null}
    </div>
  );
});

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  hint?: string;
  error?: string;
  containerClassName?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, hint, error, className, containerClassName, id, children, ...rest },
  ref,
) {
  const autoId = useId();
  const selectId = id ?? autoId;
  return (
    <div className={cn("w-full", containerClassName)}>
      {label ? (
        <label htmlFor={selectId} className="mb-1.5 block text-sm font-medium text-pos-heading">
          {label}
        </label>
      ) : null}
      <select
        id={selectId}
        ref={ref}
        className={cn(fieldBase, "appearance-none bg-no-repeat pr-9", error && "border-pos-danger", className)}
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%236B7A90' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E\")",
          backgroundPosition: "right 0.75rem center",
          backgroundSize: "16px",
        }}
        {...rest}
      >
        {children}
      </select>
      {error ? (
        <p className="mt-1.5 text-xs text-pos-danger">{error}</p>
      ) : hint ? (
        <p className="mt-1.5 text-xs text-pos-muted">{hint}</p>
      ) : null}
    </div>
  );
});

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  hint?: string;
  error?: string;
  containerClassName?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, hint, error, className, containerClassName, id, ...rest },
  ref,
) {
  const autoId = useId();
  const textareaId = id ?? autoId;
  return (
    <div className={cn("w-full", containerClassName)}>
      {label ? (
        <label htmlFor={textareaId} className="mb-1.5 block text-sm font-medium text-pos-heading">
          {label}
        </label>
      ) : null}
      <textarea
        id={textareaId}
        ref={ref}
        className={cn(fieldBase, "min-h-[96px] resize-y", error && "border-pos-danger", className)}
        {...rest}
      />
      {error ? (
        <p className="mt-1.5 text-xs text-pos-danger">{error}</p>
      ) : hint ? (
        <p className="mt-1.5 text-xs text-pos-muted">{hint}</p>
      ) : null}
    </div>
  );
});

/* ------------------------------------------------------------------ */
/* Modal                                                                */
/* ------------------------------------------------------------------ */

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  subtitle?: ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
  children?: ReactNode;
  footer?: ReactNode;
}

const MODAL_SIZE: Record<NonNullable<ModalProps["size"]>, string> = {
  sm: "sm:max-w-sm",
  md: "sm:max-w-lg",
  lg: "sm:max-w-2xl",
  xl: "sm:max-w-4xl",
};

export function Modal({ open, onClose, title, subtitle, size = "md", children, footer }: ModalProps) {
  const [mounted, setMounted] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const previouslyFocused = document.activeElement as HTMLElement | null;
    const panel = panelRef.current;
    const focusables = () =>
      panel
        ? Array.from(
            panel.querySelectorAll<HTMLElement>(
              'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
            ),
          ).filter((el) => !el.hasAttribute("disabled"))
        : [];

    const toFocus = focusables();
    (toFocus[0] ?? panel)?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
        return;
      }
      if (e.key === "Tab") {
        const items = focusables();
        if (items.length === 0) return;
        const first = items[0];
        const last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
      previouslyFocused?.focus?.();
    };
  }, [open, onClose]);

  if (!mounted || !open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center sm:p-4">
      <div
        className="absolute inset-0 bg-pos-heading/40 backdrop-blur-sm animate-[fade-up_0.2s_ease-out]"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={typeof title === "string" ? title : undefined}
        tabIndex={-1}
        className={cn(
          "relative flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-2xl bg-white shadow-pop outline-none sm:rounded-2xl sm:animate-[fade-up_0.2s_ease-out]",
          MODAL_SIZE[size],
        )}
      >
        {title ? (
          <div className="flex items-start justify-between gap-3 border-b border-pos-border px-5 py-4 sm:px-6">
            <div className="min-w-0">
              <h2 className="truncate text-lg font-semibold text-pos-heading">{title}</h2>
              {subtitle ? <p className="mt-0.5 text-sm text-pos-muted">{subtitle}</p> : null}
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close dialog"
              className="shrink-0 rounded-lg p-1.5 text-pos-muted hover:bg-pos-bg hover:text-pos-heading focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pos-brand"
            >
              <X size={18} />
            </button>
          </div>
        ) : null}
        <div className="flex-1 overflow-y-auto px-5 py-4 sm:px-6">{children}</div>
        {footer ? (
          <div className="flex items-center justify-end gap-2 border-t border-pos-border px-5 py-4 sm:px-6">
            {footer}
          </div>
        ) : null}
      </div>
    </div>,
    document.body,
  );
}

/* ------------------------------------------------------------------ */
/* DataTable                                                           */
/* ------------------------------------------------------------------ */

export interface DataTableColumn<T> {
  key: string;
  header: ReactNode;
  render?: (row: T) => ReactNode;
  align?: "left" | "right" | "center";
  sortable?: boolean;
  className?: string;
  /** Optional accessor used for sorting when `render` doesn't return a comparable value. */
  sortValue?: (row: T) => string | number;
}

export interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  rows: T[];
  keyOf: (row: T) => string;
  empty?: ReactNode;
  pageSize?: number;
  onRowClick?: (row: T) => void;
}

export function DataTable<T>({
  columns,
  rows,
  keyOf,
  empty,
  pageSize = 10,
  onRowClick,
}: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(0);

  const sorted = useMemo(() => {
    if (!sortKey) return rows;
    const col = columns.find((c) => c.key === sortKey);
    if (!col) return rows;
    const getValue = (row: T): string | number => {
      if (col.sortValue) return col.sortValue(row);
      const rendered = col.render ? col.render(row) : (row as Record<string, unknown>)[col.key];
      if (typeof rendered === "number") return rendered;
      return String(rendered ?? "");
    };
    return [...rows].sort((a, b) => {
      const av = getValue(a);
      const bv = getValue(b);
      const cmp =
        typeof av === "number" && typeof bv === "number"
          ? av - bv
          : String(av).localeCompare(String(bv));
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [rows, sortKey, sortDir, columns]);

  const pageCount = Math.max(1, Math.ceil(sorted.length / pageSize));
  const clampedPage = Math.min(page, pageCount - 1);
  const start = clampedPage * pageSize;
  const pageRows = sorted.slice(start, start + pageSize);

  const toggleSort = (key: string) => {
    setPage(0);
    if (sortKey !== key) {
      setSortKey(key);
      setSortDir("asc");
    } else {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    }
  };

  if (rows.length === 0) {
    return (
      <div className="py-8">
        {empty ?? <EmptyState title="Nothing here yet" description="No records to show." />}
      </div>
    );
  }

  return (
    <div>
      {/* Desktop / tablet table */}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full border-collapse text-sm">
          <thead className="sticky top-0 z-10 bg-pos-surface">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={cn(
                    "border-b border-pos-border px-3 py-3 text-xs font-semibold uppercase tracking-wide text-pos-muted",
                    col.align === "right" && "text-right",
                    col.align === "center" && "text-center",
                    col.className,
                  )}
                >
                  {col.sortable ? (
                    <button
                      type="button"
                      onClick={() => toggleSort(col.key)}
                      className={cn(
                        "inline-flex items-center gap-1 hover:text-pos-heading",
                        col.align === "right" && "flex-row-reverse",
                      )}
                    >
                      {col.header}
                      <ChevronsUpDown
                        size={12}
                        className={cn(sortKey === col.key ? "text-pos-brand" : "text-pos-muted/50")}
                      />
                    </button>
                  ) : (
                    col.header
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageRows.map((row) => (
              <tr
                key={keyOf(row)}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={cn(
                  "border-b border-pos-border/70 last:border-b-0",
                  onRowClick && "cursor-pointer hover:bg-pos-bg",
                )}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={cn(
                      "px-3 py-3 text-pos-heading",
                      col.align === "right" && "text-right",
                      col.align === "center" && "text-center",
                      col.className,
                    )}
                  >
                    {col.render ? col.render(row) : String((row as Record<string, unknown>)[col.key] ?? "")}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile stacked cards */}
      <div className="space-y-3 md:hidden">
        {pageRows.map((row) => (
          <div
            key={keyOf(row)}
            onClick={onRowClick ? () => onRowClick(row) : undefined}
            className={cn(
              "rounded-xl border border-pos-border bg-white p-3.5",
              onRowClick && "cursor-pointer active:bg-pos-bg",
            )}
          >
            {columns.map((col) => (
              <div
                key={col.key}
                className="flex items-center justify-between gap-3 py-1 text-sm first:pt-0 last:pb-0"
              >
                <span className="shrink-0 text-xs font-medium uppercase tracking-wide text-pos-muted">
                  {col.header}
                </span>
                <span className="min-w-0 truncate text-right text-pos-heading">
                  {col.render ? col.render(row) : String((row as Record<string, unknown>)[col.key] ?? "")}
                </span>
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Pagination */}
      {sorted.length > pageSize ? (
        <div className="mt-4 flex flex-col items-center justify-between gap-3 sm:flex-row">
          <p className="text-xs text-pos-muted">
            Showing {start + 1} to {Math.min(start + pageSize, sorted.length)} of {sorted.length}
          </p>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              aria-label="Previous page"
              disabled={clampedPage === 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-pos-border text-pos-heading hover:bg-pos-bg disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft size={15} />
            </button>
            <span className="px-2 text-xs text-pos-muted">
              {clampedPage + 1} / {pageCount}
            </span>
            <button
              type="button"
              aria-label="Next page"
              disabled={clampedPage >= pageCount - 1}
              onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-pos-border text-pos-heading hover:bg-pos-bg disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronRight size={15} />
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* EmptyState                                                          */
/* ------------------------------------------------------------------ */

export interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center px-6 py-10 text-center", className)}>
      {Icon ? (
        <div className="mb-3 rounded-full bg-pos-bg p-3">
          <Icon size={22} className="text-pos-muted" />
        </div>
      ) : null}
      <p className="text-sm font-semibold text-pos-heading">{title}</p>
      {description ? <p className="mt-1 max-w-xs text-sm text-pos-muted">{description}</p> : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Skeleton                                                             */
/* ------------------------------------------------------------------ */

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-lg bg-pos-border/70", className)} />;
}

/* ------------------------------------------------------------------ */
/* Toast system                                                        */
/* ------------------------------------------------------------------ */

export type ToastTone = "default" | "success" | "warn" | "danger" | "info";

export interface ToastInput {
  title: string;
  description?: string;
  tone?: ToastTone;
  duration?: number;
}

interface ToastItem extends ToastInput {
  id: string;
}

interface ToastContextValue {
  push: (toast: ToastInput) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const TOAST_ICON: Record<ToastTone, LucideIcon> = {
  default: Info,
  success: CheckCircle2,
  warn: AlertCircle,
  danger: AlertCircle,
  info: Info,
};

const TOAST_ICON_TONE: Record<ToastTone, string> = {
  default: "text-pos-muted",
  success: "text-pos-ok",
  warn: "text-pos-warn",
  danger: "text-pos-danger",
  info: "text-pos-accent",
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const remove = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const push = useCallback(
    (toast: ToastInput) => {
      const id = Math.random().toString(36).slice(2, 10);
      setToasts((prev) => [...prev, { id, tone: "default", ...toast }]);
      const duration = toast.duration ?? 4000;
      window.setTimeout(() => remove(id), duration);
    },
    [remove],
  );

  const value = useMemo(() => ({ push }), [push]);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {mounted
        ? createPortal(
            <div className="pointer-events-none fixed inset-x-0 top-3 z-[200] flex flex-col items-center gap-2 sm:inset-x-auto sm:bottom-4 sm:right-4 sm:top-auto sm:items-end">
              {toasts.map((t) => {
                const Icon = TOAST_ICON[t.tone ?? "default"];
                return (
                  <div
                    key={t.id}
                    role="status"
                    className="pointer-events-auto flex w-[min(360px,92vw)] items-start gap-3 rounded-xl bg-white p-3.5 shadow-pop ring-1 ring-pos-border animate-[fade-up_0.2s_ease-out]"
                  >
                    <Icon size={18} className={cn("mt-0.5 shrink-0", TOAST_ICON_TONE[t.tone ?? "default"])} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-pos-heading">{t.title}</p>
                      {t.description ? (
                        <p className="mt-0.5 text-xs text-pos-muted">{t.description}</p>
                      ) : null}
                    </div>
                    <button
                      type="button"
                      aria-label="Dismiss notification"
                      onClick={() => remove(t.id)}
                      className="shrink-0 rounded-md p-1 text-pos-muted hover:bg-pos-bg hover:text-pos-heading"
                    >
                      <X size={14} />
                    </button>
                  </div>
                );
              })}
            </div>,
            document.body,
          )
        : null}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
}

/* ------------------------------------------------------------------ */
/* PageHeader                                                          */
/* ------------------------------------------------------------------ */

export interface PageHeaderProps {
  title: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
  className?: string;
}

export function PageHeader({ title, subtitle, actions, className }: PageHeaderProps) {
  return (
    <div className={cn("mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between", className)}>
      <div className="min-w-0">
        <h1 className="text-xl font-semibold tracking-tight text-pos-heading sm:text-2xl">{title}</h1>
        {subtitle ? <p className="mt-1 text-sm text-pos-muted">{subtitle}</p> : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}

export { Check };
