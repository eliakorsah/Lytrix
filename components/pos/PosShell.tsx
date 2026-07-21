"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  Bell,
  Building2,
  ChevronsLeft,
  Clock3,
  Lock,
  LogOut,
  Menu,
  Package,
  RotateCcw,
  Search,
  User as UserIcon,
  Users as UsersIcon,
  X,
} from "lucide-react";
import { usePos } from "@/lib/pos/store";
import { can, isNetworkUser } from "@/lib/pos/permissions";
import { expiringBatches, lowStock } from "@/lib/pos/selectors";
import { expiryLabel, initials } from "@/lib/pos/format";
import { Sidebar } from "./Sidebar";
import { BranchSwitcher } from "./BranchSwitcher";
import { Badge, ToastProvider, cn, useToast } from "./ui";

const LOGIN_PATH = "/demo/pos/login";

const SIDEBAR_KEY = "lytrix-pos-demo:sidebar";

interface SearchHit {
  id: string;
  type: "Product" | "Branch" | "Staff";
  title: string;
  subtitle: string;
  href: string;
}

function PosShellInner({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { data, ready, scope, currentUser, logout, resetDemo } = usePos();
  const { push } = useToast();
  const isLoginPage = pathname === LOGIN_PATH;

  const [collapsed, setCollapsed] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [notifOpen, setNotifOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);

  const searchRootRef = useRef<HTMLDivElement>(null);
  const notifRootRef = useRef<HTMLDivElement>(null);
  const userRootRef = useRef<HTMLDivElement>(null);

  // Restore collapsed state from localStorage.
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(SIDEBAR_KEY);
      if (saved === "1") setCollapsed(true);
    } catch {
      /* ignore */
    }
  }, []);

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        window.localStorage.setItem(SIDEBAR_KEY, next ? "1" : "0");
      } catch {
        /* ignore */
      }
      return next;
    });
  };

  // Lock body scroll while the mobile drawer is open.
  useEffect(() => {
    if (!drawerOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [drawerOpen]);

  // Escape closes drawer / dropdowns.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setDrawerOpen(false);
      setSearchOpen(false);
      setNotifOpen(false);
      setUserOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  // Outside-click handling for dropdowns.
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (searchRootRef.current && !searchRootRef.current.contains(target)) setSearchOpen(false);
      if (notifRootRef.current && !notifRootRef.current.contains(target)) setNotifOpen(false);
      if (userRootRef.current && !userRootRef.current.contains(target)) setUserOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const lowStockAlerts = useMemo(() => (ready ? lowStock(data, scope, 6) : []), [ready, data, scope]);
  const expiryAlerts = useMemo(() => (ready ? expiringBatches(data, scope, 6) : []), [ready, data, scope]);
  const notifCount = lowStockAlerts.length + expiryAlerts.length;

  // Auth guard: bounce signed-out visitors to the login screen. Never redirect
  // during render — wait for the store to hydrate (`ready`) and do it in an
  // effect so we don't fight React's render pass.
  useEffect(() => {
    if (!ready) return;
    if (!currentUser && !isLoginPage) {
      router.replace(LOGIN_PATH);
    }
  }, [ready, currentUser, isLoginPage, router]);

  const networkUser = isNetworkUser(currentUser);
  const currentUserBranch = useMemo(
    () => (currentUser ? data.branches.find((b) => b.id === currentUser.branchId) ?? null : null),
    [currentUser, data.branches],
  );

  const searchHits: SearchHit[] = useMemo(() => {
    if (!ready || !query.trim()) return [];
    const q = query.trim().toLowerCase();
    const hits: SearchHit[] = [];

    for (const p of data.products) {
      if (hits.filter((h) => h.type === "Product").length >= 5) break;
      if (p.name.toLowerCase().includes(q) || p.genericName.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q)) {
        hits.push({
          id: p.id,
          type: "Product",
          title: p.name,
          subtitle: `${p.strength} · ${p.category}`,
          href: "/demo/pos/inventory",
        });
      }
    }

    // Non-network users can't see other branches, so keep the branch and
    // staff results out of their search entirely rather than just hiding
    // the destination page.
    const visibleBranches = networkUser
      ? data.branches
      : data.branches.filter((b) => b.id === currentUser?.branchId);
    for (const b of visibleBranches) {
      if (hits.filter((h) => h.type === "Branch").length >= 5) break;
      if (b.name.toLowerCase().includes(q) || b.code.toLowerCase().includes(q) || b.city.toLowerCase().includes(q)) {
        hits.push({
          id: b.id,
          type: "Branch",
          title: b.name,
          subtitle: `${b.code} · ${b.city}`,
          href: "/demo/pos/branches",
        });
      }
    }

    const visibleStaff = networkUser
      ? data.staff
      : data.staff.filter((s) => s.branchId === currentUser?.branchId);
    for (const s of visibleStaff) {
      if (hits.filter((h) => h.type === "Staff").length >= 5) break;
      if (s.name.toLowerCase().includes(q) || s.role.toLowerCase().includes(q)) {
        hits.push({
          id: s.id,
          type: "Staff",
          title: s.name,
          subtitle: s.role,
          href: "/demo/pos/staff",
        });
      }
    }

    return hits;
  }, [ready, query, data, networkUser, currentUser]);

  const handleResetDemo = () => {
    resetDemo();
    setUserOpen(false);
    push({
      title: "Demo data reset",
      description: "MediPlus Pharmacy has been restored to its seeded state.",
      tone: "success",
    });
  };

  const handleSignOut = () => {
    setUserOpen(false);
    logout();
    router.push(LOGIN_PATH);
  };

  const goTo = (href: string) => {
    setSearchOpen(false);
    setQuery("");
    router.push(href);
  };

  // The login screen owns its own full-page layout — render it bare, with no
  // sidebar/topbar chrome around it.
  if (isLoginPage) {
    return <>{children}</>;
  }

  if (!ready) {
    return <ShellSkeleton />;
  }

  // Signed-out visitor on a protected page: the effect above is already
  // redirecting to /login. Render nothing so the app shell never flashes.
  if (!currentUser) {
    return null;
  }

  return (
    <div className="min-h-screen bg-pos-bg">
      {/* Desktop sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-30 hidden border-r border-pos-border bg-white transition-[width] duration-200 ease-out lg:block",
          collapsed ? "w-[76px]" : "w-64",
        )}
      >
        <Sidebar collapsed={collapsed} />
        <button
          type="button"
          onClick={toggleCollapsed}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="absolute -right-3 top-16 flex h-6 w-6 items-center justify-center rounded-full border border-pos-border bg-white text-pos-muted shadow-card hover:text-pos-brand"
        >
          <ChevronsLeft size={13} className={cn("transition-transform", collapsed && "rotate-180")} />
        </button>
      </aside>

      {/* Mobile drawer */}
      {drawerOpen ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-pos-heading/40 backdrop-blur-sm"
            onClick={() => setDrawerOpen(false)}
            aria-hidden="true"
          />
          <div className="relative flex h-full w-72 max-w-[85vw] flex-col bg-white shadow-pop animate-[fade-up_0.2s_ease-out]">
            <button
              type="button"
              onClick={() => setDrawerOpen(false)}
              aria-label="Close menu"
              className="absolute right-3 top-4 rounded-lg p-1.5 text-pos-muted hover:bg-pos-bg"
            >
              <X size={18} />
            </button>
            <Sidebar collapsed={false} onNavigate={() => setDrawerOpen(false)} />
          </div>
        </div>
      ) : null}

      {/* Content column */}
      <div className={cn("flex min-h-screen flex-col transition-[padding] duration-200 ease-out", collapsed ? "lg:pl-[76px]" : "lg:pl-64")}>
        {/* Topbar */}
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-pos-border bg-white/90 px-4 backdrop-blur sm:px-6">
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            aria-label="Open menu"
            className="rounded-lg p-2 text-pos-heading hover:bg-pos-bg lg:hidden"
          >
            <Menu size={20} />
          </button>

          <div ref={searchRootRef} className="relative min-w-0 flex-1 max-w-md">
            <div className="flex items-center gap-2 rounded-xl border border-pos-border bg-pos-bg px-3 py-2 focus-within:border-pos-brand focus-within:ring-2 focus-within:ring-pos-brand/30">
              <Search size={16} className="shrink-0 text-pos-muted" />
              <input
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setSearchOpen(true);
                }}
                onFocus={() => setSearchOpen(true)}
                placeholder="Search products, branches, staff..."
                aria-label="Global search"
                className="w-full bg-transparent text-sm text-pos-heading placeholder:text-pos-muted focus:outline-none"
              />
            </div>

            {searchOpen && query.trim() ? (
              <div className="absolute left-0 right-0 z-50 mt-2 max-h-96 overflow-y-auto rounded-2xl bg-white shadow-pop ring-1 ring-pos-border">
                {searchHits.length === 0 ? (
                  <p className="px-4 py-6 text-center text-sm text-pos-muted">
                    No results for "{query}"
                  </p>
                ) : (
                  <ul className="py-1.5">
                    {searchHits.map((hit) => (
                      <li key={`${hit.type}-${hit.id}`}>
                        <button
                          type="button"
                          onClick={() => goTo(hit.href)}
                          className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-pos-bg"
                        >
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-pos-brand-soft text-pos-brand-dark">
                            {hit.type === "Product" ? (
                              <Package size={14} />
                            ) : hit.type === "Branch" ? (
                              <Building2 size={14} />
                            ) : (
                              <UsersIcon size={14} />
                            )}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-medium text-pos-heading">
                              {hit.title}
                            </span>
                            <span className="block truncate text-xs text-pos-muted">{hit.subtitle}</span>
                          </span>
                          <Badge tone="neutral" className="shrink-0">
                            {hit.type}
                          </Badge>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ) : null}
          </div>

          <div className="ml-auto flex items-center gap-2 sm:gap-3">
            <div className="hidden sm:block">
              {networkUser ? <BranchSwitcher /> : <LockedBranchChip branch={currentUserBranch} />}
            </div>

            {/* Notifications */}
            <div ref={notifRootRef} className="relative">
              <button
                type="button"
                onClick={() => setNotifOpen((v) => !v)}
                aria-label={`Notifications, ${notifCount} alerts`}
                className="relative rounded-lg p-2 text-pos-heading hover:bg-pos-bg"
              >
                <Bell size={19} />
                {notifCount > 0 ? (
                  <span className="absolute right-1 top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-pos-danger px-1 text-[10px] font-bold text-white">
                    {notifCount > 9 ? "9+" : notifCount}
                  </span>
                ) : null}
              </button>

              {notifOpen ? (
                <div className="absolute right-0 z-50 mt-2 w-[min(360px,90vw)] overflow-hidden rounded-2xl bg-white shadow-pop ring-1 ring-pos-border">
                  <div className="border-b border-pos-border px-4 py-3">
                    <p className="text-sm font-semibold text-pos-heading">Alerts</p>
                    <p className="text-xs text-pos-muted">Low stock & expiring batches</p>
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {notifCount === 0 ? (
                      <p className="px-4 py-6 text-center text-sm text-pos-muted">All clear — nothing needs attention.</p>
                    ) : (
                      <>
                        {lowStockAlerts.map((a) => (
                          <div key={`low-${a.branchId}-${a.product.id}`} className="flex items-start gap-3 px-4 py-2.5 hover:bg-pos-bg">
                            <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-pos-warn-soft text-pos-warn">
                              <AlertTriangle size={13} />
                            </span>
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium text-pos-heading">{a.product.name}</p>
                              <p className="truncate text-xs text-pos-muted">
                                {a.onHand} left at {a.branchName} · reorder at {a.reorderLevel}
                              </p>
                            </div>
                          </div>
                        ))}
                        {expiryAlerts.map((a) => (
                          <div key={`exp-${a.batch.id}`} className="flex items-start gap-3 px-4 py-2.5 hover:bg-pos-bg">
                            <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-pos-danger-soft text-pos-danger">
                              <Clock3 size={13} />
                            </span>
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium text-pos-heading">{a.product?.name ?? "Batch"}</p>
                              <p className="truncate text-xs text-pos-muted">
                                {expiryLabel(a.daysLeft)} · {a.branchName} · batch {a.batch.batchNumber}
                              </p>
                            </div>
                          </div>
                        ))}
                      </>
                    )}
                  </div>
                </div>
              ) : null}
            </div>

            {/* User menu */}
            <div ref={userRootRef} className="relative">
              <button
                type="button"
                onClick={() => setUserOpen((v) => !v)}
                aria-label="Account menu"
                className="flex items-center gap-2 rounded-xl p-1 pr-2 hover:bg-pos-bg"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[linear-gradient(135deg,#4C6FFF_0%,#2A46D9_100%)] text-xs font-semibold text-white">
                  {initials(currentUser.name)}
                </span>
                <span className="hidden text-left md:block">
                  <span className="block text-sm font-medium leading-tight text-pos-heading">
                    {currentUser.name}
                  </span>
                  <span className="block text-[11px] leading-tight text-pos-muted">{currentUser.role}</span>
                </span>
              </button>

              {userOpen ? (
                <div className="absolute right-0 z-50 mt-2 w-56 overflow-hidden rounded-2xl bg-white shadow-pop ring-1 ring-pos-border">
                  <div className="border-b border-pos-border px-4 py-3">
                    <p className="text-sm font-semibold text-pos-heading">{currentUser.name}</p>
                    <p className="text-xs text-pos-muted">
                      {currentUser.role} · {currentUserBranch?.name ?? "—"}
                    </p>
                  </div>
                  <div className="py-1.5">
                    {can(currentUser, "demo:reset") ? (
                      <button
                        type="button"
                        onClick={handleResetDemo}
                        className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm text-pos-heading hover:bg-pos-bg"
                      >
                        <RotateCcw size={15} className="text-pos-muted" />
                        Reset demo data
                      </button>
                    ) : null}
                    <Link
                      href="/demo/pos/settings"
                      onClick={() => setUserOpen(false)}
                      className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm text-pos-heading hover:bg-pos-bg"
                    >
                      <UserIcon size={15} className="text-pos-muted" />
                      Account settings
                    </Link>
                    <button
                      type="button"
                      onClick={handleSignOut}
                      className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm text-pos-heading hover:bg-pos-bg"
                    >
                      <LogOut size={15} className="text-pos-muted" />
                      Sign out
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </header>

        {/* Mobile branch switcher row */}
        <div className="border-b border-pos-border bg-white px-4 py-2.5 sm:hidden">
          {networkUser ? <BranchSwitcher /> : <LockedBranchChip branch={currentUserBranch} fullWidth />}
        </div>

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}

/**
 * Non-network users (Branch Manager, Pharmacist, Cashier) can never change
 * scope — the store pins them to their own branch. This chip stands in for
 * `BranchSwitcher` and makes that lock visible and intentional rather than
 * looking like a missing control.
 */
function LockedBranchChip({ branch, fullWidth }: { branch: { name: string; code: string } | null; fullWidth?: boolean }) {
  return (
    <div
      title="You are signed in to this branch"
      className={cn(
        "flex items-center gap-2.5 rounded-xl border border-pos-border bg-pos-bg px-3 py-2",
        fullWidth && "w-full",
      )}
    >
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-pos-border/60 text-pos-muted">
        <Building2 size={16} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold leading-tight text-pos-heading">
          {branch?.name ?? "—"}
        </p>
        <p className="truncate text-[11px] leading-tight text-pos-muted">{branch?.code ?? ""}</p>
      </div>
      <Lock size={13} className="shrink-0 text-pos-muted" aria-hidden="true" />
    </div>
  );
}

function ShellSkeleton() {
  return (
    <div className="flex min-h-screen bg-pos-bg">
      <div className="hidden w-64 shrink-0 border-r border-pos-border bg-white lg:block" />
      <div className="flex flex-1 flex-col">
        <div className="h-16 border-b border-pos-border bg-white" />
        <div className="flex-1 space-y-4 px-4 py-6 sm:px-6 lg:px-8">
          <div className="h-8 w-48 animate-pulse rounded-lg bg-pos-border/70" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-28 animate-pulse rounded-2xl bg-white shadow-card" />
            ))}
          </div>
          <div className="h-72 animate-pulse rounded-2xl bg-white shadow-card" />
        </div>
      </div>
    </div>
  );
}

export function PosShell({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <PosShellInner>{children}</PosShellInner>
    </ToastProvider>
  );
}
