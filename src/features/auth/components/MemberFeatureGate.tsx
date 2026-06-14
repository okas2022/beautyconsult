"use client";

import Link from "next/link";
import { useAuthStore } from "@/features/auth/store/authStore";

interface MemberFeatureGateProps {
  children: React.ReactNode;
  featureLabel?: string;
}

/** 회원(비게스트)만 이용 가능한 기능 — 시뮬레이터·프리미엄 등 */
export function MemberFeatureGate({
  children,
  featureLabel = "이 기능",
}: MemberFeatureGateProps) {
  const hydrated = useAuthStore((s) => s.hydrated);
  const mode = useAuthStore((s) => s.mode);
  const member = useAuthStore((s) => s.member);

  const isMember = mode === "member" && member !== null && !member.is_guest;

  if (!hydrated) {
    return (
      <div className="flex flex-1 items-center justify-center p-8 text-sm text-muted">
        불러오는 중…
      </div>
    );
  }

  if (isMember) {
    return <>{children}</>;
  }

  const isGuest = mode === "guest" && member?.is_guest;

  return (
    <>
      <div className="mx-auto flex max-w-lg flex-1 flex-col items-center justify-center px-6 py-16 text-center">
        <p className="text-base font-semibold text-foreground">
          회원가입 후 이용 가능합니다
        </p>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          {isGuest
            ? `둘러보기 모드에서는 ${featureLabel}을(를) 이용할 수 없습니다. 회원가입 후 전체 기능을 이용해 주세요.`
            : `${featureLabel}은(는) 로그인 또는 회원가입 후 이용하실 수 있습니다.`}
        </p>
        <div className="mt-6 flex w-full max-w-xs flex-col gap-2">
          <Link
            href="/signup"
            className="flex h-11 items-center justify-center rounded-xl bg-foreground text-sm font-semibold text-white"
          >
            회원가입
          </Link>
          <Link
            href="/login"
            className="flex h-11 items-center justify-center rounded-xl border border-border text-sm font-medium text-foreground"
          >
            로그인
          </Link>
          {!isGuest && (
            <Link
              href="/"
              className="py-2 text-sm text-muted underline-offset-2 hover:text-foreground hover:underline"
            >
              앱 소개 · 둘러보기
            </Link>
          )}
        </div>
      </div>
    </>
  );
}
