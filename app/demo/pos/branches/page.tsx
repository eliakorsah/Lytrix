"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, CheckCircle2, Plus, Wallet, Wallet2 } from "lucide-react";
import { usePos } from "@/lib/pos/store";
import { branchPerformance, lowStock, revenueSeries } from "@/lib/pos/selectors";
import { money, number as fmtNumber } from "@/lib/pos/format";
import { can } from "@/lib/pos/permissions";
import type { Branch } from "@/lib/pos/types";
import {
  Badge,
  Button,
  Card,
  CardHeader,
  DataTable,
  type DataTableColumn,
  EmptyState,
  PageHeader,
  Skeleton,
  useToast,
} from "@/components/pos/ui";
import { BranchCard } from "@/components/pos/network/BranchCard";
import { BranchModal } from "@/components/pos/network/BranchModal";
import { RequireCapability } from "@/components/pos/RequireCapability";

interface ComparisonRow {
  branch: Branch;
  revenue: number;
  transactions: number;
  profit: number;
  stockValue: number;
  lowStockCount: number;
  staffCount: number;
}

function BranchesPageInner() {
  const { data, ready, setScope, currentUser } = usePos();
  const router = useRouter();
  const { push } = useToast();

  const canCreateBranch = can(currentUser, "branch:create");
  const canEditBranch = can(currentUser, "branch:edit");

  const [addOpen, setAddOpen] = useState(false);
  const [manageBranch, setManageBranch] = useState<Branch | null>(null);

  const performance = useMemo(() => (ready ? branchPerformance(data, 30) : []), [ready, data]);
  const performanceById = useMemo(
    () => new Map(performance.map((p) => [p.branchId, p])),
    [performance],
  );

  const staffCountByBranch = useMemo(() => {
    const map = new Map<string, number>();
    for (const s of data.staff) map.set(s.branchId, (map.get(s.branchId) ?? 0) + 1);
    return map;
  }, [data.staff]);

  const lowStockCountByBranch = useMemo(() => {
    if (!ready) return new Map<string, number>();
    const map = new Map<string, number>();
    for (const branch of data.branches) {
      map.set(branch.id, lowStock(data, branch.id).length);
    }
    return map;
  }, [ready, data]);

  const sparklineByBranch = useMemo(() => {
    if (!ready) return new Map<string, { value: number }[]>();
    const map = new Map<string, { value: number }[]>();
    for (const branch of data.branches) {
      const series = revenueSeries(data, branch.id, 14);
      map.set(branch.id, series.map((p) => ({ value: p.revenue })));
    }
    return map;
  }, [ready, data]);

  const totalBranches = data.branches.length;
  const activeBranches = data.branches.filter((b) => b.active).length;
  const networkRevenue = performance.reduce((sum, p) => sum + p.revenue, 0);
  const networkStockValue = performance.reduce((sum, p) => sum + p.stockValue, 0);

  const comparisonRows: ComparisonRow[] = useMemo(
    () =>
      data.branches.map((branch) => {
        const perf = performanceById.get(branch.id);
        return {
          branch,
          revenue: perf?.revenue ?? 0,
          transactions: perf?.transactions ?? 0,
          profit: perf?.profit ?? 0,
          stockValue: perf?.stockValue ?? 0,
          lowStockCount: lowStockCountByBranch.get(branch.id) ?? 0,
          staffCount: staffCountByBranch.get(branch.id) ?? 0,
        };
      }),
    [data.branches, performanceById, lowStockCountByBranch, staffCountByBranch],
  );

  const handleViewData = (branch: Branch) => {
    setScope(branch.id);
    push({
      title: "Scope switched",
      description: `Now viewing ${branch.name} across the app.`,
      tone: "info",
    });
    router.push("/demo/pos");
  };

  const columns: DataTableColumn<ComparisonRow>[] = [
    {
      key: "branch",
      header: "Branch",
      sortable: true,
      sortValue: (row) => row.branch.name,
      render: (row) => (
        <div className="flex items-center gap-2">
          <span className="min-w-0 truncate font-medium text-pos-heading">{row.branch.name}</span>
          <Badge tone="neutral" className="shrink-0">
            {row.branch.code}
          </Badge>
          {row.branch.isMain ? (
            <Badge tone="brand" className="shrink-0">
              Main
            </Badge>
          ) : null}
          {!row.branch.active ? (
            <Badge tone="neutral" className="shrink-0">
              Inactive
            </Badge>
          ) : null}
        </div>
      ),
    },
    {
      key: "revenue",
      header: "Revenue (30d)",
      align: "right",
      sortable: true,
      sortValue: (row) => row.revenue,
      render: (row) => money(row.revenue, data.settings.currencySymbol, { compact: true }),
    },
    {
      key: "transactions",
      header: "Transactions",
      align: "right",
      sortable: true,
      sortValue: (row) => row.transactions,
      render: (row) => fmtNumber(row.transactions),
    },
    {
      key: "profit",
      header: "Profit (30d)",
      align: "right",
      sortable: true,
      sortValue: (row) => row.profit,
      render: (row) => money(row.profit, data.settings.currencySymbol, { compact: true }),
    },
    {
      key: "stockValue",
      header: "Stock value",
      align: "right",
      sortable: true,
      sortValue: (row) => row.stockValue,
      render: (row) => money(row.stockValue, data.settings.currencySymbol, { compact: true }),
    },
    {
      key: "lowStockCount",
      header: "Low stock",
      align: "right",
      sortable: true,
      sortValue: (row) => row.lowStockCount,
      render: (row) => (
        <span className={row.lowStockCount > 0 ? "font-medium text-pos-warn" : "text-pos-muted"}>
          {row.lowStockCount}
        </span>
      ),
    },
    {
      key: "staffCount",
      header: "Staff",
      align: "right",
      sortable: true,
      sortValue: (row) => row.staffCount,
      render: (row) => fmtNumber(row.staffCount),
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
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-80" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Branches"
        subtitle="Manage every MediPlus Pharmacy location from one place."
        actions={
          canCreateBranch ? (
            <Button icon={Plus} onClick={() => setAddOpen(true)}>
              Add branch
            </Button>
          ) : undefined
        }
      />

      {/* Network tiles */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card padded className="p-5">
          <div className="flex items-start justify-between">
            <div className="rounded-xl bg-pos-brand-soft p-2.5 text-pos-brand-dark">
              <Building2 size={18} />
            </div>
          </div>
          <p className="mt-4 text-2xl font-semibold tracking-tight text-pos-heading">
            {totalBranches}
          </p>
          <p className="mt-1 text-sm text-pos-muted">Total branches</p>
        </Card>
        <Card padded className="p-5">
          <div className="flex items-start justify-between">
            <div className="rounded-xl bg-pos-ok-soft p-2.5 text-pos-ok">
              <CheckCircle2 size={18} />
            </div>
          </div>
          <p className="mt-4 text-2xl font-semibold tracking-tight text-pos-heading">
            {activeBranches}
          </p>
          <p className="mt-1 text-sm text-pos-muted">Active branches</p>
        </Card>
        <Card padded className="p-5">
          <div className="flex items-start justify-between">
            <div className="rounded-xl bg-pos-accent-soft p-2.5 text-pos-accent">
              <Wallet size={18} />
            </div>
          </div>
          <p className="mt-4 text-2xl font-semibold tracking-tight text-pos-heading">
            {money(networkRevenue, data.settings.currencySymbol, { compact: true })}
          </p>
          <p className="mt-1 text-sm text-pos-muted">Network revenue (30d)</p>
        </Card>
        <Card padded className="p-5">
          <div className="flex items-start justify-between">
            <div className="rounded-xl bg-pos-warn-soft p-2.5 text-pos-warn">
              <Wallet2 size={18} />
            </div>
          </div>
          <p className="mt-4 text-2xl font-semibold tracking-tight text-pos-heading">
            {money(networkStockValue, data.settings.currencySymbol, { compact: true })}
          </p>
          <p className="mt-1 text-sm text-pos-muted">Total network stock value</p>
        </Card>
      </div>

      {/* Branch grid */}
      <div className="mt-6">
        {data.branches.length === 0 ? (
          <Card>
            <EmptyState
              icon={Building2}
              title="No branches yet"
              description="Add your first branch to start building the network."
              action={
                canCreateBranch ? (
                  <Button icon={Plus} onClick={() => setAddOpen(true)}>
                    Add branch
                  </Button>
                ) : undefined
              }
            />
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {data.branches.map((branch) => (
              <BranchCard
                key={branch.id}
                branch={branch}
                performance={performanceById.get(branch.id)}
                staffCount={staffCountByBranch.get(branch.id) ?? 0}
                sparklineData={sparklineByBranch.get(branch.id) ?? []}
                currencySymbol={data.settings.currencySymbol}
                onViewData={() => handleViewData(branch)}
                onManage={() => setManageBranch(branch)}
                canManage={canEditBranch}
              />
            ))}
          </div>
        )}
      </div>

      {/* Comparison table */}
      <div className="mt-6">
        <Card>
          <CardHeader
            title="Branch comparison"
            subtitle="Ranked by revenue over the last 30 days — click a column to sort."
          />
          <DataTable
            columns={columns}
            rows={comparisonRows}
            keyOf={(row) => row.branch.id}
            pageSize={10}
          />
        </Card>
      </div>

      <BranchModal open={addOpen && canCreateBranch} onClose={() => setAddOpen(false)} mode="add" />
      <BranchModal
        open={!!manageBranch && canEditBranch}
        onClose={() => setManageBranch(null)}
        mode="manage"
        branch={manageBranch}
      />
    </div>
  );
}

export default function BranchesPage() {
  return (
    <RequireCapability capability="view:branches">
      <BranchesPageInner />
    </RequireCapability>
  );
}
