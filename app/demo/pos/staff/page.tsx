"use client";

import { useMemo, useState } from "react";
import { Pill, Plus, Search, ShieldCheck, UserCheck, Users } from "lucide-react";
import { usePos } from "@/lib/pos/store";
import { initials, timeAgo } from "@/lib/pos/format";
import type { Staff, StaffRole } from "@/lib/pos/types";
import { can, isNetworkUser, ROLE_CAPABILITIES, ROLE_SUMMARY } from "@/lib/pos/permissions";
import {
  Badge,
  Button,
  Card,
  CardHeader,
  DataTable,
  type DataTableColumn,
  PageHeader,
  Select,
  Skeleton,
  cn,
} from "@/components/pos/ui";
import { AddStaffModal, ROLE_TONE, StaffDetailModal } from "@/components/pos/network/StaffModals";
import { CAPABILITY_LABELS } from "@/components/pos/network/capabilityLabels";
import { RequireCapability } from "@/components/pos/RequireCapability";

const ROLES: StaffRole[] = ["Administrator", "Branch Manager", "Pharmacist", "Cashier"];

function StaffPageInner() {
  const { data, ready, scope, currentUser } = usePos();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | StaffRole>("all");
  const [branchFilter, setBranchFilter] = useState("all");
  const [addOpen, setAddOpen] = useState(false);
  const [selected, setSelected] = useState<Staff | null>(null);

  const networkUser = isNetworkUser(currentUser);
  const canManageStaff = can(currentUser, "staff:manage");
  const ownBranch = data.branches.find((b) => b.id === currentUser?.branchId);

  const branchName = useMemo(() => new Map(data.branches.map((b) => [b.id, b.name])), [data.branches]);

  const scopedStaff = useMemo(() => {
    return data.staff.filter((s) => {
      if (scope !== "all" && s.branchId !== scope) return false;
      if (scope === "all" && branchFilter !== "all" && s.branchId !== branchFilter) return false;
      return true;
    });
  }, [data.staff, scope, branchFilter]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return scopedStaff.filter((s) => {
      if (roleFilter !== "all" && s.role !== roleFilter) return false;
      if (q && !s.name.toLowerCase().includes(q) && !s.email.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [scopedStaff, roleFilter, search]);

  const now = Date.now();
  const totalStaff = scopedStaff.length;
  const activeNow = scopedStaff.filter((s) => now - new Date(s.lastActive).getTime() <= 24 * 3600_000).length;
  const pharmacists = scopedStaff.filter((s) => s.role === "Pharmacist").length;
  const cashiers = scopedStaff.filter((s) => s.role === "Cashier").length;

  const columns: DataTableColumn<Staff>[] = [
    {
      key: "name",
      header: "Name",
      sortable: true,
      sortValue: (row) => row.name,
      render: (row) => (
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[linear-gradient(135deg,#4C6FFF_0%,#2A46D9_100%)] text-xs font-semibold text-white">
            {initials(row.name)}
          </span>
          <div className="min-w-0">
            <p className="truncate font-medium text-pos-heading">{row.name}</p>
            <p className="truncate text-xs text-pos-muted">{row.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: "phone",
      header: "Phone",
      render: (row) => row.phone,
    },
    {
      key: "role",
      header: "Role",
      sortable: true,
      sortValue: (row) => row.role,
      render: (row) => <Badge tone={ROLE_TONE[row.role]}>{row.role}</Badge>,
    },
    {
      key: "branch",
      header: "Branch",
      sortable: true,
      sortValue: (row) => branchName.get(row.branchId) ?? "",
      render: (row) => branchName.get(row.branchId) ?? "—",
    },
    {
      key: "active",
      header: "Status",
      align: "center",
      sortable: true,
      sortValue: (row) => (row.active ? 1 : 0),
      render: (row) => (
        <Badge tone={row.active ? "ok" : "neutral"}>{row.active ? "Active" : "Inactive"}</Badge>
      ),
    },
    {
      key: "lastActive",
      header: "Last active",
      sortable: true,
      sortValue: (row) => row.lastActive,
      render: (row) => timeAgo(row.lastActive),
    },
  ];

  if (!ready) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-9 w-64" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title={networkUser ? "Staff" : `Staff — ${ownBranch?.name ?? "your branch"}`}
        subtitle={
          networkUser
            ? "Everyone with access to the till and back office, across every branch."
            : `Managing the team at ${ownBranch?.name ?? "your branch"}.`
        }
        actions={
          canManageStaff ? (
            <Button icon={Plus} onClick={() => setAddOpen(true)}>
              Add staff member
            </Button>
          ) : undefined
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card padded className="p-5">
          <div className="rounded-xl bg-pos-brand-soft p-2.5 text-pos-brand-dark w-fit">
            <Users size={18} />
          </div>
          <p className="mt-4 text-2xl font-semibold tracking-tight text-pos-heading">{totalStaff}</p>
          <p className="mt-1 text-sm text-pos-muted">Total staff</p>
        </Card>
        <Card padded className="p-5">
          <div className="rounded-xl bg-pos-ok-soft p-2.5 text-pos-ok w-fit">
            <UserCheck size={18} />
          </div>
          <p className="mt-4 text-2xl font-semibold tracking-tight text-pos-heading">{activeNow}</p>
          <p className="mt-1 text-sm text-pos-muted">Active in last 24h</p>
        </Card>
        <Card padded className="p-5">
          <div className="rounded-xl bg-pos-accent-soft p-2.5 text-pos-accent w-fit">
            <ShieldCheck size={18} />
          </div>
          <p className="mt-4 text-2xl font-semibold tracking-tight text-pos-heading">{pharmacists}</p>
          <p className="mt-1 text-sm text-pos-muted">Pharmacists</p>
        </Card>
        <Card padded className="p-5">
          <div className="rounded-xl bg-pos-warn-soft p-2.5 text-pos-warn w-fit">
            <Pill size={18} />
          </div>
          <p className="mt-4 text-2xl font-semibold tracking-tight text-pos-heading">{cashiers}</p>
          <p className="mt-1 text-sm text-pos-muted">Cashiers</p>
        </Card>
      </div>

      <Card className="mt-6">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2 rounded-xl border border-pos-border bg-white px-3 py-2 sm:max-w-xs sm:flex-1">
            <Search size={15} className="shrink-0 text-pos-muted" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or email..."
              className="w-full bg-transparent text-sm text-pos-heading placeholder:text-pos-muted focus:outline-none"
            />
          </div>
          <Select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as "all" | StaffRole)}
            containerClassName="sm:w-48"
          >
            <option value="all">All roles</option>
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </Select>
          {networkUser ? (
            <Select
              value={branchFilter}
              onChange={(e) => setBranchFilter(e.target.value)}
              containerClassName="sm:w-56"
            >
              <option value="all">All branches</option>
              {data.branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </Select>
          ) : null}
        </div>

        <DataTable
          columns={columns}
          rows={filtered}
          keyOf={(row) => row.id}
          onRowClick={(row) => setSelected(row)}
          empty={
            <div className="py-6 text-center text-sm text-pos-muted">
              No staff match the current filters.
            </div>
          }
        />
      </Card>

      <div className="mt-6">
        <Card>
          <CardHeader title="Permissions by role" subtitle="What each role can do across the network." />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {ROLES.map((role) => {
              const isOwnRole = currentUser?.role === role;
              return (
                <div
                  key={role}
                  className={cn(
                    "rounded-xl border p-4",
                    isOwnRole ? "border-pos-brand ring-1 ring-pos-brand/40" : "border-pos-border",
                  )}
                >
                  <div className="flex items-center gap-1.5">
                    <Badge tone={ROLE_TONE[role]}>{role}</Badge>
                    {isOwnRole ? <Badge tone="neutral">Your role</Badge> : null}
                  </div>
                  <p className="mt-2.5 text-xs text-pos-muted">{ROLE_SUMMARY[role]}</p>
                  <ul className="mt-3 space-y-1.5">
                    {ROLE_CAPABILITIES[role].map((capability) => (
                      <li key={capability} className="flex items-start gap-1.5 text-xs text-pos-heading">
                        <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-pos-brand" />
                        {CAPABILITY_LABELS[capability]}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      <AddStaffModal
        open={addOpen && canManageStaff}
        onClose={() => setAddOpen(false)}
        defaultBranchId={scope !== "all" ? scope : undefined}
      />
      <StaffDetailModal open={!!selected} onClose={() => setSelected(null)} staff={selected} />
    </div>
  );
}

export default function StaffPage() {
  return (
    <RequireCapability capability="view:staff">
      <StaffPageInner />
    </RequireCapability>
  );
}
