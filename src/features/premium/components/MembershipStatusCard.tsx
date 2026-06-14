"use client";

import { Crown, Sparkles } from "lucide-react";
import type { MembershipStatus } from "@/features/premium/types/premium.types";
import {
  formatKrw,
  PREMIUM_PLANS,
} from "@/features/premium/constants/plans";
import { cn } from "@/lib/utils";

interface MembershipStatusCardProps {
  membership: MembershipStatus | null;
  isPremium: boolean;
  onUpgrade?: () => void;
  onManage?: () => void;
  className?: string;
}

export function MembershipStatusCard({
  membership,
  isPremium,
  onUpgrade,
  onManage,
  className,
}: MembershipStatusCardProps) {
  const usage = membership?.usage;
  const billing = membership?.billing_cycle ?? "monthly";
  const planLabel = isPremium ? PREMIUM_PLANS[billing].label : null;

  return (
    <div
      className={cn(
        "overflow-hidden rounded-3xl border shadow-[0_4px_24px_rgba(0,0,0,0.03)]",
        isPremium
          ? "border-mint/30 bg-gradient-to-br from-mint/10 via-surface to-lavender/5"
          : "border-border/70 bg-surface",
        className,
      )}
    >
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-xl",
                isPremium
                  ? "bg-gradient-to-br from-mint to-lavender"
                  : "bg-foreground/[0.05]",
              )}
            >
              <Crown
                className={cn(
                  "h-5 w-5",
                  isPremium ? "text-white" : "text-muted",
                )}
              />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">
                {isPremium ? "PreFit Premium" : "Free 멤버십"}
              </p>
              <p className="text-[11px] text-muted">
                {isPremium && planLabel
                  ? `${planLabel} 구독 · ${formatKrw(PREMIUM_PLANS[billing].priceKrw)}/${PREMIUM_PLANS[billing].periodLabel}`
                  : "AI 상담 · 화장품 추천 무료"}
              </p>
            </div>
          </div>
          {!isPremium && onUpgrade && (
            <button
              type="button"
              onClick={onUpgrade}
              className="shrink-0 rounded-full bg-mint px-3 py-1.5 text-[11px] font-semibold text-white"
            >
              업그레이드
            </button>
          )}
        </div>

        {isPremium && membership?.premium_until && (
          <p className="mt-3 text-[11px] text-muted">
            다음 결제일{" "}
            <span className="font-medium text-foreground">
              {new Date(membership.premium_until).toLocaleDateString("ko-KR")}
            </span>
          </p>
        )}

        {!isPremium && usage && usage.simulateLimit !== null && (
          <div className="mt-3 rounded-xl bg-background/80 px-3 py-2.5">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-muted">이번 달 무료 시뮬레이션</span>
              <span className="font-semibold text-foreground">
                {usage.simulateUsed}/{usage.simulateLimit}회
              </span>
            </div>
            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-border">
              <div
                className="h-full rounded-full bg-mint transition-all"
                style={{
                  width: `${Math.min(100, (usage.simulateUsed / usage.simulateLimit) * 100)}%`,
                }}
              />
            </div>
          </div>
        )}

        {isPremium && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {["시뮬 무제한", "피부 리포트", "HD 저장"].map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 rounded-full bg-mint/10 px-2 py-0.5 text-[10px] font-medium text-mint-dark"
              >
                <Sparkles className="h-2.5 w-2.5" />
                {tag}
              </span>
            ))}
          </div>
        )}

        {isPremium && onManage && (
          <button
            type="button"
            onClick={onManage}
            className="mt-3 text-[11px] font-medium text-muted underline-offset-2 hover:text-foreground hover:underline"
          >
            구독 관리
          </button>
        )}
      </div>
    </div>
  );
}
