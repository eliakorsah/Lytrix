// Human-readable labels for each `Capability`, used to render permission
// reference cards straight from `ROLE_CAPABILITIES` instead of hand-authored
// per-role copy that can drift out of sync with the actual access matrix.

import type { Capability } from "@/lib/pos/permissions";

export const CAPABILITY_LABELS: Record<Capability, string> = {
  "view:dashboard": "View dashboard & KPIs",
  "view:reports": "View reports",
  "view:network": "View other branches (network-wide)",
  "view:inventory": "View inventory",
  "view:suppliers": "View suppliers",
  "view:transfers": "View stock transfers",
  "view:staff": "View & manage staff",
  "view:branches": "View & manage branches",
  "view:settings": "View company settings",
  "view:invoices": "View invoices",
  "view:prescriptions": "View prescriptions",
  "view:sales": "View sales / till history",
  sell: "Sell at the till",
  "invoice:create": "Create invoices",
  "invoice:recordPayment": "Record invoice payments",
  "invoice:cancel": "Cancel invoices",
  "stock:adjust": "Adjust stock levels",
  "stock:receive": "Receive stock",
  "transfer:request": "Request stock transfers",
  "transfer:approve": "Approve, dispatch & cancel transfers",
  "branch:create": "Create branches",
  "branch:edit": "Edit branch details",
  "staff:manage": "Add/edit staff at their branch",
  "staff:manageAdmins": "Manage Administrator accounts",
  "settings:edit": "Edit company settings",
  "demo:reset": "Reset demo data",
};
