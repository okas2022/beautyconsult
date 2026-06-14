import { PremiumSubscribePanel } from "@/features/premium/components/PremiumSubscribePanel";

export default function PremiumPage() {
  return (
    <div className="mx-auto w-full max-w-lg px-4 pt-5 pb-6">
      <div className="mb-6">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          Premium 멤버십
        </h1>
        <p className="mt-1 text-sm text-muted">
          가상 성형·피부 분석으로 수술 전후를 미리 확인하세요
        </p>
      </div>
      <PremiumSubscribePanel />
    </div>
  );
}
