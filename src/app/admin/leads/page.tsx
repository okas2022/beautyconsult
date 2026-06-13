"use client";

import Link from "next/link";
import { LeadsTable } from "@/features/admin/components/LeadsTable";

export default function AdminLeadsPage() {
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 pb-[calc(5rem+env(safe-area-inset-bottom))]">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">환자 Lead 관리</h1>
          <p className="mt-1 text-sm text-muted">
            CPA/CPL 과금 근거 — AI 상담 후 접수된 예약/상담 신청 목록
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/admin"
            className="rounded-full border border-border px-3 py-1.5 text-xs text-muted hover:text-foreground"
          >
            ← 대시보드
          </Link>
          <Link
            href="/admin/videos"
            className="rounded-full border border-border px-3 py-1.5 text-xs text-muted hover:text-foreground"
          >
            유튜브 RAG →
          </Link>
          <Link
            href="/admin/partnerships"
            className="rounded-full border border-border px-3 py-1.5 text-xs text-muted hover:text-foreground"
          >
            제휴 네트워크 →
          </Link>
        </div>
      </div>
      <LeadsTable />
    </div>
  );
}
