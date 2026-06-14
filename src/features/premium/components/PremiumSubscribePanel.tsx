"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Crown, Loader2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { MembershipStatusCard } from "@/features/premium/components/MembershipStatusCard";
import { PlanComparisonTable } from "@/features/premium/components/PlanComparisonTable";
import {
  formatKrw,
  PREMIUM_PLANS,
  PREMIUM_VALUE_PROPS,
  type BillingCycle,
} from "@/features/premium/constants/plans";
import { usePremiumStore } from "@/features/premium/store/premiumStore";
import { cn } from "@/lib/utils";

export function PremiumSubscribePanel() {
  const membership = usePremiumStore((s) => s.membership);
  const isPremium = usePremiumStore((s) => s.isPremium);
  const isLoading = usePremiumStore((s) => s.isLoading);
  const subscribe = usePremiumStore((s) => s.subscribe);
  const cancel = usePremiumStore((s) => s.cancel);
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("monthly");

  const plan = PREMIUM_PLANS[billingCycle];

  const handleSubscribe = async () => {
    const ok = await subscribe(billingCycle);
    if (ok) {
      toast.success("Premium 구독이 활성화되었습니다!");
    } else {
      toast.error("구독 처리에 실패했습니다.");
    }
  };

  const handleCancel = async () => {
    if (!confirm("Premium 구독을 해지하시겠습니까?")) return;
    const ok = await cancel();
    if (ok) toast.success("구독이 해지되었습니다.");
    else toast.error("해지 처리에 실패했습니다.");
  };

  if (isPremium) {
    return (
      <div className="space-y-6">
        <MembershipStatusCard
          membership={membership}
          isPremium
          onManage={() => void handleCancel()}
        />
        <div className="rounded-2xl border border-border/60 bg-surface p-4">
          <h3 className="mb-3 text-sm font-semibold text-foreground">
            Premium 혜택 이용 중
          </h3>
          <ul className="space-y-2">
            {PREMIUM_VALUE_PROPS.map((item) => (
              <li key={item} className="text-[12px] text-muted">
                ✓ {item}
              </li>
            ))}
          </ul>
          <Link
            href="/simulate"
            className="mt-4 flex w-full items-center justify-center rounded-xl bg-mint py-3 text-sm font-semibold text-white"
          >
            가상 성형 시뮬레이터 바로가기
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <MembershipStatusCard membership={membership} isPremium={false} />

      <div className="overflow-hidden rounded-3xl border border-mint/20 bg-gradient-to-br from-mint/5 to-lavender/5 p-5">
        <div className="mb-4 flex items-center gap-2">
          <Crown className="h-5 w-5 text-mint-dark" />
          <h2 className="text-base font-semibold text-foreground">
            PreFit Premium
          </h2>
        </div>

        <div className="mb-4 flex gap-2 rounded-2xl bg-background/80 p-1">
          {(["monthly", "annual"] as BillingCycle[]).map((cycle) => {
            const p = PREMIUM_PLANS[cycle];
            return (
              <button
                key={cycle}
                type="button"
                onClick={() => setBillingCycle(cycle)}
                className={cn(
                  "flex-1 rounded-xl py-3 text-center transition-all",
                  billingCycle === cycle
                    ? "bg-surface shadow-sm ring-1 ring-mint/20"
                    : "text-muted",
                )}
              >
                <span className="block text-sm font-semibold">{p.label}</span>
                <span className="mt-0.5 block text-lg font-bold text-foreground">
                  {formatKrw(p.priceKrw)}
                </span>
                <span className="text-[10px] text-muted">/ {p.periodLabel}</span>
                {p.monthlyEquivalentKrw && (
                  <span className="mt-1 block text-[10px] text-mint-dark">
                    월 {formatKrw(p.monthlyEquivalentKrw)}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <PlanComparisonTable className="mb-4 bg-surface/80" />

        <Button
          variant="primary"
          size="lg"
          className="w-full"
          disabled={isLoading}
          onClick={() => void handleSubscribe()}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              처리 중...
            </>
          ) : (
            `${formatKrw(plan.priceKrw)}으로 Premium 시작`
          )}
        </Button>

        <p className="mt-3 text-center text-[10px] leading-relaxed text-muted">
          AI 상담·화장품 추천은 Free에서도 무료입니다.
          <br />
          Premium은 가상 성형·피부 리포트 확장 기능입니다.
        </p>
      </div>

      <div className="rounded-2xl border border-border/60 bg-surface p-4">
        <h3 className="mb-2 text-sm font-semibold text-foreground">
          PreFit 수익 모델
        </h3>
        <p className="text-[12px] leading-relaxed text-muted">
          <span className="font-medium text-foreground">화장품·뷰티 기기</span>
          추천은 제휴 광고 수익으로 운영되며, AI 상담 중 증상에 맞는 제품이
          표시됩니다 (광고 표시). Premium 구독은{" "}
          <span className="font-medium text-foreground">가상 성형·피부 분석</span>
          전용입니다.
        </p>
      </div>
    </div>
  );
}
