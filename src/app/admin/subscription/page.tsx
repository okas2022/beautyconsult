"use client";

import { Suspense } from "react";
import { SubscriptionPanel } from "@/features/admin/components/SubscriptionPanel";

export default function AdminSubscriptionPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 pb-[calc(5rem+env(safe-area-inset-bottom))]">
      <Suspense fallback={null}>
        <SubscriptionPanel />
      </Suspense>
    </div>
  );
}
