"use client";

import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";
import { Crown, Loader2, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { usePremiumStore } from "@/features/premium/store/premiumStore";

interface PremiumPaywallModalProps {
  isOpen: boolean;
  onClose: () => void;
  featureName?: string;
  /** 무료 활성화 직후 재시도 등 */
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

  const handleSubscribe = async () => {
    const ok = await subscribe();
    if (ok) {
      toast.success("Premium 멤버십이 활성화되었습니다!");
      onClose();
      onActivated?.();
    } else {
      toast.error("결제 처리에 실패했습니다. 다시 시도해 주세요.");
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
            className="fixed inset-x-4 top-[15%] z-[111] mx-auto max-w-sm"
          >
            <div className="overflow-hidden rounded-3xl border border-border bg-surface shadow-2xl">
              <div className="relative bg-gradient-to-br from-mint/20 via-lavender/10 to-surface px-6 pb-6 pt-8 text-center">
                <button
                  type="button"
                  onClick={onClose}
                  className="absolute right-4 top-4 rounded-full p-1 text-muted hover:bg-black/5"
                  aria-label="닫기"
                >
                  <X className="h-5 w-5" />
                </button>
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-mint to-lavender shadow-lg">
                  <Crown className="h-7 w-7 text-white" />
                </div>
                <h2 className="text-lg font-semibold text-foreground">
                  PreFit Premium
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-muted">
                  월 <span className="font-bold text-foreground">4,900원</span>
                  상당의 기능을
                  <br />
                  지금 <span className="font-bold text-mint-dark">무료</span>로
                  이용해 보세요
                </p>
              </div>

              <div className="space-y-3 px-6 py-5">
                {[
                  "3D 가상 성형 시뮬레이션 무제한",
                  "AI 피부 정밀 리포트 발급",
                  "고급 Stable Diffusion 합성",
                ].map((item) => (
                  <div key={item} className="flex items-center gap-2 text-sm text-foreground">
                    <Sparkles className="h-4 w-4 shrink-0 text-mint-dark" />
                    {item}
                  </div>
                ))}

                <p className="text-center text-[11px] text-muted">
                  {featureName}은 Premium 회원 전용입니다
                </p>

                <Button
                  variant="primary"
                  size="lg"
                  className="mt-2 w-full"
                  disabled={isLoading}
                  onClick={() => void handleSubscribe()}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      처리 중...
                    </>
                  ) : (
                    "프리미엄 무료 활성화"
                  )}
                </Button>

                <button
                  type="button"
                  onClick={onClose}
                  className="w-full py-2 text-xs text-muted hover:text-foreground"
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
