"use client";

import Link from "next/link";
import { AdminAuthGate } from "@/features/admin/components/AdminAuthGate";
import { LeadsTable } from "@/features/admin/components/LeadsTable";

export default function AdminLeadsPage() {
  return (
    <AdminAuthGate
      title="병원 관리자"
      description="Lead 관리 대시보드에 접근하려면 관리자 키를 입력하세요."
    >
      {(adminKey) => (
        <div className="mx-auto w-full max-w-5xl px-4 py-8 pb-[calc(5rem+env(safe-area-inset-bottom))]">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-xl font-semibold tracking-tight">환자 Lead 관리</h1>
              <p className="mt-1 text-sm text-muted">
                CPA/CPL 과금 근거 — AI 상담 후 접수된 예약/상담 신청 목록
              </p>
            </div>
            <Link
              href="/admin/videos"
              className="rounded-full border border-border px-3 py-1.5 text-xs text-muted hover:text-foreground"
            >
              유튜브 RAG →
            </Link>
          </div>
          <LeadsTable adminKey={adminKey} />
        </div>
      )}
    </AdminAuthGate>
  );
}
