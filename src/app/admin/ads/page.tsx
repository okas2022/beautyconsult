import { AdsManager } from "@/features/admin/components/AdsManager";

export default function AdminAdsPage() {
  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8 pb-[calc(5rem+env(safe-area-inset-bottom))]">
      <div className="mb-6 flex items-center gap-2">
        <h1 className="text-xl font-semibold tracking-tight">앱 내 광고 관리</h1>
      </div>
      <AdsManager />
    </div>
  );
}
