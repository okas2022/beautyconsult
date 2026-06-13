"use client";

import { AdminAuthGate } from "@/features/admin/components/AdminAuthGate";
import { PartnershipsPanel } from "@/features/admin/components/PartnershipsPanel";

export default function AdminPartnershipsPage() {
  return (
    <AdminAuthGate
      title="제휴 병원 네트워크"
      description="CPA/CPL 리퍼럴 대상 병원 · 카테고리별 리드 현황"
    >
      {(adminKey) => <PartnershipsPanel adminKey={adminKey} />}
    </AdminAuthGate>
  );
}
