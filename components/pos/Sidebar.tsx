"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";
import {
  BarChart3,
  Boxes,
  ClipboardList,
  Cross,
  FileText,
  GitBranch,
  LayoutDashboard,
  Lock,
  Package,
  Receipt,
  Settings as SettingsIcon,
  ShoppingCart,
  Truck,
  Users,
} from "lucide-react";
import { cn } from "./ui";
import { usePos } from "@/lib/pos/store";
import { can, isNetworkUser, type Capability } from "@/lib/pos/permissions";

interface NavItem {
  label: string;
  href: string;
  icon: typeof LayoutDashboard;
  capability: Capability;
  exact?: boolean;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    label: "Overview",
    items: [
      { label: "Dashboard", href: "/demo/pos", icon: LayoutDashboard, capability: "view:dashboard", exact: true },
      { label: "Analytics", href: "/demo/pos/reports", icon: BarChart3, capability: "view:reports" },
    ],
  },
  {
    label: "Operations",
    items: [
      { label: "Sell / POS Terminal", href: "/demo/pos/sell", icon: ShoppingCart, capability: "sell" },
      { label: "Sales History", href: "/demo/pos/sales", icon: Receipt, capability: "view:sales" },
      { label: "Invoices", href: "/demo/pos/invoices", icon: FileText, capability: "view:invoices" },
      { label: "Prescriptions", href: "/demo/pos/prescriptions", icon: ClipboardList, capability: "view:prescriptions" },
    ],
  },
  {
    label: "Inventory",
    items: [
      { label: "Products", href: "/demo/pos/inventory", icon: Package, capability: "view:inventory" },
      { label: "Stock Transfers", href: "/demo/pos/transfers", icon: Boxes, capability: "view:transfers" },
      { label: "Suppliers", href: "/demo/pos/suppliers", icon: Truck, capability: "view:suppliers" },
    ],
  },
  {
    label: "Network",
    items: [
      { label: "Branches", href: "/demo/pos/branches", icon: GitBranch, capability: "view:branches" },
      { label: "Staff", href: "/demo/pos/staff", icon: Users, capability: "view:staff" },
    ],
  },
  {
    label: "System",
    items: [{ label: "Settings", href: "/demo/pos/settings", icon: SettingsIcon, capability: "view:settings" }],
  },
];

function isActive(pathname: string, item: NavItem) {
  if (item.exact) return pathname === item.href;
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

export interface SidebarProps {
  collapsed: boolean;
  onNavigate?: () => void;
}

export function Sidebar({ collapsed, onNavigate }: SidebarProps) {
  const pathname = usePathname();
  const { scope, activeBranch, currentUser } = usePos();
  const [hovered, setHovered] = useState<string | null>(null);

  const networkUser = isNetworkUser(currentUser);

  // Hide every item the signed-in user lacks the capability for, and drop a
  // whole group once every item in it is hidden — e.g. a Cashier has no
  // Network access at all, so that heading shouldn't render empty.
  const visibleGroups = useMemo(
    () =>
      NAV_GROUPS.map((group) => ({
        ...group,
        items: group.items.filter((item) => can(currentUser, item.capability)),
      })).filter((group) => group.items.length > 0),
    [currentUser],
  );

  return (
    <div className="flex h-full flex-col">
      {/* Brand */}
      <div className={cn("flex items-center gap-3 px-4 pb-2 pt-5", collapsed && "justify-center px-2")}>
        <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[linear-gradient(135deg,#14C4A2_0%,#0B8A72_100%)] shadow-sm">
          <Cross size={18} className="text-white" strokeWidth={2.5} />
        </div>
        {!collapsed ? (
          <div className="min-w-0">
            <p className="truncate text-base font-semibold leading-tight text-pos-heading">
              MediPlus
            </p>
            <p className="truncate text-[10px] font-semibold uppercase tracking-widest text-pos-muted">
              POS System
            </p>
          </div>
        ) : null}
      </div>

      {/* Nav */}
      <nav className="mt-3 flex-1 space-y-5 overflow-y-auto px-3 pb-4" aria-label="Primary">
        {visibleGroups.map((group) => (
          <div key={group.label}>
            {!collapsed ? (
              <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-widest text-pos-muted/80">
                {group.label}
              </p>
            ) : (
              <div className="mb-1.5 h-px bg-pos-border" />
            )}
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const active = isActive(pathname, item);
                const Icon = item.icon;
                return (
                  <li key={item.href} className="relative">
                    <Link
                      href={item.href}
                      onClick={onNavigate}
                      onMouseEnter={() => setHovered(item.href)}
                      onMouseLeave={() => setHovered(null)}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                        collapsed && "justify-center px-0",
                        active
                          ? "bg-pos-brand text-white shadow-[0_6px_18px_rgba(15,169,140,0.35)]"
                          : "text-pos-heading/80 hover:bg-pos-brand-soft hover:text-pos-brand-dark",
                      )}
                    >
                      <Icon size={18} className="shrink-0" strokeWidth={active ? 2.25 : 2} />
                      {!collapsed ? <span className="truncate">{item.label}</span> : null}
                    </Link>
                    {collapsed && hovered === item.href ? (
                      <span
                        role="tooltip"
                        className="pointer-events-none absolute left-full top-1/2 z-50 ml-2 -translate-y-1/2 whitespace-nowrap rounded-lg bg-pos-heading px-2.5 py-1.5 text-xs font-medium text-white shadow-pop"
                      >
                        {item.label}
                      </span>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Scope card */}
      {!collapsed ? (
        <div className="mx-3 mb-4 rounded-xl bg-pos-brand-soft p-3">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-pos-brand-dark/70">
            {networkUser ? "Viewing" : "Your branch"}
          </p>
          <p className="mt-0.5 flex items-center gap-1.5 truncate text-sm font-semibold text-pos-brand-dark">
            {!networkUser ? <Lock size={12} className="shrink-0" /> : null}
            {networkUser ? (scope === "all" ? "All Branches" : activeBranch?.name ?? "—") : activeBranch?.name ?? "—"}
          </p>
        </div>
      ) : null}
    </div>
  );
}
