"use client";

import { PartnershipsPanel } from "@/features/admin/components/PartnershipsPanel";

export default function AdminPartnershipsPage() {
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 pb-[calc(5rem+env(safe-area-inset-bottom))]">
      <PartnershipsPanel />
    </div>
  );
}
