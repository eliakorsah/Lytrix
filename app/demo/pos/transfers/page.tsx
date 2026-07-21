"use client";

import { useMemo, useState } from "react";
import { ArrowDownLeft, ArrowRight, ArrowUpRight, Boxes, Clock3, PackageCheck, Plus, Truck } from "lucide-react";
import { usePos } from "@/lib/pos/store";
import { number as fmtNumber } from "@/lib/pos/format";
import { can, isNetworkUser } from "@/lib/pos/permissions";
import type { Transfer, TransferStatus } from "@/lib/pos/types";
import {
  Badge,
  Button,
  Card,
  DataTable,
  type DataTableColumn,
  PageHeader,
  Select,
  Skeleton,
  cn,
} from "@/components/pos/ui";
import {
  TRANSFER_STATUS_LABEL,
  TRANSFER_STATUS_TONE,
  TransferDetailModal,
} from "@/components/pos/network/TransferDetailModal";
import { NewTransferModal } from "@/components/pos/network/NewTransferModal";
import { RequireCapability } from "@/components/pos/RequireCapability";

type TabKey = "all" | TransferStatus;

const TABS: { key: TabKey; label: string }[] = [
  { key: "all", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "in-transit", label: "In-transit" },
  { key: "received", label: "Received" },
  { key: "cancelled", label: "Cancelled" },
];

interface Row {
  transfer: Transfer;
  fromCode: string;
  toCode: string;
  direction: "incoming" | "outgoing" | null;
}

function TransfersPageInner() {
  const { data, ready, scope, currentUser } = usePos();
  const [tab, setTab] = useState<TabKey>("all");
  const [branchFilter, setBranchFilter] = useState("all");
  const [selected, setSelected] = useState<Transfer | null>(null);
  const [newOpen, setNewOpen] = useState(false);

  const isApprover = can(currentUser, "transfer:approve");
  const canRequest = can(currentUser, "transfer:request");
  const networkUser = isNetworkUser(currentUser);

  const branchCode = useMemo(() => new Map(data.branches.map((b) => [b.id, b.code])), [data.branches]);

  const branchScopedTransfers = useMemo(() => {
    return data.transfers.filter((t) => {
      if (scope !== "all") {
        return t.fromBranchId === scope || t.toBranchId === scope;
      }
      if (branchFilter !== "all") {
        return t.fromBranchId === branchFilter || t.toBranchId === branchFilter;
      }
      return true;
    });
  }, [data.transfers, scope, branchFilter]);

  const counts = useMemo(() => {
    const c: Record<TabKey, number> = {
      all: branchScopedTransfers.length,
      pending: 0,
      "in-transit": 0,
      received: 0,
      cancelled: 0,
    };
    for (const t of branchScopedTransfers) c[t.status] += 1;
    return c;
  }, [branchScopedTransfers]);

  const rows: Row[] = useMemo(() => {
    return branchScopedTransfers
      .filter((t) => tab === "all" || t.status === tab)
      .map((transfer) => ({
        transfer,
        fromCode: branchCode.get(transfer.fromBranchId) ?? "—",
        toCode: branchCode.get(transfer.toBranchId) ?? "—",
        direction: (scope === "all"
          ? null
          : transfer.toBranchId === scope
            ? "incoming"
            : "outgoing") as "incoming" | "outgoing" | null,
      }))
      .sort((a, b) => b.transfer.createdAt.localeCompare(a.transfer.createdAt));
  }, [branchScopedTransfers, tab, branchCode, scope]);

  // Tiles
  const now = Date.now();
  const pendingCount = branchScopedTransfers.filter((t) => t.status === "pending").length;
  const inTransitCount = branchScopedTransfers.filter((t) => t.status === "in-transit").length;
  const receivedLast30 = branchScopedTransfers.filter(
    (t) => t.status === "received" && now - new Date(t.createdAt).getTime() <= 30 * 864e5,
  ).length;
  const totalUnitsMoved = branchScopedTransfers
    .filter((t) => t.status === "received")
    .reduce((sum, t) => sum + t.lines.reduce((ls, l) => ls + l.quantity, 0), 0);

  const columns: DataTableColumn<Row>[] = [
    {
      key: "reference",
      header: "Reference",
      sortable: true,
      sortValue: (row) => row.transfer.reference,
      render: (row) => (
        <div className="flex items-center gap-2">
          <span className="font-medium text-pos-heading">{row.transfer.reference}</span>
          {row.direction ? (
            <Badge tone={row.direction === "incoming" ? "ok" : "accent"} className="shrink-0">
              {row.direction === "incoming" ? (
                <ArrowDownLeft size={11} />
              ) : (
                <ArrowUpRight size={11} />
              )}
              {row.direction === "incoming" ? "Incoming" : "Outgoing"}
            </Badge>
          ) : null}
        </div>
      ),
    },
    {
      key: "date",
      header: "Date",
      sortable: true,
      sortValue: (row) => row.transfer.createdAt,
      render: (row) => new Date(row.transfer.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }),
    },
    {
      key: "route",
      header: "From → To",
      render: (row) => (
        <span className="inline-flex items-center gap-1.5 font-medium text-pos-heading">
          {row.fromCode}
          <ArrowRight size={13} className="text-pos-muted" />
          {row.toCode}
        </span>
      ),
    },
    {
      key: "items",
      header: "Items",
      align: "right",
      sortValue: (row) => row.transfer.lines.length,
      render: (row) => fmtNumber(row.transfer.lines.length),
    },
    {
      key: "units",
      header: "Units",
      align: "right",
      sortable: true,
      sortValue: (row) => row.transfer.lines.reduce((s, l) => s + l.quantity, 0),
      render: (row) => fmtNumber(row.transfer.lines.reduce((s, l) => s + l.quantity, 0)),
    },
    {
      key: "requestedBy",
      header: "Requested by",
      sortable: true,
      sortValue: (row) => row.transfer.requestedBy,
      render: (row) => row.transfer.requestedBy,
    },
    {
      key: "status",
      header: "Status",
      align: "center",
      sortable: true,
      sortValue: (row) => row.transfer.status,
      render: (row) => (
        <Badge tone={TRANSFER_STATUS_TONE[row.transfer.status]}>
          {TRANSFER_STATUS_LABEL[row.transfer.status]}
        </Badge>
      ),
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
        title="Stock Transfers"
        subtitle={
          networkUser
            ? "Move stock between branches — requested by a branch, approved by Main."
            : "Request stock for your branch — transfer requests are approved and dispatched by the Main Branch."
        }
        actions={
          canRequest ? (
            <Button icon={Plus} onClick={() => setNewOpen(true)}>
              New transfer
            </Button>
          ) : undefined
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card padded className="p-5">
          <div className="rounded-xl bg-pos-warn-soft p-2.5 text-pos-warn w-fit">
            <Clock3 size={18} />
          </div>
          <p className="mt-4 text-2xl font-semibold tracking-tight text-pos-heading">{pendingCount}</p>
          <p className="mt-1 text-sm text-pos-muted">Pending approval</p>
        </Card>
        <Card padded className="p-5">
          <div className="rounded-xl bg-pos-accent-soft p-2.5 text-pos-accent w-fit">
            <Truck size={18} />
          </div>
          <p className="mt-4 text-2xl font-semibold tracking-tight text-pos-heading">{inTransitCount}</p>
          <p className="mt-1 text-sm text-pos-muted">In-transit</p>
        </Card>
        <Card padded className="p-5">
          <div className="rounded-xl bg-pos-ok-soft p-2.5 text-pos-ok w-fit">
            <PackageCheck size={18} />
          </div>
          <p className="mt-4 text-2xl font-semibold tracking-tight text-pos-heading">{receivedLast30}</p>
          <p className="mt-1 text-sm text-pos-muted">Received (30d)</p>
        </Card>
        <Card padded className="p-5">
          <div className="rounded-xl bg-pos-brand-soft p-2.5 text-pos-brand-dark w-fit">
            <Boxes size={18} />
          </div>
          <p className="mt-4 text-2xl font-semibold tracking-tight text-pos-heading">
            {fmtNumber(totalUnitsMoved)}
          </p>
          <p className="mt-1 text-sm text-pos-muted">Total units moved</p>
        </Card>
      </div>

      <Card className="mt-6">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-1.5">
            {TABS.map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => setTab(t.key)}
                className={cn(
                  "rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                  tab === t.key ? "bg-pos-brand text-white" : "bg-pos-bg text-pos-muted hover:text-pos-heading",
                )}
              >
                {t.label} ({counts[t.key]})
              </button>
            ))}
          </div>
          {networkUser ? (
            <Select
              value={branchFilter}
              onChange={(e) => setBranchFilter(e.target.value)}
              containerClassName="w-full sm:w-56"
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
          rows={rows}
          keyOf={(row) => row.transfer.id}
          onRowClick={(row) => setSelected(row.transfer)}
          empty={
            <div className="py-6 text-center text-sm text-pos-muted">
              No transfers match the current filters.
            </div>
          }
        />
      </Card>

      <TransferDetailModal open={!!selected} onClose={() => setSelected(null)} transfer={selected} />
      <NewTransferModal
        open={newOpen && canRequest}
        onClose={() => setNewOpen(false)}
        defaultFromBranchId={isApprover && scope !== "all" ? scope : undefined}
        lockedToBranchId={!isApprover && scope !== "all" ? scope : undefined}
      />
    </div>
  );
}

export default function TransfersPage() {
  return (
    <RequireCapability capability="view:transfers">
      <TransfersPageInner />
    </RequireCapability>
  );
}
