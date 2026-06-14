"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronRight, LogOut, Sparkles, User } from "lucide-react";
import { MembershipStatusCard } from "@/features/premium/components/MembershipStatusCard";
import { AdSlot } from "@/features/ads/components/AdSlot";
import { useAuthStore } from "@/features/auth/store/authStore";
import { usePremiumStore } from "@/features/premium/store/premiumStore";
import { toast } from "sonner";

export default function MyPage() {
  const router = useRouter();
  const member = useAuthStore((s) => s.member);
  const mode = useAuthStore((s) => s.mode);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const isPremium = usePremiumStore((s) => s.isPremium);
  const membership = usePremiumStore((s) => s.membership);
  const refreshStatus = usePremiumStore((s) => s.refreshStatus);

  useEffect(() => {
    void refreshStatus();
  }, [refreshStatus]);

  const isMember = mode === "member" && member !== null && !member.is_guest;
  const isGuest = mode === "guest" && member?.is_guest;

  const handleLogout = () => {
    clearAuth();
    toast.success("로그아웃되었습니다.");
    router.push("/");
  };

  const displayName = isMember
    ? member.full_name
    : isGuest
      ? "둘러보기"
      : "게스트";

  return (
    <div className="mx-auto w-full max-w-lg px-4 pt-6 pb-6">
      <div className="mb-6 flex items-center gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-foreground/[0.04]">
          <User className="h-7 w-7 text-muted" strokeWidth={1.5} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-lg font-semibold text-foreground">
            {displayName}
          </p>
          <p className="text-[11px] text-muted">
            {isMember
              ? `휴대폰 ${member.phone_number.replace(/(\d{3})(\d{4})(\d{4})/, "$1-****-$3")}`
              : isGuest
                ? "둘러보기 모드 · 일부 기능 제한"
                : "로그인하면 내 정보를 확인할 수 있습니다"}
          </p>
        </div>
      </div>

      {!isMember && !isGuest && (
        <div className="mb-6 flex gap-2">
          <Link
            href="/login"
            className="flex h-10 flex-1 items-center justify-center rounded-xl border border-border text-sm font-medium text-foreground"
          >
            로그인
          </Link>
          <Link
            href="/signup"
            className="flex h-10 flex-1 items-center justify-center rounded-xl bg-foreground text-sm font-semibold text-white"
          >
            회원가입
          </Link>
        </div>
      )}

      <MembershipStatusCard
        membership={membership}
        isPremium={isPremium}
        onUpgrade={() => {
          window.location.href = "/premium";
        }}
        onManage={() => {
          window.location.href = "/premium";
        }}
        className="mb-6"
      />

      <AdSlot placementId="mypage_membership_below" className="mb-6" />

      <nav className="flex flex-col gap-2">
        {[
          {
            href: "/chat",
            label: "AI 상담",
            desc: "PreFit AI 실장과 대화 · 화장품 추천",
          },
          {
            href: "/simulate",
            label: "가상 성형 시뮬레이터",
            desc: isPremium ? "무제한 Before / After" : "월 1회 무료 체험",
          },
          {
            href: "/premium",
            label: "Premium 멤버십",
            desc: isPremium ? "구독 관리 · 혜택 확인" : "9,900원/월부터",
          },
          {
            href: "/trend",
            label: "트렌드 라운지",
            desc: "실시간 Q&A 피드",
          },
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

      {(isMember || isGuest) && (
        <button
          type="button"
          onClick={handleLogout}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl border border-border/60 bg-surface py-3.5 text-sm font-medium text-muted transition hover:border-border hover:text-foreground"
        >
          <LogOut className="h-4 w-4" />
          로그아웃
        </button>
      )}

      <div className="mt-6 rounded-2xl border border-lavender/20 bg-lavender/5 p-4">
        <p className="text-xs font-semibold text-foreground">수익 모델 안내</p>
        <p className="mt-1.5 text-[11px] leading-relaxed text-muted">
          AI 상담 중 표시되는{" "}
          <span className="text-foreground">화장품·뷰티 기기</span>는 제휴 광고이며,
          Premium 구독은{" "}
          <span className="text-foreground">가상 성형·피부 분석</span> 전용입니다.
        </p>
      </div>

      <p className="mt-8 flex items-center justify-center gap-1.5 text-[10px] text-muted">
        <Sparkles className="h-3 w-3" />
        PreFit · 검증된 전문의 데이터 기반
      </p>
    </div>
  );
}
