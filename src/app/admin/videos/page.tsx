"use client";

import { AdminAuthGate } from "@/features/admin/components/AdminAuthGate";
import { VideosManager } from "@/features/admin/components/VideosManager";

export default function AdminVideosPage() {
  return (
    <AdminAuthGate
      title="병원 관리자"
      description="유튜브 RAG 구독 영상을 등록·관리합니다."
    >
      {(adminKey) => (
        <div className="mx-auto w-full max-w-3xl px-4 py-8 pb-[calc(5rem+env(safe-area-inset-bottom))]">
          <VideosManager adminKey={adminKey} />
        </div>
      )}
    </AdminAuthGate>
  );
}
