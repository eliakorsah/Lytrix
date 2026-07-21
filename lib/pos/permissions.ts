// Role-based access control for the POS demo.
//
// One matrix drives everything: which nav items render, which pages are
// reachable, which buttons appear, and whether a user may look at branches
// other than their own. Adding a capability here is the only change needed to
// gate a new feature.

import type { Staff, StaffRole, BranchScope } from "./types";

export type Capability =
  // Visibility
  | "view:dashboard"
  | "view:reports"
  | "view:network" // see data for branches other than your own
  | "view:inventory"
  | "view:suppliers"
  | "view:transfers"
  | "view:staff"
  | "view:branches"
  | "view:settings"
  | "view:invoices"
  | "view:prescriptions"
  | "view:sales"
  // Actions
  | "sell"
  | "invoice:create"
  | "invoice:recordPayment"
  | "invoice:cancel"
  | "stock:adjust"
  | "stock:receive"
  | "transfer:request"
  | "transfer:approve" // HQ-level: approve, dispatch, cancel
  | "branch:create"
  | "branch:edit"
  | "staff:manage" // add/edit staff — scoped to your branch unless you have view:network
  | "staff:manageAdmins"
  | "settings:edit"
  | "demo:reset";

const ALL: Capability[] = [
  "view:dashboard",
  "view:reports",
  "view:network",
  "view:inventory",
  "view:suppliers",
  "view:transfers",
  "view:staff",
  "view:branches",
  "view:settings",
  "view:invoices",
  "view:prescriptions",
  "view:sales",
  "sell",
  "invoice:create",
  "invoice:recordPayment",
  "invoice:cancel",
  "stock:adjust",
  "stock:receive",
  "transfer:request",
  "transfer:approve",
  "branch:create",
  "branch:edit",
  "staff:manage",
  "staff:manageAdmins",
  "settings:edit",
  "demo:reset",
];

export const ROLE_CAPABILITIES: Record<StaffRole, Capability[]> = {
  // HQ. Sees the whole network, approves transfers, owns settings.
  Administrator: ALL,

  // Runs one branch end to end, but cannot see other branches or change
  // company-wide settings, and cannot approve their own transfer requests.
  "Branch Manager": [
    "view:dashboard",
    "view:reports",
    "view:inventory",
    "view:suppliers",
    "view:transfers",
    "view:staff",
    "view:invoices",
    "view:prescriptions",
    "view:sales",
    "sell",
    "invoice:create",
    "invoice:recordPayment",
    "invoice:cancel",
    "stock:adjust",
    "stock:receive",
    "transfer:request",
    "staff:manage",
  ],

  // Dispenses, handles stock on the floor, raises invoices.
  Pharmacist: [
    "view:dashboard",
    "view:inventory",
    "view:transfers",
    "view:invoices",
    "view:prescriptions",
    "view:sales",
    "sell",
    "invoice:create",
    "stock:adjust",
    "stock:receive",
    "transfer:request",
  ],

  // Till only.
  Cashier: ["view:dashboard", "view:sales", "view:invoices", "sell", "view:inventory"],
};

export function can(user: Staff | null, capability: Capability): boolean {
  if (!user) return false;
  return ROLE_CAPABILITIES[user.role].includes(capability);
}

/** True when the user may look beyond their own branch. */
export const isNetworkUser = (user: Staff | null) => can(user, "view:network");

/**
 * The scope a user is allowed to view.
 *
 * Network users keep whatever scope they selected. Everyone else is pinned to
 * their own branch — this is what stops a cashier at Tema from reading Kumasi's
 * numbers, and it is enforced in the store, not just in the UI.
 */
export function enforceScope(user: Staff | null, requested: BranchScope): BranchScope {
  if (!user) return requested;
  if (isNetworkUser(user)) return requested;
  return user.branchId;
}

/** Roles a given user is allowed to assign when creating staff. */
export function assignableRoles(user: Staff | null): StaffRole[] {
  if (!user) return [];
  if (can(user, "staff:manageAdmins")) {
    return ["Administrator", "Branch Manager", "Pharmacist", "Cashier"];
  }
  if (can(user, "staff:manage")) return ["Pharmacist", "Cashier"];
  return [];
}

/** Branches a user may assign staff to, or file records against. */
export function assignableBranchIds(user: Staff | null, allBranchIds: string[]): string[] {
  if (!user) return [];
  return isNetworkUser(user) ? allBranchIds : [user.branchId];
}

export const ROLE_SUMMARY: Record<StaffRole, string> = {
  Administrator:
    "Full network access. Sees every branch, approves stock transfers, manages branches, staff and company settings.",
  "Branch Manager":
    "Runs a single branch. Full control of that branch's stock, staff, invoices and reporting. Cannot view other branches or change company settings.",
  Pharmacist:
    "Dispenses medicines at one branch. Sells, raises invoices, adjusts and receives stock, requests transfers.",
  Cashier:
    "Operates the till at one branch. Processes sales and looks up products and past receipts.",
};
