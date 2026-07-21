"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Building2, Check, ChevronDown, MapPin, Network, Search } from "lucide-react";
import { cn } from "./ui";
import { usePos } from "@/lib/pos/store";
import { branchPerformance } from "@/lib/pos/selectors";
import { money } from "@/lib/pos/format";

const SEARCH_THRESHOLD = 6;

export function BranchSwitcher() {
  const { data, scope, setScope } = usePos();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const performance = useMemo(() => branchPerformance(data, 30), [data]);
  const revenueByBranch = useMemo(
    () => new Map(performance.map((p) => [p.branchId, p.revenue])),
    [performance],
  );

  const branches = data.branches;
  const mainBranch = branches.find((b) => b.isMain);
  const currentBranch = scope === "all" ? null : branches.find((b) => b.id === scope) ?? null;

  const filteredBranches = useMemo(() => {
    if (!query.trim()) return branches;
    const q = query.trim().toLowerCase();
    return branches.filter(
      (b) =>
        b.name.toLowerCase().includes(q) ||
        b.code.toLowerCase().includes(q) ||
        b.city.toLowerCase().includes(q),
    );
  }, [branches, query]);

  const showSearch = branches.length > SEARCH_THRESHOLD;
  const showAllOption = !query.trim() || "all branches main view".includes(query.trim().toLowerCase());

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    if (showSearch) window.setTimeout(() => searchRef.current?.focus(), 10);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, showSearch]);

  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  const label = scope === "all" ? "All Branches" : currentBranch?.name ?? "Select branch";
  const sublabel = scope === "all" ? "Main View · Consolidated" : currentBranch?.code ?? "";

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="flex items-center gap-2.5 rounded-xl border border-pos-border bg-white px-3 py-2 text-left hover:bg-pos-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pos-brand"
      >
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-pos-brand-soft text-pos-brand-dark">
          {scope === "all" ? <Network size={16} /> : <Building2 size={16} />}
        </div>
        <div className="hidden min-w-0 sm:block">
          <p className="truncate text-sm font-semibold leading-tight text-pos-heading">{label}</p>
          <p className="truncate text-[11px] leading-tight text-pos-muted">{sublabel}</p>
        </div>
        <ChevronDown size={15} className={cn("shrink-0 text-pos-muted transition-transform", open && "rotate-180")} />
      </button>

      {open ? (
        <div
          role="listbox"
          className="absolute right-0 z-50 mt-2 w-[min(340px,88vw)] overflow-hidden rounded-2xl bg-white shadow-pop ring-1 ring-pos-border sm:left-0 sm:right-auto"
        >
          {showSearch ? (
            <div className="border-b border-pos-border p-2.5">
              <div className="flex items-center gap-2 rounded-lg bg-pos-bg px-2.5 py-2">
                <Search size={14} className="text-pos-muted" />
                <input
                  ref={searchRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search branches..."
                  className="w-full bg-transparent text-sm text-pos-heading placeholder:text-pos-muted focus:outline-none"
                />
              </div>
            </div>
          ) : null}

          <div className="max-h-[60vh] overflow-y-auto py-1.5">
            {showAllOption ? (
              <button
                type="button"
                role="option"
                aria-selected={scope === "all"}
                onClick={() => {
                  setScope("all");
                  setOpen(false);
                }}
                className={cn(
                  "flex w-full items-center gap-3 px-3.5 py-2.5 text-left hover:bg-pos-bg",
                  scope === "all" && "bg-pos-brand-soft",
                )}
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-pos-accent-soft text-pos-accent">
                  <Network size={16} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-pos-heading">
                    All Branches — Main View
                  </p>
                  <p className="truncate text-xs text-pos-muted">Consolidated HQ view · every branch</p>
                </div>
                {scope === "all" ? <Check size={16} className="shrink-0 text-pos-brand" /> : null}
              </button>
            ) : null}

            {filteredBranches.length > 0 ? (
              <div className={cn(showAllOption && "mt-1 border-t border-pos-border pt-1")}>
                {filteredBranches.map((branch) => {
                  const selected = scope === branch.id;
                  return (
                    <button
                      key={branch.id}
                      type="button"
                      role="option"
                      aria-selected={selected}
                      onClick={() => {
                        setScope(branch.id);
                        setOpen(false);
                      }}
                      className={cn(
                        "flex w-full items-center gap-3 px-3.5 py-2.5 text-left hover:bg-pos-bg",
                        selected && "bg-pos-brand-soft",
                      )}
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-pos-brand-soft text-pos-brand-dark text-xs font-semibold">
                        {branch.code.slice(0, 2)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <p className="truncate text-sm font-semibold text-pos-heading">{branch.name}</p>
                          {branch.isMain ? (
                            <span className="shrink-0 rounded-full bg-pos-accent px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white">
                              Main
                            </span>
                          ) : null}
                        </div>
                        <p className="flex items-center gap-1 truncate text-xs text-pos-muted">
                          <MapPin size={10} className="shrink-0" />
                          {branch.code} · {branch.city}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-xs font-semibold text-pos-heading">
                          {money(revenueByBranch.get(branch.id) ?? 0, data.settings.currencySymbol, {
                            compact: true,
                          })}
                        </p>
                        <p className="text-[10px] text-pos-muted">30d rev</p>
                      </div>
                      {selected ? <Check size={15} className="shrink-0 text-pos-brand" /> : null}
                    </button>
                  );
                })}
              </div>
            ) : !showAllOption ? (
              <p className="px-3.5 py-6 text-center text-sm text-pos-muted">No branches match "{query}"</p>
            ) : null}
          </div>

          {mainBranch ? (
            <div className="border-t border-pos-border bg-pos-bg/60 px-3.5 py-2 text-[11px] text-pos-muted">
              HQ: {mainBranch.name}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
