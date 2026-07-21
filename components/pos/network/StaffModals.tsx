"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle } from "lucide-react";
import { usePos } from "@/lib/pos/store";
import { money, initials, timeAgo } from "@/lib/pos/format";
import type { Staff, StaffRole } from "@/lib/pos/types";
import { can, assignableRoles, assignableBranchIds } from "@/lib/pos/permissions";
import { Badge, Button, Input, Modal, Select, cn, useToast, type Tone } from "@/components/pos/ui";

export const ROLE_TONE: Record<StaffRole, Tone> = {
  Administrator: "violet",
  "Branch Manager": "accent",
  Pharmacist: "brand",
  Cashier: "warn",
};

/* ------------------------------------------------------------------ */
/* Add staff modal                                                     */
/* ------------------------------------------------------------------ */

interface AddForm {
  name: string;
  email: string;
  phone: string;
  role: StaffRole;
  branchId: string;
  active: boolean;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function AddStaffModal({
  open,
  onClose,
  defaultBranchId,
}: {
  open: boolean;
  onClose: () => void;
  defaultBranchId?: string;
}) {
  const { data, addStaff, currentUser } = usePos();
  const { push } = useToast();
  const mainBranch = data.branches.find((b) => b.isMain);

  const canManage = can(currentUser, "staff:manage");
  const canManageAdmins = can(currentUser, "staff:manageAdmins");
  const allowedRoles = useMemo(() => assignableRoles(currentUser), [currentUser]);
  const allBranchIds = useMemo(() => data.branches.map((b) => b.id), [data.branches]);
  const allowedBranchIds = useMemo(
    () => assignableBranchIds(currentUser, allBranchIds),
    [currentUser, allBranchIds],
  );
  const lockedBranchId = allowedBranchIds.length === 1 ? allowedBranchIds[0] : undefined;
  const lockedBranch = data.branches.find((b) => b.id === lockedBranchId);

  const initialState = (): AddForm => ({
    name: "",
    email: "",
    phone: "",
    role: allowedRoles[0] ?? "Cashier",
    branchId: lockedBranchId ?? defaultBranchId ?? mainBranch?.id ?? "",
    active: true,
  });

  const [form, setForm] = useState<AddForm>(initialState);
  const [errors, setErrors] = useState<Partial<Record<keyof AddForm, string>>>({});

  useEffect(() => {
    if (!open) return;
    setForm(initialState());
    setErrors({});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, defaultBranchId, mainBranch?.id, lockedBranchId]);

  const setField = <K extends keyof AddForm>(key: K, value: AddForm[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManage) return;
    const next: typeof errors = {};
    if (!form.name.trim()) next.name = "Full name is required.";
    if (!form.email.trim()) {
      next.email = "Email is required.";
    } else if (!EMAIL_RE.test(form.email.trim())) {
      next.email = "Enter a valid email address.";
    } else if (data.staff.some((s) => s.email.toLowerCase() === form.email.trim().toLowerCase())) {
      next.email = "A staff member already uses this email.";
    }
    if (!form.phone.trim()) next.phone = "Phone number is required.";
    if (!form.branchId) next.branchId = "Choose a branch.";
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    // Defensive clamp — the selects only ever offer allowed values, but a
    // Branch Manager must never be able to smuggle through an Administrator
    // role or a foreign branch id.
    const safeRole = allowedRoles.includes(form.role) ? form.role : allowedRoles[0];
    const safeBranchId = lockedBranchId ?? (allowedBranchIds.includes(form.branchId) ? form.branchId : "");
    if (!safeRole || !safeBranchId) return;

    const staff: Staff = {
      id: `stf-${Math.random().toString(36).slice(2, 9)}`,
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      role: safeRole,
      branchId: safeBranchId,
      active: form.active,
      lastActive: new Date().toISOString(),
    };
    addStaff(staff);
    push({ title: "Staff member added", description: `${staff.name} joined ${data.branches.find((b) => b.id === staff.branchId)?.name ?? ""}.`, tone: "success" });
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add staff member"
      subtitle="Give someone access to the till or back office."
      size="md"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={!canManage}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!canManage}>
            Add staff member
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Full name"
          value={form.name}
          onChange={(e) => setField("name", e.target.value)}
          error={errors.name}
        />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Email"
            type="email"
            value={form.email}
            onChange={(e) => setField("email", e.target.value)}
            error={errors.email}
          />
          <Input
            label="Phone"
            value={form.phone}
            onChange={(e) => setField("phone", e.target.value)}
            error={errors.phone}
          />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Select
            label="Role"
            value={form.role}
            onChange={(e) => setField("role", e.target.value as StaffRole)}
            hint={
              !canManageAdmins
                ? "You can add Pharmacists and Cashiers only — Administrators and Branch Managers are set up by HQ."
                : undefined
            }
          >
            {allowedRoles.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </Select>
          {lockedBranchId ? (
            <Input
              label="Branch"
              value={lockedBranch?.name ?? ""}
              disabled
              hint="New staff join your branch automatically."
            />
          ) : (
            <Select
              label="Branch"
              value={form.branchId}
              onChange={(e) => setField("branchId", e.target.value)}
              error={errors.branchId}
            >
              <option value="">Select branch</option>
              {data.branches
                .filter((b) => allowedBranchIds.includes(b.id))
                .map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
            </Select>
          )}
        </div>
        <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-pos-border p-3.5">
          <span>
            <span className="block text-sm font-medium text-pos-heading">Active</span>
            <span className="block text-xs text-pos-muted">Inactive staff cannot sign in to the till.</span>
          </span>
          <input
            type="checkbox"
            checked={form.active}
            onChange={(e) => setField("active", e.target.checked)}
            className="h-5 w-9 shrink-0 cursor-pointer appearance-none rounded-full bg-pos-border transition-colors checked:bg-pos-brand relative before:absolute before:left-0.5 before:top-0.5 before:h-4 before:w-4 before:rounded-full before:bg-white before:transition-transform checked:before:translate-x-4"
          />
        </label>
      </form>
    </Modal>
  );
}

/* ------------------------------------------------------------------ */
/* Staff detail / edit modal                                           */
/* ------------------------------------------------------------------ */

export function StaffDetailModal({
  open,
  onClose,
  staff,
}: {
  open: boolean;
  onClose: () => void;
  staff: Staff | null;
}) {
  const { data, updateStaff, currentUser } = usePos();
  const { push } = useToast();

  const [role, setRole] = useState<StaffRole>("Cashier");
  const [branchId, setBranchId] = useState("");
  const [active, setActive] = useState(true);

  useEffect(() => {
    if (!staff) return;
    setRole(staff.role);
    setBranchId(staff.branchId);
    setActive(staff.active);
  }, [staff]);

  const stats = useMemo(() => {
    if (!staff) return null;
    if (staff.role !== "Cashier" && staff.role !== "Pharmacist") return null;
    const now = Date.now();
    const sales = data.sales.filter(
      (s) =>
        s.cashierId === staff.id &&
        s.status === "completed" &&
        now - new Date(s.createdAt).getTime() <= 30 * 864e5,
    );
    return {
      transactions: sales.length,
      revenue: sales.reduce((sum, s) => sum + s.total, 0),
    };
  }, [data.sales, staff]);

  if (!staff) return null;

  const branch = data.branches.find((b) => b.id === staff.branchId);

  const isTargetAdmin = staff.role === "Administrator";
  const isSelf = currentUser?.id === staff.id;
  const canManage = can(currentUser, "staff:manage");
  const canManageAdmins = can(currentUser, "staff:manageAdmins");
  // Branch Managers may not touch Administrator accounts at all.
  const canEditThis = canManage && (!isTargetAdmin || canManageAdmins);
  // Nobody — including HQ — deactivates themselves from this dialog.
  const canToggleActive = canEditThis && !isSelf;

  // Plain (non-hook) derivations — `staff` can be null, so these must live
  // after the early return, and therefore can't be useMemo calls.
  const baseAllowedRoles = assignableRoles(currentUser);
  // Keep the staff member's current role selectable even if the actor
  // couldn't newly assign it, so the field never shows an empty select.
  const allowedRoles = baseAllowedRoles.includes(staff.role)
    ? baseAllowedRoles
    : [...baseAllowedRoles, staff.role];
  const allBranchIds = data.branches.map((b) => b.id);
  const allowedBranchIds = assignableBranchIds(currentUser, allBranchIds);
  const lockedBranchId = allowedBranchIds.length === 1 ? allowedBranchIds[0] : undefined;
  const lockedBranch = data.branches.find((b) => b.id === lockedBranchId);

  const handleSave = () => {
    if (!canEditThis) return;
    updateStaff(staff.id, {
      role,
      branchId,
      active: canToggleActive ? active : staff.active,
    });
    push({ title: "Staff member updated", description: `${staff.name}'s profile was saved.`, tone: "success" });
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={staff.name}
      subtitle={staff.email}
      size="md"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
          <Button onClick={handleSave} disabled={!canEditThis}>
            Save changes
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[linear-gradient(135deg,#4C6FFF_0%,#2A46D9_100%)] text-sm font-semibold text-white">
            {initials(staff.name)}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-pos-heading">{staff.name}</p>
            <p className="truncate text-xs text-pos-muted">{staff.phone}</p>
          </div>
          <Badge tone={active ? "ok" : "neutral"} className="ml-auto shrink-0">
            {active ? "Active" : "Inactive"}
          </Badge>
        </div>

        <p className="text-xs text-pos-muted">
          Currently at <span className="font-medium text-pos-heading">{branch?.name}</span> · last active{" "}
          {timeAgo(staff.lastActive)}
        </p>

        {!canEditThis ? (
          <div className="flex items-start gap-2.5 rounded-xl bg-pos-warn-soft px-3.5 py-2.5 text-xs text-pos-warn">
            <AlertTriangle size={15} className="mt-0.5 shrink-0" />
            <p>Branch Managers cannot edit Administrator accounts. This profile is read-only for you.</p>
          </div>
        ) : isSelf ? (
          <div className="flex items-start gap-2.5 rounded-xl bg-pos-warn-soft px-3.5 py-2.5 text-xs text-pos-warn">
            <AlertTriangle size={15} className="mt-0.5 shrink-0" />
            <p>You can't deactivate your own account.</p>
          </div>
        ) : null}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Select
            label="Role"
            value={role}
            onChange={(e) => setRole(e.target.value as StaffRole)}
            disabled={!canEditThis}
          >
            {allowedRoles.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </Select>
          {lockedBranchId ? (
            <Input label="Branch" value={lockedBranch?.name ?? ""} disabled hint="Staff stay at your branch." />
          ) : (
            <Select
              label="Branch"
              value={branchId}
              onChange={(e) => setBranchId(e.target.value)}
              disabled={!canEditThis}
            >
              {data.branches
                .filter((b) => allowedBranchIds.includes(b.id) || b.id === staff.branchId)
                .map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
            </Select>
          )}
        </div>

        <label
          className={cn(
            "flex items-center justify-between gap-3 rounded-xl border border-pos-border p-3.5",
            canToggleActive ? "cursor-pointer" : "cursor-not-allowed opacity-60",
          )}
        >
          <span>
            <span className="block text-sm font-medium text-pos-heading">Active</span>
            <span className="block text-xs text-pos-muted">
              {isSelf ? "You can't deactivate your own account." : "Inactive staff cannot sign in to the till."}
            </span>
          </span>
          <input
            type="checkbox"
            checked={active}
            disabled={!canToggleActive}
            onChange={(e) => setActive(e.target.checked)}
            className="h-5 w-9 shrink-0 cursor-pointer appearance-none rounded-full bg-pos-border transition-colors checked:bg-pos-brand relative before:absolute before:left-0.5 before:top-0.5 before:h-4 before:w-4 before:rounded-full before:bg-white before:transition-transform checked:before:translate-x-4 disabled:cursor-not-allowed"
          />
        </label>

        {stats ? (
          <div className="rounded-xl bg-pos-bg p-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-pos-muted">
              Last 30 days at the till
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-lg font-semibold text-pos-heading">{stats.transactions}</p>
                <p className="text-xs text-pos-muted">Transactions handled</p>
              </div>
              <div>
                <p className="text-lg font-semibold text-pos-heading">
                  {money(stats.revenue, data.settings.currencySymbol, { compact: true })}
                </p>
                <p className="text-xs text-pos-muted">Revenue rung up</p>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </Modal>
  );
}
