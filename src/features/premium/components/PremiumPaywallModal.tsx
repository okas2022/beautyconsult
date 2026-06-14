"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";
import { Crown, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { PlanComparisonTable } from "@/features/premium/components/PlanComparisonTable";
import {
  formatKrw,
  PREMIUM_PLANS,
  PREMIUM_VALUE_PROPS,
  type BillingCycle,
} from "@/features/premium/constants/plans";
import { usePremiumStore } from "@/features/premium/store/premiumStore";
import { cn } from "@/lib/utils";

interface PremiumPaywallModalProps {
  isOpen: boolean;
  onClose: () => void;
  featureName?: string;
  onActivated?: () => void;
}

export function PremiumPaywallModal({
  isOpen,
  onClose,
  featureName = "프리미엄 기능",
  onActivated,
}: PremiumPaywallModalProps) {
  const subscribe = usePremiumStore((s) => s.subscribe);
  const isLoading = usePremiumStore((s) => s.isLoading);
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("monthly");

  const plan = PREMIUM_PLANS[billingCycle];

  const handleSubscribe = async () => {
    const ok = await subscribe(billingCycle);
    if (ok) {
      toast.success("PreFit Premium 구독이 시작되었습니다!", {
        description: `${formatKrw(plan.priceKrw)}/${plan.periodLabel} · 베타 기간 실결제 없음`,
      });
      onClose();
      onActivated?.();
    } else {
      toast.error("구독 처리에 실패했습니다. 다시 시도해 주세요.");
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-x-3 bottom-[calc(4rem+env(safe-area-inset-bottom))] top-auto z-[111] mx-auto max-h-[min(85dvh,640px)] max-w-sm overflow-y-auto md:inset-x-4 md:bottom-auto md:top-[8%]"
          >
            <div className="overflow-hidden rounded-3xl border border-border bg-surface shadow-2xl">
              <div className="relative bg-gradient-to-br from-mint/15 via-lavender/10 to-surface px-5 pb-4 pt-6">
                <button
                  type="button"
                  onClick={onClose}
                  className="absolute right-3 top-3 rounded-full p-1.5 text-muted hover:bg-black/5"
                  aria-label="닫기"
                >
                  <X className="h-5 w-5" />
                </button>
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-mint to-lavender shadow-lg">
                  <Crown className="h-6 w-6 text-white" />
                </div>
                <h2 className="text-center text-lg font-semibold text-foreground">
                  PreFit Premium
                </h2>
                <p className="mt-1 text-center text-[12px] text-muted">
                  {featureName} 포함 · 가상 성형 & 피부 분석
                </p>
              </div>

              <div className="space-y-4 px-5 py-4">
                <div className="flex gap-2 rounded-2xl bg-background p-1">
                  {(["monthly", "annual"] as BillingCycle[]).map((cycle) => {
                    const p = PREMIUM_PLANS[cycle];
                    return (
                      <button
                        key={cycle}
                        type="button"
                        onClick={() => setBillingCycle(cycle)}
                        className={cn(
                          "relative flex-1 rounded-xl py-2.5 text-center transition-all",
                          billingCycle === cycle
                            ? "bg-surface shadow-sm"
                            : "text-muted hover:text-foreground",
                        )}
                      >
                        {p.badge && billingCycle === cycle && (
                          <span className="absolute -top-2 left-1/2 -translate-x-1/2 rounded-full bg-mint px-1.5 py-px text-[8px] font-bold text-white">
                            {p.badge}
                          </span>
                        )}
                        <span className="block text-xs font-semibold">{p.label}</span>
                        <span className="mt-0.5 block text-[10px] text-muted">
                          {formatKrw(p.priceKrw)}/{p.periodLabel}
                        </span>
                        {p.savingsLabel && (
                          <span className="mt-0.5 block text-[9px] font-medium text-mint-dark">
                            {p.savingsLabel}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                <ul className="space-y-2">
                  {PREMIUM_VALUE_PROPS.map((item) => (
                    <li
                      key={item}
                      className="flex items-start gap-2 text-[12px] leading-snug text-foreground"
                    >
                      <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-mint" />
                      {item}
                    </li>
                  ))}
                </ul>

                <PlanComparisonTable compact />

                <p className="text-center text-[10px] leading-relaxed text-muted">
                  베타 기간에는 실제 결제 없이 구독을 체험할 수 있습니다.
                  <br />
                  정식 출시 시 토스페이먼츠로 자동 결제됩니다.
                </p>

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

                <button
                  type="button"
                  onClick={onClose}
                  className="w-full py-1 text-xs text-muted hover:text-foreground"
                >
                  나중에 하기
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
