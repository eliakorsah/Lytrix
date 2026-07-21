"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRightCircle, ShieldAlert } from "lucide-react";
import type { Branch } from "@/lib/pos/types";
import { usePos } from "@/lib/pos/store";
import { can } from "@/lib/pos/permissions";
import { Button, Input, Modal, useToast } from "@/components/pos/ui";

export interface BranchModalProps {
  open: boolean;
  onClose: () => void;
  mode: "add" | "manage";
  branch?: Branch | null;
}

interface FormState {
  name: string;
  code: string;
  address: string;
  city: string;
  phone: string;
  manager: string;
  openedAt: string;
  active: boolean;
}

const EMPTY_FORM: FormState = {
  name: "",
  code: "",
  address: "",
  city: "",
  phone: "",
  manager: "",
  openedAt: new Date().toISOString().slice(0, 10),
  active: true,
};

function slugify(input: string) {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function BranchModal({ open, onClose, mode, branch }: BranchModalProps) {
  const { data, addBranch, updateBranch, setScope, currentUser } = usePos();
  const { push } = useToast();
  const router = useRouter();
  const canCreate = can(currentUser, "branch:create");
  const canEdit = can(currentUser, "branch:edit");

  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [switchAfterCreate, setSwitchAfterCreate] = useState(true);

  useEffect(() => {
    if (!open) return;
    if (mode === "manage" && branch) {
      setForm({
        name: branch.name,
        code: branch.code,
        address: branch.address,
        city: branch.city,
        phone: branch.phone,
        manager: branch.manager,
        openedAt: branch.openedAt,
        active: branch.active,
      });
    } else {
      setForm(EMPTY_FORM);
    }
    setErrors({});
    setSwitchAfterCreate(true);
  }, [open, mode, branch]);

  const isMain = mode === "manage" && !!branch?.isMain;

  const otherBranches = useMemo(
    () => data.branches.filter((b) => b.id !== branch?.id),
    [data.branches, branch],
  );

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const validate = (): boolean => {
    const next: Partial<Record<keyof FormState, string>> = {};
    if (!form.name.trim()) next.name = "Branch name is required.";
    if (!form.code.trim()) {
      next.code = "Branch code is required.";
    } else if (
      otherBranches.some((b) => b.code.toLowerCase() === form.code.trim().toLowerCase())
    ) {
      next.code = "This code is already used by another branch.";
    }
    if (!form.address.trim()) next.address = "Address is required.";
    if (!form.city.trim()) next.city = "City is required.";
    if (!form.phone.trim()) next.phone = "Phone number is required.";
    if (!form.manager.trim()) next.manager = "Manager name is required.";
    if (!form.openedAt) next.openedAt = "Opening date is required.";

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === "add" && !canCreate) return;
    if (mode === "manage" && !canEdit) return;
    if (!validate()) return;

    if (mode === "add") {
      const id = `br-${slugify(form.name) || Math.random().toString(36).slice(2, 8)}-${Math.random()
        .toString(36)
        .slice(2, 6)}`;
      const newBranch: Branch = {
        id,
        name: form.name.trim(),
        code: form.code.trim().toUpperCase(),
        isMain: false,
        address: form.address.trim(),
        city: form.city.trim(),
        phone: form.phone.trim(),
        manager: form.manager.trim(),
        openedAt: form.openedAt,
        active: form.active,
      };
      addBranch(newBranch);
      push({
        title: "Branch created",
        description: `${newBranch.name} has been added to the network.`,
        tone: "success",
      });
      if (switchAfterCreate) {
        setScope(newBranch.id);
        push({
          title: "Scope switched",
          description: `You're now viewing ${newBranch.name}.`,
          tone: "info",
        });
        router.push("/demo/pos");
      }
      onClose();
      return;
    }

    if (mode === "manage" && branch) {
      updateBranch(branch.id, {
        name: form.name.trim(),
        code: form.code.trim().toUpperCase(),
        address: form.address.trim(),
        city: form.city.trim(),
        phone: form.phone.trim(),
        manager: form.manager.trim(),
        openedAt: form.openedAt,
        active: isMain ? true : form.active,
      });
      push({
        title: "Branch updated",
        description: `Changes to ${form.name.trim()} were saved.`,
        tone: "success",
      });
      onClose();
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={mode === "add" ? "Add branch" : `Manage ${branch?.name ?? "branch"}`}
      subtitle={
        mode === "add"
          ? "Bring a new branch onto the MediPlus network."
          : "Update branch details or change its status."
      }
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>{mode === "add" ? "Create branch" : "Save changes"}</Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Branch name"
            placeholder="e.g. Cape Coast Central"
            value={form.name}
            onChange={(e) => setField("name", e.target.value)}
            error={errors.name}
          />
          <Input
            label="Branch code"
            placeholder="e.g. CPC-01"
            value={form.code}
            onChange={(e) => setField("code", e.target.value.toUpperCase())}
            error={errors.code}
            hint="Shown on receipts & transfer slips. Must be unique."
          />
        </div>

        <Input
          label="Address"
          placeholder="Street address"
          value={form.address}
          onChange={(e) => setField("address", e.target.value)}
          error={errors.address}
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="City"
            value={form.city}
            onChange={(e) => setField("city", e.target.value)}
            error={errors.city}
          />
          <Input
            label="Phone"
            placeholder="+233 30 000 0000"
            value={form.phone}
            onChange={(e) => setField("phone", e.target.value)}
            error={errors.phone}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Branch manager"
            value={form.manager}
            onChange={(e) => setField("manager", e.target.value)}
            error={errors.manager}
          />
          <Input
            label="Opening date"
            type="date"
            value={form.openedAt}
            onChange={(e) => setField("openedAt", e.target.value)}
            error={errors.openedAt}
          />
        </div>

        <div className="rounded-xl border border-pos-border p-3.5">
          {isMain ? (
            <div className="flex items-start gap-2.5 text-sm text-pos-muted">
              <ShieldAlert size={16} className="mt-0.5 shrink-0 text-pos-warn" />
              <p>
                The <strong className="text-pos-heading">Main Branch</strong> cannot be
                deactivated — it's the consolidated HQ view every other branch reports into.
              </p>
            </div>
          ) : (
            <label className="flex cursor-pointer items-center justify-between gap-3">
              <span>
                <span className="block text-sm font-medium text-pos-heading">
                  Branch is active
                </span>
                <span className="block text-xs text-pos-muted">
                  Inactive branches are hidden from the till and reporting defaults.
                </span>
              </span>
              <input
                type="checkbox"
                checked={form.active}
                onChange={(e) => setField("active", e.target.checked)}
                className="h-5 w-9 shrink-0 cursor-pointer appearance-none rounded-full bg-pos-border transition-colors checked:bg-pos-brand relative before:absolute before:left-0.5 before:top-0.5 before:h-4 before:w-4 before:rounded-full before:bg-white before:transition-transform checked:before:translate-x-4"
              />
            </label>
          )}
        </div>

        {mode === "add" ? (
          <label className="flex cursor-pointer items-center gap-2.5 rounded-xl bg-pos-brand-soft p-3.5 text-sm text-pos-brand-dark">
            <input
              type="checkbox"
              checked={switchAfterCreate}
              onChange={(e) => setSwitchAfterCreate(e.target.checked)}
              className="h-4 w-4 shrink-0 rounded border-pos-border text-pos-brand focus:ring-pos-brand"
            />
            <span className="flex items-center gap-1.5">
              <ArrowRightCircle size={15} className="shrink-0" />
              Switch the app to this branch as soon as it's created
            </span>
          </label>
        ) : null}
      </form>
    </Modal>
  );
}
