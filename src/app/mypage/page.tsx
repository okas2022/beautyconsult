"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronRight, Crown, Sparkles, User } from "lucide-react";
import { PremiumPaywallModal } from "@/features/premium/components/PremiumPaywallModal";
import { usePremiumStore } from "@/features/premium/store/premiumStore";
import { getPatientId } from "@/features/leads/store/leadModalStore";

export default function MyPage() {
  const isPremium = usePremiumStore((s) => s.isPremium);
  const [patientShortId, setPatientShortId] = useState("···");
  const [paywallOpen, setPaywallOpen] = useState(false);

  useEffect(() => {
    setPatientShortId(getPatientId().slice(0, 8));
  }, []);

  return (
    <div className="mx-auto w-full max-w-lg px-4 pt-6 pb-[calc(5.5rem+env(safe-area-inset-bottom))]">
      <div className="mb-8 flex items-center gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-foreground/[0.04]">
          <User className="h-7 w-7 text-muted" strokeWidth={1.5} />
        </div>
        <div>
          <p className="text-lg font-semibold text-foreground">마이페이지</p>
          <p className="text-[11px] text-muted">ID ···{patientShortId}</p>
        </div>
      </div>

      <div className="mb-6 rounded-3xl border border-border/70 bg-surface p-5 shadow-[0_4px_24px_rgba(0,0,0,0.03)]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Crown className={isPremium ? "h-5 w-5 text-mint-dark" : "h-5 w-5 text-muted"} />
            <span className="text-sm font-semibold text-foreground">
              {isPremium ? "Premium 회원" : "일반 회원"}
            </span>
          </div>
          {!isPremium && (
            <button
              type="button"
              onClick={() => setPaywallOpen(true)}
              className="text-xs font-medium text-mint-dark"
            >
              무료 활성화
            </button>
          )}
        </div>
        <p className="mt-2 text-[12px] leading-relaxed text-muted">
          {isPremium
            ? "가상 성형·정밀 리포트를 무제한 이용 중입니다."
            : "Premium으로 가상 성형과 AI 정밀 분석을 이용해 보세요."}
        </p>
      </div>

      <nav className="flex flex-col gap-2">
        {[
          { href: "/chat", label: "AI 상담 내역", desc: "PreFit AI 실장과 대화" },
          { href: "/simulate", label: "가상 성형 시뮬레이터", desc: "Before / After" },
          { href: "/trend", label: "트렌드 라운지", desc: "실시간 Q&A 피드" },
        ].map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center justify-between rounded-2xl border border-border/60 bg-surface px-4 py-4 transition hover:border-border"
          >
            <div>
              <p className="text-sm font-medium text-foreground">{item.label}</p>
              <p className="text-[11px] text-muted">{item.desc}</p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted" />
          </Link>
        ))}
      </nav>

      <p className="mt-8 flex items-center justify-center gap-1.5 text-[10px] text-muted">
        <Sparkles className="h-3 w-3" />
        PreFit · 검증된 전문의 데이터 기반
      </p>

      <PremiumPaywallModal
        isOpen={paywallOpen}
        onClose={() => setPaywallOpen(false)}
        featureName="PreFit Premium"
      />
    </div>
  );
}
