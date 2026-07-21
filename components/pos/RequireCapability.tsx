"use client";

// Belt-and-braces access control for a page: `Sidebar` already hides the nav
// link for a capability the user lacks, but a hidden link is not access
// control — someone can still type the URL. Wrap a page's content in this so
// the page itself refuses to render for the wrong role.

import Link from "next/link";
import { ArrowLeft, Lock } from "lucide-react";
import { usePos } from "@/lib/pos/store";
import { can, ROLE_CAPABILITIES, type Capability } from "@/lib/pos/permissions";
import type { StaffRole } from "@/lib/pos/types";
import { Button, EmptyState } from "./ui";

const ROLE_ORDER: StaffRole[] = ["Administrator", "Branch Manager", "Pharmacist", "Cashier"];

/** Plain-English "who can do this" line for the denial screen. */
function rolesThatCan(capability: Capability): string {
  const roles = ROLE_ORDER.filter((role) => ROLE_CAPABILITIES[role].includes(capability));
  if (roles.length === 0) return "No role currently has access to this.";
  if (roles.length === 1) return `Only the ${roles[0]} role has access to this.`;
  const last = roles[roles.length - 1];
  const rest = roles.slice(0, -1);
  return `Requires the ${rest.join(", ")} or ${last} role.`;
}

export interface RequireCapabilityProps {
  capability: Capability;
  children: React.ReactNode;
}

export function RequireCapability({ capability, children }: RequireCapabilityProps) {
  const { ready, currentUser } = usePos();

  if (!ready) return null;

  if (can(currentUser, capability)) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4 py-10">
      <div className="w-full max-w-md rounded-2xl bg-pos-surface p-8 text-center shadow-card">
        <EmptyState
          icon={Lock}
          title="You don't have access to this page"
          description={
            currentUser
              ? `Your role, ${currentUser.role}, doesn't include this capability. ${rolesThatCan(capability)}`
              : "Sign in with an account that has this capability."
          }
        />
        <Link href="/demo/pos" className="mt-2 inline-block">
          <Button variant="secondary" icon={ArrowLeft}>
            Back to Dashboard
          </Button>
        </Link>
      </div>
    </div>
  );
}
