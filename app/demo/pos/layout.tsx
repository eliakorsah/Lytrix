import type { Metadata } from "next";
import { PosProvider } from "@/lib/pos/store";
import { PosShell } from "@/components/pos/PosShell";

export const metadata: Metadata = {
  title: "MediPlus POS — Lytrix Consult",
};

export default function PosLayout({ children }: { children: React.ReactNode }) {
  return (
    // `font-pos` (Inter) applies to the whole POS app without touching the
    // marketing site's Poppins/Open Sans branding.
    <div className="font-pos">
      <PosProvider>
        <PosShell>{children}</PosShell>
      </PosProvider>
    </div>
  );
}
