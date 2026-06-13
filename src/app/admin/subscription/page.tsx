"use client";

import { Suspense } from "react";
import { AdminAuthGate } from "@/features/admin/components/AdminAuthGate";
import { SubscriptionPanel } from "@/features/admin/components/SubscriptionPanel";

export default function AdminSubscriptionPage() {
  return (
    <AdminAuthGate
      title="RAG Pro 구독"
      description="병원별 B2B SaaS 구독을 관리합니다."
    >
      {(adminKey) => (
        <div className="mx-auto w-full max-w-3xl px-4 py-8 pb-[calc(5rem+env(safe-area-inset-bottom))]">
          <Suspense fallback={null}>
            <SubscriptionPanel adminKey={adminKey} />
          </Suspense>
        </div>
      )}
    </AdminAuthGate>
  );
}
