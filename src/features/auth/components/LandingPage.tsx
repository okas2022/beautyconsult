"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Sparkles, MessageCircle, ScanFace, TrendingUp } from "lucide-react";
import { useAuthStore } from "@/features/auth/store/authStore";
import { toast } from "sonner";

export function LandingPage() {
  const router = useRouter();
  const setMember = useAuthStore((s) => s.setMember);

  const startGuest = async () => {
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "guest" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMember(data.member, "guest");
      toast.success("둘러보기 모드로 시작합니다. 일부 기능은 회원가입 후 이용 가능합니다.");
      router.push("/trend");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "둘러보기 시작 실패");
    }
  };

  return (
    <div className="mx-auto flex min-h-dvh max-w-lg flex-col px-5 pb-10 pt-12">
      <div className="mb-10 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-mint/15">
          <Sparkles className="h-8 w-8 text-mint-dark" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          PreFit
        </h1>
        <p className="mt-2 text-sm text-muted">
          AI 피부·성형 컨시어지
        </p>
        <p className="mt-4 text-[13px] leading-relaxed text-muted">
          검증된 전문의 유튜브 답변 기반 AI 상담, 트렌드, 가상 성형까지
          <br />
          한 곳에서 경험하세요.
        </p>
      </div>

      <div className="mb-8 grid grid-cols-3 gap-3">
        {[
          { icon: MessageCircle, label: "AI 상담" },
          { icon: TrendingUp, label: "트렌드" },
          { icon: ScanFace, label: "가상 성형" },
        ].map(({ icon: Icon, label }) => (
          <div
            key={label}
            className="flex flex-col items-center gap-2 rounded-2xl border border-border/60 bg-surface px-2 py-4"
          >
            <Icon className="h-5 w-5 text-mint-dark" />
            <span className="text-[11px] font-medium text-foreground">{label}</span>
          </div>
        ))}
      </div>

      <div className="mt-auto flex flex-col gap-3">
        <Link
          href="/signup"
          className="flex h-12 items-center justify-center rounded-2xl bg-foreground text-sm font-semibold text-white transition hover:bg-foreground/90"
        >
          회원가입
        </Link>
        <Link
          href="/login"
          className="flex h-12 items-center justify-center rounded-2xl border border-border bg-surface text-sm font-semibold text-foreground transition hover:bg-foreground/[0.03]"
        >
          로그인
        </Link>
        <button
          type="button"
          onClick={() => void startGuest()}
          className="py-2 text-sm text-muted underline-offset-2 hover:text-foreground hover:underline"
        >
          둘러보기 — 메뉴·일부 기능만 체험
        </button>
      </div>

      <p className="mt-6 text-center text-[10px] leading-relaxed text-muted">
        둘러보기는 트렌드 열람·제한적 상담만 가능합니다.
        <br />
        AI 상담·시뮬레이터·프리미엄은 회원가입 후 이용해 주세요.
      </p>
    </div>
  );
}
