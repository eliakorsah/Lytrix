"use client";

// Persona-picker sign-in for the MediPlus POS demo. No passwords — this is a
// showcase, so the whole point is to make it trivially easy to try every
// role. `PosShell` renders this page bare (no sidebar/topbar) because it
// special-cases this exact pathname.

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  ChevronDown,
  Cross,
  Lock,
  Search,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import { usePos } from "@/lib/pos/store";
import { ROLE_SUMMARY } from "@/lib/pos/permissions";
import { initials } from "@/lib/pos/format";
import type { Staff, StaffRole } from "@/lib/pos/types";
import { cn } from "@/components/pos/ui";

const ROLE_ORDER: StaffRole[] = ["Administrator", "Branch Manager", "Pharmacist", "Cashier"];

const ROLE_BADGE_TONE: Record<StaffRole, string> = {
  Administrator: "bg-pos-accent-soft text-pos-accent",
  "Branch Manager": "bg-pos-brand-soft text-pos-brand-dark",
  Pharmacist: "bg-pos-ok-soft text-pos-ok",
  Cashier: "bg-pos-warn-soft text-pos-warn",
};

const FEATURES = [
  "One catalogue, stock tracked per branch and per batch expiry",
  "Role-based access — a cashier never sees another branch's numbers",
  "Live dashboards, transfers, invoicing and reporting across the network",
  "Reset to a clean seeded dataset any time, with one click",
];

/** Pick one representative staff member per role, favouring distinct branches
 *  so the branch-locking behaviour is obvious at a glance. */
function pickDemoAccounts(staff: Staff[]): Staff[] {
  const active = staff.filter((s) => s.active);
  const pool = active.length > 0 ? active : staff;

  const picks: Staff[] = [];
  const usedBranches = new Set<string>();

  for (const role of ROLE_ORDER) {
    const candidates = pool.filter((s) => s.role === role);
    if (candidates.length === 0) continue;
    const fresh = candidates.find((s) => !usedBranches.has(s.branchId));
    const chosen = fresh ?? candidates[0];
    picks.push(chosen);
    usedBranches.add(chosen.branchId);
  }

  return picks;
}

export default function PosLoginPage() {
  const router = useRouter();
  const { ready, data, currentUser, login } = usePos();
  const [browseOpen, setBrowseOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [pendingId, setPendingId] = useState<string | null>(null);

  useEffect(() => {
    if (ready && currentUser) {
      router.replace("/demo/pos");
    }
  }, [ready, currentUser, router]);

  const branchesById = useMemo(
    () => new Map(data.branches.map((b) => [b.id, b])),
    [data.branches],
  );

  const demoAccounts = useMemo(() => pickDemoAccounts(data.staff), [data.staff]);

  const allStaffSorted = useMemo(
    () =>
      [...data.staff].sort((a, b) => {
        const roleDiff = ROLE_ORDER.indexOf(a.role) - ROLE_ORDER.indexOf(b.role);
        if (roleDiff !== 0) return roleDiff;
        return a.name.localeCompare(b.name);
      }),
    [data.staff],
  );

  const filteredStaff = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return allStaffSorted;
    return allStaffSorted.filter((s) => {
      const branch = branchesById.get(s.branchId);
      return (
        s.name.toLowerCase().includes(q) ||
        s.role.toLowerCase().includes(q) ||
        branch?.name.toLowerCase().includes(q) ||
        branch?.code.toLowerCase().includes(q)
      );
    });
  }, [allStaffSorted, query, branchesById]);

  const handleSignIn = (staffId: string) => {
    setPendingId(staffId);
    login(staffId);
    router.push("/demo/pos");
  };

  if (!ready || currentUser) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-pos-bg">
        <div className="h-9 w-9 animate-spin rounded-full border-2 border-pos-brand border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="grid min-h-screen grid-cols-1 bg-pos-bg lg:grid-cols-[minmax(0,520px)_1fr]">
      {/* Left — brand panel */}
      <div className="relative hidden overflow-hidden bg-[linear-gradient(160deg,#0B8A72_0%,#0FA98C_45%,#14C4A2_100%)] px-10 py-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-white/10" />
        <div className="pointer-events-none absolute -bottom-32 -left-16 h-80 w-80 rounded-full bg-white/10" />
        <div className="pointer-events-none absolute right-16 top-1/3 h-40 w-40 rounded-full bg-white/5" />

        <div className="relative">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15 shadow-sm ring-1 ring-white/25">
              <Cross size={20} className="text-white" strokeWidth={2.5} />
            </div>
            <div>
              <p className="text-lg font-semibold leading-tight">MediPlus</p>
              <p className="text-[11px] font-semibold uppercase tracking-widest text-white/70">
                POS System
              </p>
            </div>
          </div>

          <p className="mt-14 max-w-sm text-2xl font-semibold leading-snug tracking-tight">
            The operating system for a multi-branch pharmacy network.
          </p>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/80">
            One demo, four roles. Sign in as anyone below to see exactly what
            they see — dashboards, stock, invoices and staff, scoped to
            whatever their role and branch allow.
          </p>
        </div>

        <div className="relative mt-10 space-y-3">
          {FEATURES.map((f) => (
            <div key={f} className="flex items-start gap-2.5 text-sm text-white/90">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/15">
                <Sparkles size={11} />
              </span>
              <span className="leading-relaxed">{f}</span>
            </div>
          ))}
        </div>

        <p className="relative mt-10 text-xs text-white/60">
          MediPlus Pharmacy · a Lytrix Consult product demo
        </p>
      </div>

      {/* Right — sign-in panel */}
      <div className="flex items-center justify-center px-4 py-10 sm:px-8">
        <div className="w-full max-w-md">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[linear-gradient(135deg,#14C4A2_0%,#0B8A72_100%)] shadow-sm">
              <Cross size={18} className="text-white" strokeWidth={2.5} />
            </div>
            <div>
              <p className="text-base font-semibold leading-tight text-pos-heading">MediPlus</p>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-pos-muted">
                POS System
              </p>
            </div>
          </div>

          <h1 className="text-xl font-semibold tracking-tight text-pos-heading sm:text-2xl">
            Sign in to the demo
          </h1>
          <p className="mt-1.5 flex items-start gap-1.5 text-sm text-pos-muted">
            <Lock size={13} className="mt-0.5 shrink-0" />
            No passwords needed — this is a demo. Pick any account below and
            you're in.
          </p>

          <div className="mt-6 space-y-2.5">
            {demoAccounts.map((s) => {
              const branch = branchesById.get(s.branchId);
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => handleSignIn(s.id)}
                  disabled={pendingId !== null}
                  className="group flex w-full items-center gap-3.5 rounded-2xl border border-pos-border bg-white p-3.5 text-left shadow-card transition hover:-translate-y-0.5 hover:border-pos-brand/40 hover:shadow-pop disabled:cursor-wait disabled:opacity-70"
                >
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[linear-gradient(135deg,#4C6FFF_0%,#2A46D9_100%)] text-sm font-semibold text-white">
                    {initials(s.name)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span className="truncate text-sm font-semibold text-pos-heading">{s.name}</span>
                      <span
                        className={cn(
                          "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold",
                          ROLE_BADGE_TONE[s.role],
                        )}
                      >
                        {s.role}
                      </span>
                    </span>
                    <span className="mt-0.5 flex items-center gap-1 truncate text-xs text-pos-muted">
                      <Building2 size={11} className="shrink-0" />
                      {branch?.name ?? "—"}
                    </span>
                    <span className="mt-1 block truncate text-[11px] leading-snug text-pos-muted/90">
                      {ROLE_SUMMARY[s.role]}
                    </span>
                  </span>
                  <ArrowRight
                    size={16}
                    className="shrink-0 text-pos-muted transition group-hover:translate-x-0.5 group-hover:text-pos-brand"
                  />
                </button>
              );
            })}
          </div>

          {/* Browse all staff accounts */}
          <div className="mt-6 overflow-hidden rounded-2xl border border-pos-border bg-white">
            <button
              type="button"
              onClick={() => setBrowseOpen((v) => !v)}
              className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left"
            >
              <span className="flex items-center gap-2 text-sm font-medium text-pos-heading">
                <Users size={15} className="text-pos-muted" />
                Browse all staff accounts
                <span className="rounded-full bg-pos-bg px-2 py-0.5 text-[10px] font-semibold text-pos-muted">
                  {data.staff.length}
                </span>
              </span>
              <ChevronDown
                size={16}
                className={cn("shrink-0 text-pos-muted transition-transform", browseOpen && "rotate-180")}
              />
            </button>

            {browseOpen ? (
              <div className="border-t border-pos-border">
                <div className="flex items-center gap-2 border-b border-pos-border px-4 py-2.5">
                  <Search size={14} className="shrink-0 text-pos-muted" />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search by name, role or branch..."
                    className="w-full bg-transparent text-sm text-pos-heading placeholder:text-pos-muted focus:outline-none"
                    autoFocus
                  />
                </div>
                <div className="max-h-72 overflow-y-auto py-1">
                  {filteredStaff.length === 0 ? (
                    <p className="px-4 py-6 text-center text-sm text-pos-muted">
                      No staff match "{query}"
                    </p>
                  ) : (
                    filteredStaff.map((s) => {
                      const branch = branchesById.get(s.branchId);
                      return (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => handleSignIn(s.id)}
                          disabled={pendingId !== null}
                          className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-pos-bg disabled:cursor-wait disabled:opacity-70"
                        >
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-pos-brand-soft text-[11px] font-semibold text-pos-brand-dark">
                            {initials(s.name)}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-medium text-pos-heading">
                              {s.name}
                            </span>
                            <span className="block truncate text-xs text-pos-muted">
                              {s.role} · {branch?.name ?? "—"}
                            </span>
                          </span>
                          {!s.active ? (
                            <span className="shrink-0 rounded-full bg-pos-bg px-2 py-0.5 text-[10px] font-medium text-pos-muted ring-1 ring-inset ring-pos-border">
                              Inactive
                            </span>
                          ) : null}
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            ) : null}
          </div>

          <div className="mt-6 flex items-start gap-2 rounded-xl bg-pos-brand-soft/60 px-3.5 py-3 text-xs leading-relaxed text-pos-brand-dark">
            <ShieldCheck size={15} className="mt-0.5 shrink-0" />
            <span>
              This is a self-contained demo. Data lives only in your browser
              and access is fully role-gated — try a Cashier account, then an
              Administrator, to see the difference.
            </span>
          </div>

          <p className="mt-6 flex items-center justify-center gap-1.5 text-center text-[11px] text-pos-muted">
            <BadgeCheck size={12} />
            MediPlus Pharmacy · a Lytrix Consult product demo
          </p>
        </div>
      </div>
    </div>
  );
}
