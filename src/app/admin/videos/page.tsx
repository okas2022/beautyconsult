"use client";

import { Suspense } from "react";
import { VideosManager } from "@/features/admin/components/VideosManager";

export default function AdminVideosPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 pb-[calc(5rem+env(safe-area-inset-bottom))]">
      <Suspense fallback={null}>
        <VideosManager />
      </Suspense>
    </div>
  );
}
